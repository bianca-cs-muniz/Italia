import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";
import app from "../../src/app";
import { prismaFalso } from "../apoio/prisma-em-memoria";
import { lugarValido, requisicaoCrua } from "../apoio/fabricas";

// Definidas em vitest.config.ts (URL_FRONTEND). A segunda foi escrita lá com
// espaço e barra no fim, de propósito.
const ORIGEM_PERMITIDA = "http://localhost:3000";
const SEGUNDA_ORIGEM_PERMITIDA = "https://italia.exemplo.com";
const ORIGEM_DE_FORA = "https://site-malicioso.exemplo";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("GET /api/saude", () => {
  it("deve responder 200 com { ok: true }", async () => {
    const resposta = await request(app).get("/api/saude");

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual({ ok: true });
  });

  it("deve enviar X-Content-Type-Options: nosniff (helmet)", async () => {
    const resposta = await request(app).get("/api/saude");

    expect(resposta.headers["x-content-type-options"]).toBe("nosniff");
  });
});

describe("corpo da requisição", () => {
  it("deve responder 400 { error } quando o JSON está malformado", async () => {
    const resposta = await request(app)
      .post("/api/lugares")
      .set("Content-Type", "application/json")
      .send('{"nome": "Hotel", ');

    expect(resposta.status).toBe(400);
    expect(resposta.body).toEqual({ error: "Corpo da requisição inválido." });
  });

  it("deve responder 400 quando o JSON é um valor solto, e não um objeto", async () => {
    const resposta = await request(app).put("/api/checklist/trens").set("Content-Type", "application/json").send("true");

    expect(resposta.status).toBe(400);
    expect(resposta.body).toEqual({ error: "Corpo da requisição inválido." });
  });

  it("deve responder 413 { error } quando o JSON passa de 100 kb", async () => {
    const corpo = lugarValido({ descricao: "a".repeat(101 * 1024) });

    const resposta = await request(app).post("/api/lugares").send(corpo);

    expect(resposta.status).toBe(413);
    expect(resposta.body).toEqual({ error: "Corpo da requisição inválido." });
  });

  it("não deve registrar no log os erros de corpo causados por quem enviou", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    await request(app).post("/api/lugares").set("Content-Type", "application/json").send("{ quebrado");

    expect(log).not.toHaveBeenCalled();
  });
});

describe("rota inexistente", () => {
  it.each([
    ["GET", "/api/nao-existe"],
    ["GET", "/"],
    ["GET", "/saude"],
    ["GET", "/api/lugares/3f2b8c1e-5d4a-4c7b-9e1f-0a1b2c3d4e5f"],
    ["PATCH", "/api/lugares"],
    ["DELETE", "/api/checklist/trens"],
    ["DELETE", "/api/fotos/3f2b8c1e-5d4a-4c7b-9e1f-0a1b2c3d4e5f"],
    ["POST", "/api/saude"],
  ])("deve responder 404 em JSON para %s %s", async (metodo, caminho) => {
    const resposta = await request(app)[metodo.toLowerCase() as "get"](caminho);

    expect(resposta.status).toBe(404);
    expect(resposta.headers["content-type"]).toMatch(/^application\/json/);
    expect(resposta.body).toEqual({ error: "Rota não encontrada." });
  });
});

// BUG CONHECIDO (código de produção, não corrigido aqui): estes 3 testes FALHAM.
// Um `%` inválido num parâmetro de rota faz o Express lançar um URIError com
// status 400, mas sem `expose`. O tratamento global (src/app.ts, linhas 51-60)
// só reconhece erros do cliente quando `err.expose === true`, então a
// requisição cai no ramo do 500: responde "Erro interno no servidor." e
// escreve no log a cada chamada. Como o erro acontece ao casar a rota, antes
// dos middlewares dela, o limite de requisições também não chega a contar.
describe("endereço com codificação inválida (%)", () => {
  it.each([
    ["GET", "/api/fotos/%E0%A4%A"],
    ["PUT", "/api/checklist/%ZZ"],
    ["DELETE", "/api/lugares/%"],
  ])("deve responder com erro do cliente (4xx), e não 500, para %s %s", async (metodo, caminho) => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    const resposta = await requisicaoCrua(app, {
      metodo,
      caminho,
      headers: { "Content-Type": "application/json" },
      corpo: metodo === "PUT" ? Buffer.from('{"marcado":true}') : undefined,
    });

    expect(JSON.parse(resposta.corpo)).toHaveProperty("error");
    expect(resposta.status).toBeGreaterThanOrEqual(400);
    expect(resposta.status).toBeLessThan(500);
    expect(log).not.toHaveBeenCalled();
  });
});

