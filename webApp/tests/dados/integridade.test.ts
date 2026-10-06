import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { ITENS_CHECKLIST } from "@/dados/checklist";
import * as DICAS from "@/dados/dicas";
import { ALTURA_MAPA, BATE_VOLTAS, CAMINHO_NORTE, LARGURA_MAPA, PARADA_INICIAL, PARADAS } from "@/dados/paradas";
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

const IDS_TRECHOS_ESPERADOS = ["roma", "umbria", "toscana", "cinque", "veneza", "norte", "napoles", "sangiovanni", "amalfi"];

// Paradas do mapa, na ordem da animação.
const IDS_PARADAS_ESPERADOS = [
  "roma",
  "assis",
  "florenca",
  "pisa",
  "cinque",
  "veneza",
  "verona",
  "milao",
  "napoles",
  "pompeia",
  "sangiovanni",
  "amalfi",
];

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

// Cássia saiu do roteiro: nenhum texto pode continuar citando a cidade.
const CITA_CASSIA = /c[áa]ssia/i;

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
});

describe("trechos", () => {
  it("deve ter os 9 trechos que aceitam lugares, na ordem da viagem", () => {
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

  it("deve aceitar cada um dos 9 ids como trecho de lugar", () => {
    expect(IDS_TRECHOS_ESPERADOS.filter((id) => !ehTrechoId(id))).toEqual([]);
  });

  it("não deve aceitar um id desconhecido como trecho de lugar", () => {
    expect(ehTrechoId("sicilia")).toBe(false);
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

  it("deve ter uma única noite em Amalfi, no dia 24", () => {
    const amalfi = obterTrecho("amalfi");

    expect(amalfi?.noites).toBe(1);
    expect(amalfi?.itens.map((item) => item.dia)).toEqual([24]);
  });

  it("deve fazer o retorno no dia 25", () => {
    expect(obterTrecho("retorno")?.itens.map((item) => item.dia)).toEqual([ULTIMO_DIA]);
  });

  it("deve ter Assis como base da Úmbria, com 2 noites nos dias 6–7", () => {
    const umbria = obterTrecho("umbria");

    expect(umbria).toMatchObject({ titulo: "Assis", dias: "Dias 6–7", base: "Assis", noites: 2 });
    expect(umbria?.itens.map((item) => item.dia)).toEqual([6, 7]);
  });

  it("deve ter 4 noites na Toscana, nos dias 8–11", () => {
    const toscana = obterTrecho("toscana");

    expect(toscana).toMatchObject({ dias: "Dias 8–11", noites: 4 });
    expect(toscana?.itens.map((item) => item.dia)).toEqual([8, 9, 10, 11]);
  });

  it("deve somar 11 noites entre Roma, Assis e Florença", () => {
    const noites = ["roma", "umbria", "toscana"].map((id) => obterTrecho(id)?.noites);

    expect(noites.reduce<number>((soma, valor) => soma + (valor ?? 0), 0)).toBe(11);
  });

  it("não deve citar Cássia em nenhum texto dos trechos", () => {
    expect(JSON.stringify(TRECHOS)).not.toMatch(CITA_CASSIA);
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

  it("deve continuar começando o dia 12 por Florença → Pisa", () => {
    const dia12 = TRECHOS.flatMap((trecho) => trecho.itens).find((item) => item.dia === 12);

    expect(dia12?.paradas[0]).toBe("Florença → Pisa");
  });

  it("não deve repetir chip dentro do mesmo dia", () => {
    const repetidos = TRECHOS.flatMap((trecho) => trecho.itens).filter((item) => new Set(item.paradas.map((chip) => chip.trim().toLowerCase())).size !== item.paradas.length);

    expect(repetidos.map((item) => item.dia)).toEqual([]);
  });
});

describe("dicas", () => {
  it("não deve citar Cássia em nenhuma dica", () => {
    expect(JSON.stringify(DICAS)).not.toMatch(CITA_CASSIA);
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

  it("deve ter uma única cidade-base em cada um dos 9 trechos", () => {
    const bases = IDS_TRECHOS_ESPERADOS.map((id) => PARADAS.filter((parada) => parada.trecho === id && parada.base).length);

    expect(bases).toEqual(IDS_TRECHOS_ESPERADOS.map(() => 1));
  });

  it("deve ter Assis como a cidade-base da Úmbria", () => {
    const bases = PARADAS.filter((parada) => parada.trecho === "umbria" && parada.base);

    expect(bases.map((parada) => parada.id)).toEqual(["assis"]);
  });

  it("deve mostrar Florença nos dias 8–11", () => {
    expect(PARADAS.find((parada) => parada.id === "florenca")?.dias).toBe("dias 8–11");
  });

  it("não deve citar Cássia em nenhuma parada", () => {
    expect(JSON.stringify(PARADAS)).not.toMatch(CITA_CASSIA);
  });

  it("deve começar o caminho do norte nas coordenadas de Roma", () => {
    expect(CAMINHO_NORTE.startsWith(`M${coordenadasDe("roma")} `)).toBe(true);
  });

  it("deve passar o caminho do norte por Roma, Assis e Florença, nessa ordem", () => {
    const pontos = pontosDoCaminho(CAMINHO_NORTE);
    const posicoes = ["roma", "assis", "florenca"].map((id) => pontos.indexOf(coordenadasDe(id)));

    expect(posicoes.every((posicao) => posicao >= 0)).toBe(true);
    expect(posicoes).toEqual([...posicoes].sort((a, b) => a - b));
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

  it("deve ter Nápoles → Pompeia como único bate-volta", () => {
    expect(BATE_VOLTAS.map(({ id }) => id)).toEqual(["napoles-pompeia"]);
  });

  it("deve ligar cada bate-volta a duas paradas do mesmo trecho", () => {
    const pares = BATE_VOLTAS.map(({ id }) => id.split("-").map((idParada) => PARADAS.find((parada) => parada.id === idParada)?.trecho));

    expect(pares.filter(([de, para]) => !de || de !== para)).toEqual([]);
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

  it.skipIf(!tiposDaApi)("deve usar os mesmos tipos de lugar que a API valida", () => {
    expect([...TIPOS_LUGAR]).toEqual(tiposDaApi);
  });
});
