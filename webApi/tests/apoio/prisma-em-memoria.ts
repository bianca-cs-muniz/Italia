// Dublê em memória do Prisma Client, usado no lugar de `src/database/data-source.ts`
// em todos os testes (ver setup.ts). Implementa só o que os repositories usam,
// com o mesmo comportamento observável do Prisma + Postgres:
//
//   lugar:            create, update (P2025 se o id não existe), deleteMany
//                     (com ON DELETE CASCADE nas fotos), findMany (include de
//                     fotos com select/orderBy), count
//   foto:             create, findUnique, findMany, count, deleteMany, updateMany
//   checklistMarcado: findMany, createMany (skipDuplicates), deleteMany
//   $transaction:     forma interativa; se a função lançar, tudo o que ela
//                     gravou é desfeito
//
// Qualquer coisa fora disso (operador, coluna ou opção desconhecida) lança um
// erro em vez de ser ignorada: se o código de produção passar a usar algo que
// o dublê não conhece, o teste quebra com uma mensagem clara.
//
// O que ele NÃO reproduz: SQL de verdade, os CHECKs da migração (tipoMime e
// tamanho das fotos), índices, isolamento entre transações e concorrência.

import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";

type Linha = Record<string, any>;
type NomeTabela = "lugares" | "fotos" | "checklist";

interface Estado {
  lugares: Linha[];
  fotos: Linha[];
  checklist: Linha[];
}

interface Modelo {
  nome: string;
  tabela: NomeTabela;
  chave: string;
  colunas: readonly string[];
  obrigatorias: readonly string[];
  padroes: () => Linha;
}

const VERSAO_CLIENTE = "dublê-em-memória";

const MODELOS = {
  lugar: {
    nome: "Lugar",
    tabela: "lugares",
    chave: "id",
    colunas: [
      "id",
      "trecho",
      "tipo",
      "nome",
      "resumo",
      "preco",
      "link",
      "descricao",
      "destaques",
      "criadoEm",
      "atualizadoEm",
    ],
    obrigatorias: ["trecho", "tipo", "nome"],
    padroes: () => ({
      id: randomUUID(),
      resumo: "",
      preco: "",
      link: "",
      descricao: "",
      destaques: [],
      criadoEm: new Date(),
      atualizadoEm: new Date(),
    }),
  },
  foto: {
    nome: "Foto",
    tabela: "fotos",
    chave: "id",
    colunas: ["id", "lugarId", "ordem", "tipoMime", "tamanho", "dados", "criadoEm"],
    obrigatorias: ["tipoMime", "tamanho", "dados"],
    padroes: () => ({ id: randomUUID(), lugarId: null, ordem: 0, criadoEm: new Date() }),
  },
  checklistMarcado: {
    nome: "ChecklistMarcado",
    tabela: "checklist",
    chave: "itemId",
    colunas: ["itemId", "marcadoEm"],
    obrigatorias: ["itemId"],
    padroes: () => ({ marcadoEm: new Date() }),
  },
} as const satisfies Record<string, Modelo>;

// Colunas do tipo uuid: o Postgres compara e devolve sempre em minúsculas.
const COLUNAS_UUID = new Set(["id", "lugarId"]);

let estado: Estado = { lugares: [], fotos: [], checklist: [] };

// Quantas vezes a coluna `dados` (os bytes da foto) saiu do "banco".
let leiturasDeDados = 0;

function naoImplementado(oQue: string): never {
  throw new Error(`[dublê do Prisma] não implementado: ${oQue}`);
}

function erroConhecido(codigo: string, mensagem: string) {
  return new Prisma.PrismaClientKnownRequestError(mensagem, { code: codigo, clientVersion: VERSAO_CLIENTE });
}

function normalizar(coluna: string, valor: any) {
  return COLUNAS_UUID.has(coluna) && typeof valor === "string" ? valor.toLowerCase() : valor;
}

function copiarValor(valor: any): any {
  if (Buffer.isBuffer(valor)) return Buffer.from(valor);
  if (valor instanceof Date) return new Date(valor.getTime());
  if (Array.isArray(valor)) return valor.map(copiarValor);
  return valor;
}

function copiarLinha(linha: Linha): Linha {
  return Object.fromEntries(Object.entries(linha).map(([coluna, valor]) => [coluna, copiarValor(valor)]));
}

function exigirColuna(modelo: Modelo, coluna: string, onde: string) {
  if (!modelo.colunas.includes(coluna)) naoImplementado(`coluna "${coluna}" em ${modelo.nome}.${onde}`);
}

