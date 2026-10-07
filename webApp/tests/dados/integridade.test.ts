import { existsSync, readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { ITENS_CHECKLIST } from "@/dados/checklist";
import * as DICAS from "@/dados/dicas";
import { ALTURA_MAPA, BATE_VOLTAS, CAMINHO_ROTA, LARGURA_MAPA, PARADA_INICIAL, PARADAS } from "@/dados/paradas";
import { ehTrechoId, IDS_TRECHOS, obterTrecho, TRECHOS, TRECHOS_COM_BASE, TRECHOS_COM_LUGARES } from "@/dados/trechos";
import { TIPOS_LUGAR } from "@/services/lugares/lugares.service";

const IDS_CHECKLIST_ESPERADOS = [
  "passaportes",
  "regras-schengen",
  "etias",
  "seguro-viagem",
  "passagens",
  "hoteis",
  "trens",
  "ingressos",
  "vendemmia",
  "transporte-cinque-terre",
  "barco-amalfi",
  "carro-san-giovanni",
  "reserva-emergencia",
  "esim",
  "adaptador",
  "bagagem",
];

const IDS_TRECHOS_ESPERADOS = ["roma", "napoles", "amalfi", "sangiovanni", "umbria", "toscana", "cinque", "norte"];

// Rota aprovada: rótulo de dias, dias listados e noites de cada trecho.
const ROTA_ESPERADA: { id: string; dias: string; listados: number[]; noites: number }[] = [
  { id: "roma", dias: "Dias 1–5", listados: [1, 2, 3, 4, 5], noites: 5 },
  { id: "napoles", dias: "Dias 6–7", listados: [6, 7], noites: 2 },
  { id: "amalfi", dias: "Dias 8–9", listados: [8, 9], noites: 2 },
  { id: "sangiovanni", dias: "Dias 10–11", listados: [10, 11], noites: 2 },
  { id: "umbria", dias: "Dias 12–14", listados: [12, 13, 14], noites: 3 },
  { id: "toscana", dias: "Dias 15–18", listados: [15, 16, 17, 18], noites: 4 },
  { id: "cinque", dias: "Dias 19–21", listados: [19, 20, 21], noites: 3 },
  { id: "norte", dias: "Dias 22–24", listados: [22, 23, 24], noites: 3 },
];

// Cidade-base e bairro aprovado para a hospedagem de cada trecho.
const BASES_ESPERADAS: { id: string; base: string; bairro: string }[] = [
  { id: "roma", base: "Roma", bairro: "Prati" },
  { id: "napoles", base: "Nápoles", bairro: "Chiaia" },
  { id: "amalfi", base: "Amalfi", bairro: "porto" },
  { id: "sangiovanni", base: "San Giovanni Rotondo", bairro: "santuário" },
  { id: "umbria", base: "Assis", bairro: "Piazza del Comune" },
  { id: "toscana", base: "Florença", bairro: "Santa Maria Novella" },
  { id: "cinque", base: "La Spezia", bairro: "La Spezia Centrale" },
  { id: "norte", base: "Milão", bairro: "Estação Central" },
];

// Paradas do mapa, na ordem da animação.
const IDS_PARADAS_ESPERADOS = ["roma", "napoles", "pompeia", "amalfi", "sangiovanni", "assis", "florenca", "pisa", "cinque", "milao", "como"];

// Paradas por onde o traço da rota passa, na ordem (Pompeia e Como são bate-voltas).
const PARADAS_DA_ROTA = ["roma", "napoles", "amalfi", "sangiovanni", "assis", "florenca", "pisa", "cinque", "milao"];

const ULTIMO_DIA = 25;

// "Dias 6–9" -> [6, 9]; "dia 15" -> [15, 15].
const intervaloDeDias = (texto: string): [number, number] => {
  const partes = /^dias?\s+(\d+)(?:[–-](\d+))?$/i.exec(texto.trim());
  if (!partes) throw new Error(`Texto de dias fora do padrão: "${texto}"`);
  const inicio = Number(partes[1]);
  return [inicio, partes[2] ? Number(partes[2]) : inicio];
};

// Pontos "x,y" de um caminho SVG, na ordem em que aparecem (âncoras e controles).
const pontosDoCaminho = (caminho: string): string[] => caminho.match(/-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?/g) ?? [];

const coordenadasDe = (id: string): string => {
  const parada = PARADAS.find((p) => p.id === id);
  if (!parada) throw new Error(`Parada ausente do mapa: ${id}`);
  return `${parada.x},${parada.y}`;
};

// Veneza, Verona e Cássia saíram do roteiro: nenhum texto pode continuar
// citando essas cidades nem o que só existia nelas.
const FORA_DA_ROTA = /veneza|verona|murano|burano|vaporetto|c[áa]ssia/i;

// Arquivos de código do webApp/src, com caminho relativo a essa pasta.
const PASTA_SRC = fileURLToPath(new URL("../../src/", import.meta.url));

const arquivosDoSrc = (): string[] =>
  readdirSync(PASTA_SRC, { recursive: true, encoding: "utf8" })
    .map((caminho) => caminho.replaceAll("\\", "/"))
    .filter((caminho) => /\.(tsx?|jsx?|css|json|md)$/.test(caminho));

describe("itens do checklist", () => {
  it("deve ter exatamente os 16 ids combinados com a API, na ordem", () => {
    expect(ITENS_CHECKLIST.map((item) => item.id)).toEqual(IDS_CHECKLIST_ESPERADOS);
  });

  it("deve trazer o carro de San Giovanni Rotondo logo depois do barco de Amalfi", () => {
    const ids = ITENS_CHECKLIST.map((item) => item.id);

    expect(ids[ids.indexOf("barco-amalfi") + 1]).toBe("carro-san-giovanni");
  });

  it("deve ter ids únicos", () => {
    const ids = ITENS_CHECKLIST.map((item) => item.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("deve ter texto preenchido em todos os itens", () => {
    expect(ITENS_CHECKLIST.filter((item) => !item.texto.trim())).toEqual([]);
  });

  it("não deve citar lugares que saíram da rota em nenhum item", () => {
    expect(ITENS_CHECKLIST.filter((item) => FORA_DA_ROTA.test(item.texto)).map((item) => item.id)).toEqual([]);
  });
});

describe("trechos", () => {
  it("deve ter os 8 trechos que aceitam lugares, na ordem da viagem", () => {
    expect([...IDS_TRECHOS]).toEqual(IDS_TRECHOS_ESPERADOS);
  });

  it("deve ter um capítulo para cada trecho mais o retorno no fim", () => {
    expect(TRECHOS.map((trecho) => trecho.id)).toEqual([...IDS_TRECHOS_ESPERADOS, "retorno"]);
  });

  it("não deve oferecer grade de lugares para o retorno", () => {
    expect(TRECHOS_COM_LUGARES.map((trecho) => trecho.id)).toEqual(IDS_TRECHOS_ESPERADOS);
  });

  it("não deve aceitar retorno como trecho de lugar", () => {
    expect(ehTrechoId("retorno")).toBe(false);
  });

  it("deve aceitar cada um dos 8 ids como trecho de lugar", () => {
    expect(IDS_TRECHOS_ESPERADOS.filter((id) => !ehTrechoId(id))).toEqual([]);
  });

  it("não deve aceitar um id desconhecido como trecho de lugar", () => {
    expect(ehTrechoId("sicilia")).toBe(false);
  });

  it("não deve mais aceitar veneza como trecho de lugar", () => {
    expect(ehTrechoId("veneza")).toBe(false);
    expect(obterTrecho("veneza")).toBeUndefined();
  });

  it("deve deixar o retorno sem cidade-base e fora da tabela de hospedagem", () => {
    expect(obterTrecho("retorno")?.base).toBeNull();
    expect(TRECHOS_COM_BASE.map((trecho) => trecho.id)).toEqual(IDS_TRECHOS_ESPERADOS);
  });

  it("deve ter base, noites e estadia em todo trecho com hospedagem", () => {
    const incompletos = TRECHOS_COM_BASE.filter((trecho) => !trecho.base?.trim() || !trecho.estadia?.trim() || !(Number(trecho.noites) > 0));

    expect(incompletos.map((trecho) => trecho.id)).toEqual([]);
  });

  it("deve devolver undefined ao procurar um trecho que não existe", () => {
    expect(obterTrecho("sicilia")).toBeUndefined();
  });

  it("deve ter ids únicos", () => {
    const ids = TRECHOS.map((trecho) => trecho.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("deve somar 24 noites, uma a menos que os dias da viagem", () => {
    const noites = TRECHOS.reduce((soma, trecho) => soma + (trecho.noites ?? 0), 0);

    expect(noites).toBe(ULTIMO_DIA - 1);
  });

  it("deve ter em cada trecho com hospedagem tantas noites quantos dias listados", () => {
    const divergentes = TRECHOS_COM_BASE.filter((trecho) => trecho.noites !== trecho.itens.length);

    expect(divergentes.map((trecho) => trecho.id)).toEqual([]);
  });

  it("deve deixar o retorno sem noites", () => {
    expect(obterTrecho("retorno")?.noites).toBeUndefined();
  });

  it("deve fazer o retorno no dia 25", () => {
    expect(obterTrecho("retorno")?.itens.map((item) => item.dia)).toEqual([ULTIMO_DIA]);
  });

  it.each(ROTA_ESPERADA)("deve ter $id nos $dias, com $noites noites", ({ id, dias, listados, noites }) => {
    const trecho = obterTrecho(id);

    expect(trecho).toMatchObject({ dias, noites });
    expect(trecho?.itens.map((item) => item.dia)).toEqual(listados);
  });

  it.each(BASES_ESPERADAS)("deve ter $base como base de $id", ({ id, base }) => {
    expect(obterTrecho(id)?.base).toBe(base);
  });

  it.each(BASES_ESPERADAS)("deve citar $bairro na estadia de $base", ({ id, bairro }) => {
    expect(obterTrecho(id)?.estadia).toContain(bairro);
  });

  it("deve terminar a viagem em Milão, o último trecho com hospedagem", () => {
    expect(TRECHOS_COM_BASE.at(-1)).toMatchObject({ id: "norte", titulo: "Milão", base: "Milão" });
  });

  it("não deve citar lugares que saíram da rota em nenhum texto dos trechos", () => {
    expect(JSON.stringify(TRECHOS)).not.toMatch(FORA_DA_ROTA);
  });
});

describe("dias do roteiro", () => {
  it("deve cobrir os dias de 1 a 25, em ordem, sem buracos nem repetição", () => {
    const dias = TRECHOS.flatMap((trecho) => trecho.itens.map((item) => item.dia));

    expect(dias).toEqual(Array.from({ length: ULTIMO_DIA }, (_, i) => i + 1));
  });

  it.each(TRECHOS)("deve ter o rótulo de dias de $id igual aos dias listados nele", (trecho) => {
    const dias = trecho.itens.map((item) => item.dia);

    expect(intervaloDeDias(trecho.dias)).toEqual([Math.min(...dias), Math.max(...dias)]);
  });

  it("deve ter título e ao menos uma parada em todo dia", () => {
    const vazios = TRECHOS.flatMap((trecho) => trecho.itens).filter((item) => !item.titulo.trim() || item.paradas.length === 0);

    expect(vazios.map((item) => item.dia)).toEqual([]);
  });

  it("deve começar o dia 19 por Florença → Pisa", () => {
    const dia19 = TRECHOS.flatMap((trecho) => trecho.itens).find((item) => item.dia === 19);

    expect(dia19?.paradas[0]).toBe("Florença → Pisa");
  });

  it("não deve repetir chip dentro do mesmo dia", () => {
    const repetidos = TRECHOS.flatMap((trecho) => trecho.itens).filter((item) => new Set(item.paradas.map((chip) => chip.trim().toLowerCase())).size !== item.paradas.length);

    expect(repetidos.map((item) => item.dia)).toEqual([]);
  });
});

describe("dicas", () => {
  it("não deve citar lugares que saíram da rota em nenhuma dica", () => {
    expect(JSON.stringify(DICAS)).not.toMatch(FORA_DA_ROTA);
  });
});

describe("paradas do mapa", () => {
  it("deve apontar toda parada para um trecho existente", () => {
    const orfas = PARADAS.filter((parada) => !TRECHOS_COM_LUGARES.some((trecho) => trecho.id === parada.trecho));

    expect(orfas.map((parada) => parada.id)).toEqual([]);
  });

  it("deve ter ao menos uma parada em cada trecho", () => {
    const semParada = IDS_TRECHOS.filter((id) => !PARADAS.some((parada) => parada.trecho === id));

    expect(semParada).toEqual([]);
  });

  it("deve ter exatamente as paradas do roteiro, na ordem da viagem", () => {
    expect(PARADAS.map((parada) => parada.id)).toEqual(IDS_PARADAS_ESPERADOS);
  });

  it("deve ter uma única cidade-base em cada um dos 8 trechos", () => {
    const bases = IDS_TRECHOS_ESPERADOS.map((id) => PARADAS.filter((parada) => parada.trecho === id && parada.base).length);

    expect(bases).toEqual(IDS_TRECHOS_ESPERADOS.map(() => 1));
  });

  it("deve ter Assis como a cidade-base da Úmbria", () => {
    const bases = PARADAS.filter((parada) => parada.trecho === "umbria" && parada.base);

    expect(bases.map((parada) => parada.id)).toEqual(["assis"]);
  });

  it("deve ter como base, na ordem, Roma, Nápoles, Amalfi, San Giovanni Rotondo, Assis, Florença, Cinque Terre e Milão", () => {
    const bases = PARADAS.filter((parada) => parada.base).map((parada) => parada.id);

    expect(bases).toEqual(["roma", "napoles", "amalfi", "sangiovanni", "assis", "florenca", "cinque", "milao"]);
  });

  it("deve mostrar Florença nos dias 15–18", () => {
    expect(PARADAS.find((parada) => parada.id === "florenca")?.dias).toBe("dias 15–18");
  });

  it("não deve citar lugares que saíram da rota em nenhuma parada", () => {
    expect(JSON.stringify(PARADAS)).not.toMatch(FORA_DA_ROTA);
  });

  it("deve começar o caminho da rota nas coordenadas de Roma", () => {
    expect(CAMINHO_ROTA.startsWith(`M${coordenadasDe("roma")} `)).toBe(true);
  });

  it("deve terminar o caminho da rota nas coordenadas de Milão", () => {
    expect(CAMINHO_ROTA.endsWith(` ${coordenadasDe("milao")}`)).toBe(true);
  });

  it("deve passar o caminho da rota pelas 9 paradas do percurso, na ordem da viagem", () => {
    const pontos = pontosDoCaminho(CAMINHO_ROTA);
    const posicoes = PARADAS_DA_ROTA.map((id) => pontos.indexOf(coordenadasDe(id)));

    expect(PARADAS_DA_ROTA.filter((_, i) => posicoes[i] < 0)).toEqual([]);
    expect(posicoes).toEqual([...posicoes].sort((a, b) => a - b));
  });

  it("deve desenhar a rota num traço só, sem levantar a pena", () => {
    expect(CAMINHO_ROTA.match(/M/gi)).toHaveLength(1);
  });

  it("não deve passar o caminho da rota pelas paradas de bate-volta", () => {
    const pontos = pontosDoCaminho(CAMINHO_ROTA);

    expect(["pompeia", "como"].filter((id) => pontos.includes(coordenadasDe(id)))).toEqual([]);
  });

  it("deve colocar Pisa no trecho de Cinque Terre, como parada de passagem", () => {
    const pisa = PARADAS.find((parada) => parada.id === "pisa");

    expect(pisa?.trecho).toBe("cinque");
    expect(pisa?.base).toBeFalsy();
  });

  it("deve ter ids únicos", () => {
    const ids = PARADAS.map((parada) => parada.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  // Os bate-voltas são identificados como "de-para": um hífen no id de uma
  // parada quebraria essa leitura.
  it("não deve ter hífen no id de nenhuma parada", () => {
    expect(PARADAS.filter((parada) => parada.id.includes("-")).map((parada) => parada.id)).toEqual([]);
  });

  it("deve usar o mapa de 440 x 500", () => {
    expect([LARGURA_MAPA, ALTURA_MAPA]).toEqual([440, 500]);
  });

  it("deve ficar dentro da área do mapa", () => {
    const fora = PARADAS.filter((parada) => parada.x < 0 || parada.x > LARGURA_MAPA || parada.y < 0 || parada.y > ALTURA_MAPA);

    expect(fora.map((parada) => parada.id)).toEqual([]);
  });

  // Confere só o ponto de ancoragem do rótulo (x + rotuloX, y + rotuloY); a
  // largura do texto depende da fonte e não é medida aqui.
  it("deve ancorar todo rótulo dentro da área do mapa", () => {
    const fora = PARADAS.filter((parada) => {
      const x = parada.x + parada.rotuloX;
      const y = parada.y + parada.rotuloY;
      return x < 0 || x > LARGURA_MAPA || y < 0 || y > ALTURA_MAPA;
    });

    expect(fora.map((parada) => parada.id)).toEqual([]);
  });

  it("deve ter nome preenchido em toda parada", () => {
    expect(PARADAS.filter((parada) => !parada.nome.trim()).map((parada) => parada.id)).toEqual([]);
  });

  it.each(PARADAS)("deve ter os dias de $id dentro dos dias do trecho", (parada) => {
    const [inicioTrecho, fimTrecho] = intervaloDeDias(obterTrecho(parada.trecho)?.dias ?? "");
    const [inicio, fim] = intervaloDeDias(parada.dias);

    expect(inicio).toBeGreaterThanOrEqual(inicioTrecho);
    expect(fim).toBeLessThanOrEqual(fimTrecho);
    expect(inicio).toBeLessThanOrEqual(fim);
  });

  it("deve começar a viagem em Roma", () => {
    expect(PARADA_INICIAL.id).toBe("roma");
  });

  it("deve ter os bate-voltas Nápoles → Pompeia e Milão → Como", () => {
    expect(BATE_VOLTAS.map(({ id }) => id)).toEqual(["napoles-pompeia", "milao-como"]);
  });

  it.each(BATE_VOLTAS)("deve ligar em linha reta as duas paradas de $id", ({ id, d }) => {
    const [de, para] = id.split("-");

    expect(d).toBe(`M${coordenadasDe(de)} L${coordenadasDe(para)}`);
  });

  it("deve ligar cada bate-volta a duas paradas do mesmo trecho", () => {
    const pares = BATE_VOLTAS.map(({ id }) => id.split("-").map((idParada) => PARADAS.find((parada) => parada.id === idParada)?.trecho));

    expect(pares.filter(([de, para]) => !de || de !== para)).toEqual([]);
  });
});

// Os textos soltos dos componentes (hero, dicas, orçamento...) não passam pelos
// dados acima: a varredura lê os arquivos do src e aponta arquivo:linha.
describe("textos do webApp/src", () => {
  it("deve encontrar os arquivos do src para varrer", () => {
    const arquivos = arquivosDoSrc();

    expect(arquivos).toContain("dados/trechos.ts");
    expect(arquivos.some((caminho) => caminho.startsWith("components/"))).toBe(true);
  });

  it("não deve citar lugares que saíram da rota em nenhum arquivo", () => {
    const citacoes = arquivosDoSrc().flatMap((caminho) =>
      readFileSync(`${PASTA_SRC}${caminho}`, "utf8")
        .split("\n")
        .flatMap((linha, i) => (FORA_DA_ROTA.test(linha) ? [`${caminho}:${i + 1}: ${linha.trim()}`] : [])),
    );

    expect(citacoes).toEqual([]);
  });
});

// Leitura (somente leitura) das constantes do webApi, para garantir que o
// front e a API usam os mesmos ids. Fora do repositório completo (só o webApp
// disponível), estes testes são pulados.
const lerConstanteDaApi = (caminhoRelativo: string, nome: string): string[] | null => {
  const arquivo = fileURLToPath(new URL(`../../../webApi/src/modules/${caminhoRelativo}`, import.meta.url));
  if (!existsSync(arquivo)) return null;
  const trecho = new RegExp(`export const ${nome}\\s*=\\s*\\[([\\s\\S]*?)\\]`).exec(readFileSync(arquivo, "utf8"));
  if (!trecho) throw new Error(`Constante ${nome} não encontrada em ${arquivo}`);
  return Array.from(trecho[1].matchAll(/"([^"]+)"/g), (achado) => achado[1]);
};

const checklistDaApi = lerConstanteDaApi("checklist/checklist.constantes.ts", "ITENS_CHECKLIST");
const trechosDaApi = lerConstanteDaApi("lugares/lugares.constantes.ts", "TRECHOS");
const tiposDaApi = lerConstanteDaApi("lugares/lugares.constantes.ts", "TIPOS_DE_LUGAR");

describe("ids do front e da API", () => {
  it.skipIf(!checklistDaApi)("deve usar no checklist os mesmos ids que a API valida", () => {
    expect(ITENS_CHECKLIST.map((item) => item.id)).toEqual(checklistDaApi);
  });

  it.skipIf(!trechosDaApi)("deve usar os mesmos trechos que a API valida", () => {
    expect([...IDS_TRECHOS]).toEqual(trechosDaApi);
  });

  it.skipIf(!trechosDaApi)("deve ter na API os 8 trechos da rota, na ordem, sem veneza", () => {
    expect(trechosDaApi).toEqual(IDS_TRECHOS_ESPERADOS);
  });

  it.skipIf(!tiposDaApi)("deve usar os mesmos tipos de lugar que a API valida", () => {
    expect([...TIPOS_LUGAR]).toEqual(tiposDaApi);
  });
});
