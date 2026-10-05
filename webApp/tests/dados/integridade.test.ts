import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { ITENS_CHECKLIST } from "@/dados/checklist";
import { ALTURA_MAPA, BATE_VOLTAS, LARGURA_MAPA, PARADA_INICIAL, PARADAS } from "@/dados/paradas";
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
  "reserva-emergencia",
  "esim",
  "adaptador",
  "bagagem",
];

const IDS_TRECHOS_ESPERADOS = ["roma", "toscana", "cinque", "veneza", "norte", "napoles", "amalfi"];

// "Dias 6–9" -> [6, 9]; "dia 15" -> [15, 15].
const intervaloDeDias = (texto: string): [number, number] => {
  const partes = /^dias?\s+(\d+)(?:[–-](\d+))?$/i.exec(texto.trim());
  if (!partes) throw new Error(`Texto de dias fora do padrão: "${texto}"`);
  const inicio = Number(partes[1]);
  return [inicio, partes[2] ? Number(partes[2]) : inicio];
};

describe("itens do checklist", () => {
  it("deve ter exatamente os 15 ids combinados com a API, na ordem", () => {
    expect(ITENS_CHECKLIST.map((item) => item.id)).toEqual(IDS_CHECKLIST_ESPERADOS);
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
  it("deve ter os 7 trechos que aceitam lugares, na ordem da viagem", () => {
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

  it("deve aceitar cada um dos 7 ids como trecho de lugar", () => {
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
});

describe("dias do roteiro", () => {
  it("deve cobrir os dias de 1 a 23, em ordem, sem buracos nem repetição", () => {
    const dias = TRECHOS.flatMap((trecho) => trecho.itens.map((item) => item.dia));

    expect(dias).toEqual(Array.from({ length: 23 }, (_, i) => i + 1));
  });

  it.each(TRECHOS)("deve ter o rótulo de dias de $id igual aos dias listados nele", (trecho) => {
    const dias = trecho.itens.map((item) => item.dia);

    expect(intervaloDeDias(trecho.dias)).toEqual([Math.min(...dias), Math.max(...dias)]);
  });

  it("deve ter título e ao menos uma parada em todo dia", () => {
    const vazios = TRECHOS.flatMap((trecho) => trecho.itens).filter((item) => !item.titulo.trim() || item.paradas.length === 0);

    expect(vazios.map((item) => item.dia)).toEqual([]);
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

  it("deve ter exatamente uma cidade-base em cada trecho", () => {
    const bases = IDS_TRECHOS.map((id) => PARADAS.filter((parada) => parada.trecho === id && parada.base).length);

    expect(bases).toEqual(IDS_TRECHOS.map(() => 1));
  });

  it("deve ter ids únicos", () => {
    const ids = PARADAS.map((parada) => parada.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("deve ficar dentro da área do mapa", () => {
    const fora = PARADAS.filter((parada) => parada.x < 0 || parada.x > LARGURA_MAPA || parada.y < 0 || parada.y > ALTURA_MAPA);

    expect(fora.map((parada) => parada.id)).toEqual([]);
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