function exigirOpcoes(modelo: Modelo, operacao: string, args: Linha | undefined, aceitas: string[]) {
  for (const opcao of Object.keys(args ?? {})) {
    if (!aceitas.includes(opcao)) naoImplementado(`opção "${opcao}" em ${modelo.nome}.${operacao}`);
  }
}

// ---------------------------------------------------------------- where

function iguais(coluna: string, a: any, b: any) {
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
  return normalizar(coluna, a) === normalizar(coluna, b);
}

function atende(modelo: Modelo, linha: Linha, where: Linha | undefined): boolean {
  if (!where) return true;

  return Object.entries(where).every(([coluna, condicao]) => {
    if (condicao === undefined) return true; // o Prisma ignora filtros `undefined`
    if (coluna === "OR") return (condicao as Linha[]).some((w) => atende(modelo, linha, w));
    if (coluna === "AND") return ([] as Linha[]).concat(condicao).every((w) => atende(modelo, linha, w));
    exigirColuna(modelo, coluna, "where");

    const valor = linha[coluna];
    const ehValorDireto = condicao === null || typeof condicao !== "object" || condicao instanceof Date;
    if (ehValorDireto) return iguais(coluna, valor, condicao);

    return Object.entries(condicao as Linha).every(([operador, alvo]) => {
      // Como no SQL: comparar NULL com qualquer coisa (fora o "equals null") nunca é verdadeiro.
      switch (operador) {
        case "equals":
          return iguais(coluna, valor, alvo);
        case "lt":
          return valor !== null && valor < alvo;
        case "lte":
          return valor !== null && valor <= alvo;
        case "gt":
          return valor !== null && valor > alvo;
        case "gte":
          return valor !== null && valor >= alvo;
        case "in":
          return (alvo as any[]).some((item) => iguais(coluna, valor, item));
        case "notIn":
          return valor !== null && !(alvo as any[]).some((item) => iguais(coluna, valor, item));
        default:
          return naoImplementado(`operador "${operador}" em ${modelo.nome}.where.${coluna}`);
      }
    });
  });
}

// ---------------------------------------------------------------- orderBy

function ordenar(modelo: Modelo, linhas: Linha[], orderBy: Linha | Linha[] | undefined) {
  const criterios = ([] as Linha[]).concat(orderBy ?? []).flatMap((criterio) => Object.entries(criterio));
  for (const [coluna, direcao] of criterios) {
    exigirColuna(modelo, coluna, "orderBy");
    if (direcao !== "asc" && direcao !== "desc") naoImplementado(`direção "${direcao}" em orderBy`);
  }

  // Array.prototype.sort é estável: empates ficam na ordem de inserção.
  return [...linhas].sort((a, b) => {
    for (const [coluna, direcao] of criterios) {
      const va = a[coluna] instanceof Date ? a[coluna].getTime() : a[coluna];
      const vb = b[coluna] instanceof Date ? b[coluna].getTime() : b[coluna];
      if (va === vb) continue;
      const comparacao = va < vb ? -1 : 1;
      return direcao === "asc" ? comparacao : -comparacao;
    }
    return 0;
  });
}

// ---------------------------------------------------------------- select / include

function lerColuna(modelo: Modelo, linha: Linha, coluna: string) {
  if (modelo.nome === "Foto" && coluna === "dados") leiturasDeDados++;
  return copiarValor(linha[coluna]);
}

function resolverRelacao(modelo: Modelo, linha: Linha, relacao: string, args: any) {
  if (modelo.nome === "Lugar" && relacao === "fotos") {
    const argsDaRelacao = args === true ? {} : args;
    exigirOpcoes(MODELOS.foto, "fotos (relação)", argsDaRelacao, ["where", "select", "orderBy"]);
    return buscarVarios(MODELOS.foto, {
      ...argsDaRelacao,
      where: { AND: [{ lugarId: linha.id }, argsDaRelacao.where ?? {}] },
    });
  }
  return naoImplementado(`relação "${relacao}" em ${modelo.nome}`);
}