describe("CORS", () => {
  it("deve liberar a origem listada em URL_FRONTEND", async () => {
    const resposta = await request(app).get("/api/saude").set("Origin", ORIGEM_PERMITIDA);

    expect(resposta.headers["access-control-allow-origin"]).toBe(ORIGEM_PERMITIDA);
  });

  it("deve liberar a segunda origem da lista, escrita com espaço e barra no fim", async () => {
    const resposta = await request(app).get("/api/saude").set("Origin", SEGUNDA_ORIGEM_PERMITIDA);

    expect(resposta.headers["access-control-allow-origin"]).toBe(SEGUNDA_ORIGEM_PERMITIDA);
  });

  it("não deve enviar Access-Control-Allow-Origin para uma origem fora de URL_FRONTEND", async () => {
    const resposta = await request(app).get("/api/lugares").set("Origin", ORIGEM_DE_FORA);

    expect(resposta.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it.each([
    ["mesmo host em outra porta", "http://localhost:3001"],
    ["mesmo host em https", "https://localhost:3000"],
    ["origem permitida como prefixo de outro domínio", "http://localhost:3000.exemplo.com"],
    ["origem nula", "null"],
  ])("não deve liberar %s", async (_caso, origem) => {
    const resposta = await request(app).get("/api/saude").set("Origin", origem);

    expect(resposta.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("nunca deve responder com curinga em Access-Control-Allow-Origin", async () => {
    const semOrigem = await request(app).get("/api/saude");
    const deFora = await request(app).get("/api/saude").set("Origin", ORIGEM_DE_FORA);

    expect(semOrigem.headers["access-control-allow-origin"]).not.toBe("*");
    expect(deFora.headers["access-control-allow-origin"]).not.toBe("*");
  });

  it("não deve enviar Access-Control-Allow-Credentials para a origem permitida", async () => {
    const resposta = await request(app).get("/api/saude").set("Origin", ORIGEM_PERMITIDA);

    expect(resposta.headers["access-control-allow-credentials"]).toBeUndefined();
  });

  it("não deve enviar Access-Control-Allow-Credentials para uma origem de fora", async () => {
    const resposta = await request(app).get("/api/saude").set("Origin", ORIGEM_DE_FORA);

    expect(resposta.headers["access-control-allow-credentials"]).toBeUndefined();
  });

  it("deve responder ao preflight da origem permitida liberando origem e método, sem credenciais", async () => {
    const resposta = await request(app)
      .options("/api/lugares")
      .set("Origin", ORIGEM_PERMITIDA)
      .set("Access-Control-Request-Method", "POST")
      .set("Access-Control-Request-Headers", "content-type");

    expect(resposta.status).toBe(204);
    expect(resposta.headers["access-control-allow-origin"]).toBe(ORIGEM_PERMITIDA);
    expect(resposta.headers["access-control-allow-methods"]).toContain("POST");
    expect(resposta.headers["access-control-allow-credentials"]).toBeUndefined();
  });

  it("não deve liberar a origem de fora no preflight", async () => {
    const resposta = await request(app)
      .options("/api/lugares")
      .set("Origin", ORIGEM_DE_FORA)
      .set("Access-Control-Request-Method", "POST");

    expect(resposta.headers["access-control-allow-origin"]).toBeUndefined();
    expect(resposta.headers["access-control-allow-credentials"]).toBeUndefined();
  });
});

describe("erro inesperado", () => {
  it("deve responder 500 com mensagem genérica, sem vazar o erro do banco", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(prismaFalso.lugar, "findMany").mockRejectedValueOnce(new Error("senha do banco: hunter2"));

    const resposta = await request(app).get("/api/lugares");

    expect(resposta.status).toBe(500);
    expect(resposta.body).toEqual({ error: "Erro interno no servidor." });
    expect(resposta.text).not.toContain("hunter2");
  });

  it("deve registrar no log só a mensagem do erro, nunca o corpo da requisição", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(prismaFalso, "$transaction").mockRejectedValueOnce(new Error("conexão recusada"));

    await request(app).post("/api/lugares").send(lugarValido({ nome: "Nome secreto do lugar" }));

    expect(log).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledWith("conexão recusada");
    expect(JSON.stringify(log.mock.calls)).not.toContain("Nome secreto do lugar");
  });

  it("deve responder 500, e não 404, quando o PUT falha com um erro do Prisma que não é P2025", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(prismaFalso.lugar, "update").mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError("Timed out fetching a new connection", { code: "P2024", clientVersion: "x" }),
    );

    const resposta = await request(app).put("/api/lugares/3f2b8c1e-5d4a-4c7b-9e1f-0a1b2c3d4e5f").send(lugarValido());

    expect(resposta.status).toBe(500);
    expect(resposta.body).toEqual({ error: "Erro interno no servidor." });
  });
});

describe("requisição sem Content-Type", () => {
  it("deve responder 400 em POST /api/lugares quando o corpo não é lido como JSON", async () => {
    const resposta = await requisicaoCrua(app, {
      metodo: "POST",
      caminho: "/api/lugares",
      corpo: Buffer.from(JSON.stringify(lugarValido())),
    });

    expect(resposta.status).toBe(400);
    expect(JSON.parse(resposta.corpo)).toHaveProperty("error");
  });
});
