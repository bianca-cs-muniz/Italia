import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../../src/app";
import { banco } from "../apoio/prisma-em-memoria";

// A lista do contrato (README, "Itens do checklist"). O front usa os mesmos ids.
const ITENS_DO_CONTRATO = [
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

function marcar(itemId: string, marcado: unknown = true) {
  return request(app).put(`/api/checklist/${itemId}`).send({ marcado });
}

async function marcados() {
  return (await request(app).get("/api/checklist")).body.marcados as string[];
}

describe("GET /api/checklist", () => {
  it("deve responder 200 com { marcados: [] } quando nada foi marcado", async () => {
    const resposta = await request(app).get("/api/checklist");

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual({ marcados: [] });
  });

  it("deve listar os itens na ordem em que foram marcados", async () => {
    banco.semearMarcado("trens", new Date("2026-09-03T10:00:00Z"));
    banco.semearMarcado("passaportes", new Date("2026-09-01T10:00:00Z"));
    banco.semearMarcado("esim", new Date("2026-09-02T10:00:00Z"));

    expect(await marcados()).toEqual(["passaportes", "esim", "trens"]);
  });

  it("não deve devolver um id gravado que saiu da lista de itens", async () => {
    banco.semearMarcado("item-que-nao-existe-mais");
    banco.semearMarcado("bagagem");

    expect(await marcados()).toEqual(["bagagem"]);
  });
});

describe("PUT /api/checklist/:itemId — marcar", () => {
  it("deve responder 200 com { itemId, marcado: true }", async () => {
    const resposta = await marcar("passaportes", true);

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual({ itemId: "passaportes", marcado: true });
  });

  it("deve fazer o item aparecer em GET /api/checklist", async () => {
    await marcar("seguro-viagem", true);

    expect(await marcados()).toEqual(["seguro-viagem"]);
  });

  it("deve ser idempotente: marcar duas vezes dá 200 e o item aparece uma vez só", async () => {
    const primeira = await marcar("trens", true);
    const segunda = await marcar("trens", true);

    expect(primeira.status).toBe(200);
    expect(segunda.status).toBe(200);
    expect(segunda.body).toEqual(primeira.body);
    expect(await marcados()).toEqual(["trens"]);
  });

  it("deve marcar só o item pedido", async () => {
    await marcar("hoteis", true);
    await marcar("esim", true);

    expect(await marcados()).toEqual(["hoteis", "esim"]);
  });

  it.each(ITENS_DO_CONTRATO)("deve aceitar o item %s", async (itemId) => {
    const resposta = await marcar(itemId, true);

    expect(resposta.status).toBe(200);
    expect(await marcados()).toEqual([itemId]);
  });

  it("deve permitir todos os 16 itens marcados ao mesmo tempo", async () => {
    for (const itemId of ITENS_DO_CONTRATO) await marcar(itemId, true);

    expect(ITENS_DO_CONTRATO).toHaveLength(16);
    expect(await marcados()).toEqual(ITENS_DO_CONTRATO);
  });

  it("deve marcar o item do carro de San Giovanni Rotondo", async () => {
    const resposta = await marcar("carro-san-giovanni", true);

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual({ itemId: "carro-san-giovanni", marcado: true });
    expect(await marcados()).toEqual(["carro-san-giovanni"]);
  });
});

describe("PUT /api/checklist/:itemId — desmarcar", () => {
  it("deve responder 200 com { itemId, marcado: false } e tirar o item da lista", async () => {
    await marcar("passagens", true);

    const resposta = await marcar("passagens", false);

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual({ itemId: "passagens", marcado: false });
    expect(await marcados()).toEqual([]);
  });

  it("deve ser idempotente: desmarcar duas vezes dá 200", async () => {
    await marcar("passagens", true);
    await marcar("passagens", false);

    const segunda = await marcar("passagens", false);

    expect(segunda.status).toBe(200);
    expect(segunda.body).toEqual({ itemId: "passagens", marcado: false });
    expect(await marcados()).toEqual([]);
  });

  it("deve responder 200 ao desmarcar um item que nunca foi marcado", async () => {
    const resposta = await marcar("adaptador", false);

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual({ itemId: "adaptador", marcado: false });
  });

  it("deve desmarcar só o item pedido", async () => {
    await marcar("hoteis", true);
    await marcar("esim", true);

    await marcar("hoteis", false);

    expect(await marcados()).toEqual(["esim"]);
  });

  it("deve desmarcar o item do carro de San Giovanni Rotondo sem mexer nos demais", async () => {
    await marcar("barco-amalfi", true);
    await marcar("carro-san-giovanni", true);

    const resposta = await marcar("carro-san-giovanni", false);

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual({ itemId: "carro-san-giovanni", marcado: false });
    expect(await marcados()).toEqual(["barco-amalfi"]);
  });

  it("deve permitir marcar de novo depois de desmarcar", async () => {
    await marcar("ingressos", true);
    await marcar("ingressos", false);

    await marcar("ingressos", true);

    expect(await marcados()).toEqual(["ingressos"]);
  });
});

describe("PUT /api/checklist/:itemId — item desconhecido → 404", () => {
  it.each([
    ["id que não está na lista", "visto"],
    ["id da lista com maiúsculas", "TRENS"],
    ["item novo escrito sem hífen", "carrosangiovanni"],
    ["item novo com o nome inteiro da cidade", "carro-san-giovanni-rotondo"],
    ["id da lista com espaço no fim", "trens%20"],
    ["uuid", "3f2b8c1e-5d4a-4c7b-9e1f-0a1b2c3d4e5f"],
    ["nome de propriedade de objeto", "constructor"],
    ["nome de método de lista", "includes"],
    ["índice da lista", "0"],
  ])("deve responder 404 para %s", async (_caso, itemId) => {
    const resposta = await marcar(itemId, true);

    expect(resposta.status).toBe(404);
    expect(resposta.body).toEqual({ error: "Item do checklist não encontrado." });
    expect(banco.marcados()).toHaveLength(0);
  });

  it("deve responder 404 também ao desmarcar um item desconhecido", async () => {
    const resposta = await marcar("visto", false);

    expect(resposta.status).toBe(404);
  });
});

describe("PUT /api/checklist/:itemId — corpo inválido → 400", () => {
  it.each([
    ["objeto vazio", {}],
    ["marcado como texto", { marcado: "true" }],
    ["marcado como número", { marcado: 1 }],
    ["marcado nulo", { marcado: null }],
    ["outro nome de campo", { checked: true }],
    ["lista", [true]],
  ])("deve responder 400 para %s", async (_caso, corpo) => {
    const resposta = await request(app).put("/api/checklist/trens").send(corpo);

    expect(resposta.status).toBe(400);
    expect(typeof resposta.body.error).toBe("string");
    expect(banco.marcados()).toHaveLength(0);
  });

  it("deve explicar o que falta quando `marcado` não é booleano", async () => {
    const resposta = await request(app).put("/api/checklist/trens").send({ marcado: "sim" });

    expect(resposta.body).toEqual({ error: "marcado: Informe se o item está marcado (true ou false)." });
  });

  it("deve responder 400 quando não há corpo", async () => {
    const resposta = await request(app).put("/api/checklist/trens");

    expect(resposta.status).toBe(400);
  });

  it("não deve desmarcar o item quando o corpo é inválido", async () => {
    await marcar("trens", true);

    await request(app).put("/api/checklist/trens").send({ marcado: "false" });

    expect(await marcados()).toEqual(["trens"]);
  });
});