function projetar(modelo: Modelo, linha: Linha, args: Linha | undefined): Linha {
  if (args?.select && args?.include) throw new Error("[dublê do Prisma] use `select` ou `include`, não os dois.");

  if (args?.select) {
    const resultado: Linha = {};
    for (const [campo, pedido] of Object.entries(args.select)) {
      if (!pedido) continue;
      resultado[campo] = modelo.colunas.includes(campo)
        ? lerColuna(modelo, linha, campo)
        : resolverRelacao(modelo, linha, campo, pedido);
    }
    return resultado;
  }

  const resultado: Linha = {};
  for (const coluna of modelo.colunas) resultado[coluna] = lerColuna(modelo, linha, coluna);
  for (const [relacao, pedido] of Object.entries(args?.include ?? {})) {
    if (pedido) resultado[relacao] = resolverRelacao(modelo, linha, relacao, pedido);
  }
  return resultado;
}

// ---------------------------------------------------------------- escrita

// Regras que o próprio Postgres impõe a qualquer escrita.
function validarEscrita(modelo: Modelo, data: Linha) {
  for (const [coluna, valor] of Object.entries(data)) {
    exigirColuna(modelo, coluna, "data");
    const textos = Array.isArray(valor) ? valor : [valor];
    if (textos.some((texto) => typeof texto === "string" && texto.includes("\u0000"))) {
      // O Postgres recusa o byte NUL em colunas de texto.
      throw new Error(`invalid byte sequence for encoding "UTF8": 0x00 (coluna ${coluna})`);
    }
  }

  if (modelo.nome === "Foto" && data.lugarId != null) {
    const existe = estado.lugares.some((lugar) => iguais("id", lugar.id, data.lugarId));
    if (!existe) throw erroConhecido("P2003", "Foreign key constraint failed on the field: `fotos_lugarId_fkey`");
  }
}

function normalizarDados(data: Linha): Linha {
  return Object.fromEntries(
    Object.entries(data)
      .filter(([, valor]) => valor !== undefined)
      .map(([coluna, valor]) => [coluna, normalizar(coluna, copiarValor(valor))]),
  );
}

function inserir(modelo: Modelo, data: Linha): Linha {
  const dados = normalizarDados(data);
  validarEscrita(modelo, dados);
  for (const coluna of modelo.obrigatorias) {
    if (dados[coluna] === undefined || dados[coluna] === null) {
      throw new Error(`[dublê do Prisma] Argument \`${coluna}\` is missing (${modelo.nome}.create).`);
    }
  }

  const linha = { ...modelo.padroes(), ...dados };
  if (estado[modelo.tabela].some((outra) => iguais(modelo.chave, outra[modelo.chave], linha[modelo.chave]))) {
    throw erroConhecido("P2002", `Unique constraint failed on the fields: (\`${modelo.chave}\`)`);
  }
  estado[modelo.tabela].push(linha);
  return linha;
}

function buscarVarios(modelo: Modelo, args: Linha = {}): Linha[] {
  const linhas = estado[modelo.tabela].filter((linha) => atende(modelo, linha, args.where));
  return ordenar(modelo, linhas, args.orderBy).map((linha) => projetar(modelo, linha, args));
}

function criarDelegate(modelo: Modelo) {
  return {
    async create(args: Linha) {
      exigirOpcoes(modelo, "create", args, ["data", "select", "include"]);
      return projetar(modelo, inserir(modelo, args.data), args);
    },

    async createMany(args: Linha) {
      exigirOpcoes(modelo, "createMany", args, ["data", "skipDuplicates"]);
      const tabela = estado[modelo.tabela];
      let count = 0;
      for (const data of ([] as Linha[]).concat(args.data)) {
        const jaExiste = tabela.some((linha) => iguais(modelo.chave, linha[modelo.chave], data[modelo.chave]));
        if (jaExiste && args.skipDuplicates) continue; // ON CONFLICT DO NOTHING
        inserir(modelo, data);
        count++;
      }
      return { count };
    },

    async findMany(args: Linha = {}) {
      exigirOpcoes(modelo, "findMany", args, ["where", "select", "include", "orderBy"]);
      return buscarVarios(modelo, args);
    },

    async findUnique(args: Linha) {
      exigirOpcoes(modelo, "findUnique", args, ["where", "select", "include"]);
      const colunasDoFiltro = Object.keys(args.where ?? {});
      if (colunasDoFiltro.length !== 1 || colunasDoFiltro[0] !== modelo.chave) {
        naoImplementado(`${modelo.nome}.findUnique por algo diferente de "${modelo.chave}"`);
      }
      const linha = estado[modelo.tabela].find((candidata) => atende(modelo, candidata, args.where));
      return linha ? projetar(modelo, linha, args) : null;
    },

    async count(args: Linha = {}) {
      exigirOpcoes(modelo, "count", args, ["where"]);
      return estado[modelo.tabela].filter((linha) => atende(modelo, linha, args.where)).length;
    },

    async update(args: Linha) {
      exigirOpcoes(modelo, "update", args, ["where", "data", "select", "include"]);
      const linha = estado[modelo.tabela].find((candidata) => atende(modelo, candidata, args.where));
      if (!linha) {
        throw erroConhecido(
          "P2025",
          "An operation failed because it depends on one or more records that were required but not found. Record to update not found.",
        );
      }
      const dados = normalizarDados(args.data);
      validarEscrita(modelo, dados);
      Object.assign(linha, dados);
      if (modelo.nome === "Lugar") linha.atualizadoEm = new Date(); // @updatedAt
      return projetar(modelo, linha, args);
    },

    async updateMany(args: Linha) {
      exigirOpcoes(modelo, "updateMany", args, ["where", "data"]);
      const dados = normalizarDados(args.data);
      validarEscrita(modelo, dados);
      const linhas = estado[modelo.tabela].filter((linha) => atende(modelo, linha, args.where));
      for (const linha of linhas) {
        Object.assign(linha, dados);
        if (modelo.nome === "Lugar") linha.atualizadoEm = new Date();
      }
      return { count: linhas.length };
    },

    async deleteMany(args: Linha = {}) {
      exigirOpcoes(modelo, "deleteMany", args, ["where"]);
      const apagadas = estado[modelo.tabela].filter((linha) => atende(modelo, linha, args.where));
      estado[modelo.tabela] = estado[modelo.tabela].filter((linha) => !apagadas.includes(linha));
      if (modelo.nome === "Lugar") {
        // fotos.lugarId → lugares.id ON DELETE CASCADE
        const idsApagados = apagadas.map((lugar) => lugar.id);
        estado.fotos = estado.fotos.filter((foto) => !idsApagados.includes(foto.lugarId));
      }
      return { count: apagadas.length };
    },
  };
}

function fotografarEstado(): Estado {
  return {
    lugares: estado.lugares.map(copiarLinha),
    fotos: estado.fotos.map(copiarLinha),
    checklist: estado.checklist.map(copiarLinha),
  };
}

// O objeto que entra no lugar do `export default` de data-source.ts. Os
// delegates são sempre os mesmos objetos (os repositories guardam a
// referência no construtor); só os dados são zerados entre os testes.
export const prismaFalso = {
  lugar: criarDelegate(MODELOS.lugar),
  foto: criarDelegate(MODELOS.foto),
  checklistMarcado: criarDelegate(MODELOS.checklistMarcado),

  async $transaction(operacao: unknown, _opcoes?: unknown) {
    if (typeof operacao !== "function") return naoImplementado("$transaction com lista de operações");
    const antes = fotografarEstado();
    try {
      return await operacao(prismaFalso);
    } catch (err) {
      estado = antes; // ROLLBACK
      throw err;
    }
  },

  async $connect() {},
  async $disconnect() {},
};

// Acesso direto ao "banco" para os testes prepararem cenários que a API não
// permite montar (300 lugares, fotos antigas...) e conferirem o que ficou gravado.
export const banco = {
  reiniciar() {
    estado = { lugares: [], fotos: [], checklist: [] };
    leiturasDeDados = 0;
  },

  semearLugar(dados: Linha = {}): Linha {
    const linha = inserir(MODELOS.lugar, { trecho: "roma", tipo: "Outro", nome: "Lugar semeado", ...dados });
    return copiarLinha(linha);
  },

  semearFoto(dados: Linha = {}): Linha {
    const bytes = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
    const linha = inserir(MODELOS.foto, { tipoMime: "image/jpeg", tamanho: bytes.length, dados: bytes, ...dados });
    return copiarLinha(linha);
  },

  semearMarcado(itemId: string, marcadoEm: Date = new Date()): Linha {
    return copiarLinha(inserir(MODELOS.checklistMarcado, { itemId, marcadoEm }));
  },

  lugares: () => estado.lugares.map(copiarLinha),
  fotos: () => estado.fotos.map(copiarLinha),
  marcados: () => estado.checklist.map(copiarLinha),
  fotosOrfas: () => estado.fotos.filter((foto) => foto.lugarId === null).map(copiarLinha),
  fotosDoLugar: (lugarId: string) =>
    ordenar(
      MODELOS.foto,
      estado.fotos.filter((foto) => foto.lugarId === lugarId.toLowerCase()),
      { ordem: "asc" },
    ).map(copiarLinha),

  get leiturasDeDados() {
    return leiturasDeDados;
  },
};
