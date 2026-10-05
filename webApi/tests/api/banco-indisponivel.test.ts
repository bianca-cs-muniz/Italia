import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";
import { Prisma } from "@prisma/client";
import app from "../../src/app";
import { prismaFalso } from "../apoio/prisma-em-memoria";
import { lugarValido } from "../apoio/fabricas";

const HOST_DO_BANCO = "ep-teste-123456.sa-east-1.aws.neon.tech";
const SENHA_DO_BANCO = "s3nh4-Secreta";
const MENSAGEM_DO_PRISMA = `Can't reach database server at \`${HOST_DO_BANCO}:5432\` (postgresql://dona:${SENHA_DO_BANCO}@${HOST_DO_BANCO}/italia)`;

const CORPO_BANCO_INDISPONIVEL = { error: "O banco de dados está acordando. Tente de novo em alguns segundos." };
const CORPO_ERRO_INTERNO = { error: "Erro interno no servidor." };

function erroDeInicializacao(codigo?: string) {
  return new Prisma.PrismaClientInitializationError(MENSAGEM_DO_PRISMA, "5.22.0", codigo);
}

function erroConhecido(codigo: string) {
  return new Prisma.PrismaClientKnownRequestError(MENSAGEM_DO_PRISMA, { code: codigo, clientVersion: "5.22.0" });
}

let log: MockInstance;

beforeEach(() => {
  log = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("banco indisponível — erro de inicialização do Prisma", () => {
  it("deve responder 503 em GET /api/lugares", async () => {
    vi.spyOn(prismaFalso.lugar, "findMany").mockRejectedValueOnce(erroDeInicializacao("P1001"));

    const resposta = await request(app).get("/api/lugares");

    expect(resposta.status).toBe(503);
  });

  it("deve enviar Retry-After: 5", async () => {
    vi.spyOn(prismaFalso.lugar, "findMany").mockRejectedValueOnce(erroDeInicializacao("P1001"));

    const resposta = await request(app).get("/api/lugares");

    expect(resposta.headers["retry-after"]).toBe("5");
  });

  it("deve responder em JSON com a mensagem de banco acordando", async () => {
    vi.spyOn(prismaFalso.lugar, "findMany").mockRejectedValueOnce(erroDeInicializacao("P1001"));

    const resposta = await request(app).get("/api/lugares");

    expect(resposta.headers["content-type"]).toMatch(/^application\/json/);
    expect(resposta.body).toEqual(CORPO_BANCO_INDISPONIVEL);
  });

  it("deve responder 503 também em GET /api/checklist", async () => {
    vi.spyOn(prismaFalso.checklistMarcado, "findMany").mockRejectedValueOnce(erroDeInicializacao("P1001"));

    const resposta = await request(app).get("/api/checklist");

    expect(resposta.status).toBe(503);
    expect(resposta.headers["retry-after"]).toBe("5");
    expect(resposta.body).toEqual(CORPO_BANCO_INDISPONIVEL);
  });

  it("deve responder 503 em uma escrita (POST /api/lugares) quando a transação não abre", async () => {
    vi.spyOn(prismaFalso, "$transaction").mockRejectedValueOnce(erroDeInicializacao("P1001"));

    const resposta = await request(app).post("/api/lugares").send(lugarValido());

    expect(resposta.status).toBe(503);
    expect(resposta.headers["retry-after"]).toBe("5");
    expect(resposta.body).toEqual(CORPO_BANCO_INDISPONIVEL);
  });

  it.each([
    ["sem errorCode", undefined],
    ["com errorCode vazio", ""],
    ["com P1002 (tempo esgotado ao conectar)", "P1002"],
    ["com P1017 (conexão fechada pelo servidor)", "P1017"],
  ])("deve responder 503 para o erro de inicialização %s", async (_caso, codigo) => {
    vi.spyOn(prismaFalso.lugar, "findMany").mockRejectedValueOnce(erroDeInicializacao(codigo));

    const resposta = await request(app).get("/api/lugares");

    expect(resposta.status).toBe(503);
    expect(resposta.headers["retry-after"]).toBe("5");
    expect(resposta.body).toEqual(CORPO_BANCO_INDISPONIVEL);
  });
});

// Senha recusada, banco inexistente, schema inválido: tentar de novo não
// resolve, então não é "banco acordando".
describe("erro de configuração do banco — erro de inicialização com outro código", () => {
  const CODIGOS_DE_CONFIGURACAO = [
    ["P1000 (senha recusada)", "P1000"],
    ["P1003 (banco não existe)", "P1003"],
    ["P1012 (schema inválido)", "P1012"],
  ];

  it.each(CODIGOS_DE_CONFIGURACAO)("deve responder 500 com a mensagem genérica para %s", async (_caso, codigo) => {
    vi.spyOn(prismaFalso.lugar, "findMany").mockRejectedValueOnce(erroDeInicializacao(codigo));

    const resposta = await request(app).get("/api/lugares");

    expect(resposta.status).toBe(500);
    expect(resposta.body).toEqual(CORPO_ERRO_INTERNO);
  });

  it.each(CODIGOS_DE_CONFIGURACAO)("não deve enviar Retry-After para %s", async (_caso, codigo) => {
    vi.spyOn(prismaFalso.lugar, "findMany").mockRejectedValueOnce(erroDeInicializacao(codigo));

    const resposta = await request(app).get("/api/lugares");

    expect(resposta.headers["retry-after"]).toBeUndefined();
  });

  it.each(CODIGOS_DE_CONFIGURACAO)(
    "deve registrar só 'Erro de configuração do banco (CÓDIGO)' para %s",
    async (_caso, codigo) => {
      vi.spyOn(prismaFalso.lugar, "findMany").mockRejectedValueOnce(erroDeInicializacao(codigo));

      await request(app).get("/api/lugares");

      expect(log).toHaveBeenCalledTimes(1);
      expect(log).toHaveBeenCalledWith(`Erro de configuração do banco (${codigo})`);
    },
  );

  it.each(CODIGOS_DE_CONFIGURACAO)("não deve colocar host nem senha no corpo da resposta para %s", async (_caso, codigo) => {
    vi.spyOn(prismaFalso.lugar, "findMany").mockRejectedValueOnce(erroDeInicializacao(codigo));

    const resposta = await request(app).get("/api/lugares");

    expect(resposta.text).not.toContain(HOST_DO_BANCO);
    expect(resposta.text).not.toContain(SENHA_DO_BANCO);
    expect(resposta.text).not.toContain("neon.tech");
    expect(resposta.text).not.toContain("postgresql://");
  });

  it.each(CODIGOS_DE_CONFIGURACAO)("não deve colocar host, senha nem a mensagem do Prisma no log para %s", async (_caso, codigo) => {
    vi.spyOn(prismaFalso.lugar, "findMany").mockRejectedValueOnce(erroDeInicializacao(codigo));

    await request(app).get("/api/lugares");

    const registrado = JSON.stringify(log.mock.calls);
    expect(registrado).not.toContain(HOST_DO_BANCO);
    expect(registrado).not.toContain(SENHA_DO_BANCO);
    expect(registrado).not.toContain("neon.tech");
    expect(registrado).not.toContain("postgresql://");
    expect(registrado).not.toContain("Can't reach database server");
  });

  it("deve responder 500 também em GET /api/checklist e em POST /api/lugares", async () => {
    vi.spyOn(prismaFalso.checklistMarcado, "findMany").mockRejectedValueOnce(erroDeInicializacao("P1000"));
    vi.spyOn(prismaFalso, "$transaction").mockRejectedValueOnce(erroDeInicializacao("P1000"));

    const checklist = await request(app).get("/api/checklist");
    const criacao = await request(app).post("/api/lugares").send(lugarValido());

    expect(checklist.status).toBe(500);
    expect(checklist.body).toEqual(CORPO_ERRO_INTERNO);
    expect(criacao.status).toBe(500);
    expect(criacao.body).toEqual(CORPO_ERRO_INTERNO);
  });

  it("deve manter /api/saude em 200 com o banco mal configurado", async () => {
    vi.spyOn(prismaFalso.lugar, "findMany").mockRejectedValue(erroDeInicializacao("P1000"));

    const resposta = await request(app).get("/api/saude");

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual({ ok: true });
  });
});

describe("banco indisponível — erro conhecido do Prisma", () => {
  it.each(["P1001", "P1002", "P1017"])("deve responder 503 com Retry-After: 5 para %s", async (codigo) => {
    vi.spyOn(prismaFalso.lugar, "findMany").mockRejectedValueOnce(erroConhecido(codigo));

    const resposta = await request(app).get("/api/lugares");

    expect(resposta.status).toBe(503);
    expect(resposta.headers["retry-after"]).toBe("5");
    expect(resposta.body).toEqual(CORPO_BANCO_INDISPONIVEL);
  });

  it.each(["P1001", "P1002", "P1017"])("deve responder 503 em GET /api/checklist para %s", async (codigo) => {
    vi.spyOn(prismaFalso.checklistMarcado, "findMany").mockRejectedValueOnce(erroConhecido(codigo));

    const resposta = await request(app).get("/api/checklist");

    expect(resposta.status).toBe(503);
    expect(resposta.headers["retry-after"]).toBe("5");
    expect(resposta.body).toEqual(CORPO_BANCO_INDISPONIVEL);
  });
});

describe("banco indisponível — log e vazamento", () => {
  it("deve registrar só 'Banco indisponível (CÓDIGO)' para o erro de inicialização", async () => {
    vi.spyOn(prismaFalso.lugar, "findMany").mockRejectedValueOnce(erroDeInicializacao("P1001"));

    await request(app).get("/api/lugares");

    expect(log).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledWith("Banco indisponível (P1001)");
  });

  it.each(["P1001", "P1002", "P1017"])("deve registrar o código %s do erro conhecido", async (codigo) => {
    vi.spyOn(prismaFalso.lugar, "findMany").mockRejectedValueOnce(erroConhecido(codigo));

    await request(app).get("/api/lugares");

    expect(log).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledWith(`Banco indisponível (${codigo})`);
  });

  it("deve registrar 'sem código' quando o erro de inicialização não traz errorCode", async () => {
    vi.spyOn(prismaFalso.lugar, "findMany").mockRejectedValueOnce(erroDeInicializacao());

    await request(app).get("/api/lugares");

    expect(log).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledWith("Banco indisponível (sem código)");
  });

  it.each([
    ["erro de inicialização", () => erroDeInicializacao("P1001")],
    ["erro conhecido P1001", () => erroConhecido("P1001")],
    ["erro conhecido P1017", () => erroConhecido("P1017")],
  ])("não deve colocar host nem senha no corpo da resposta (%s)", async (_caso, criarErro) => {
    vi.spyOn(prismaFalso.lugar, "findMany").mockRejectedValueOnce(criarErro());

    const resposta = await request(app).get("/api/lugares");

    expect(resposta.text).not.toContain(HOST_DO_BANCO);
    expect(resposta.text).not.toContain(SENHA_DO_BANCO);
    expect(resposta.text).not.toContain("neon.tech");
    expect(resposta.text).not.toContain("postgresql://");
  });

  it.each([
    ["erro de inicialização", () => erroDeInicializacao("P1001")],
    ["erro de inicialização sem código", () => erroDeInicializacao()],
    ["erro conhecido P1001", () => erroConhecido("P1001")],
    ["erro conhecido P1017", () => erroConhecido("P1017")],
  ])("não deve colocar host nem senha no log (%s)", async (_caso, criarErro) => {
    vi.spyOn(prismaFalso.lugar, "findMany").mockRejectedValueOnce(criarErro());

    await request(app).get("/api/lugares");

    const registrado = JSON.stringify(log.mock.calls);
    expect(registrado).not.toContain(HOST_DO_BANCO);
    expect(registrado).not.toContain(SENHA_DO_BANCO);
    expect(registrado).not.toContain("neon.tech");
    expect(registrado).not.toContain("postgresql://");
  });

  it("não deve colocar host nem senha nos headers da resposta", async () => {
    vi.spyOn(prismaFalso.lugar, "findMany").mockRejectedValueOnce(erroDeInicializacao("P1001"));

    const resposta = await request(app).get("/api/lugares");

    const headers = JSON.stringify(resposta.headers);
    expect(headers).not.toContain(HOST_DO_BANCO);
    expect(headers).not.toContain(SENHA_DO_BANCO);
  });
});

describe("banco indisponível — o que não depende do banco segue respondendo", () => {
  it("deve responder 200 em /api/saude com todas as consultas ao banco falhando", async () => {
    vi.spyOn(prismaFalso.lugar, "findMany").mockRejectedValue(erroDeInicializacao("P1001"));
    vi.spyOn(prismaFalso.checklistMarcado, "findMany").mockRejectedValue(erroDeInicializacao("P1001"));
    vi.spyOn(prismaFalso, "$transaction").mockRejectedValue(erroDeInicializacao("P1001"));
    vi.spyOn(prismaFalso, "$connect").mockRejectedValue(erroDeInicializacao("P1001"));

    const resposta = await request(app).get("/api/saude");

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual({ ok: true });
    expect(resposta.headers["retry-after"]).toBeUndefined();
  });

  it("deve responder 200 em /api/saude logo depois de uma rota de banco responder 503", async () => {
    vi.spyOn(prismaFalso.lugar, "findMany").mockRejectedValue(erroDeInicializacao("P1001"));

    const lugares = await request(app).get("/api/lugares");
    const saude = await request(app).get("/api/saude");

    expect(lugares.status).toBe(503);
    expect(saude.status).toBe(200);
  });

  it("deve voltar a responder 200 na rota de banco quando o banco acorda", async () => {
    vi.spyOn(prismaFalso.lugar, "findMany").mockRejectedValueOnce(erroDeInicializacao("P1001"));

    const primeira = await request(app).get("/api/lugares");
    const segunda = await request(app).get("/api/lugares");

    expect(primeira.status).toBe(503);
    expect(segunda.status).toBe(200);
    expect(segunda.headers["retry-after"]).toBeUndefined();
  });
});

describe("banco indisponível — o que não é banco fora do ar segue como antes", () => {
  it.each([
    ["P2024 (pool sem conexão livre)", "P2024"],
    ["P2002 (chave duplicada)", "P2002"],
    ["P1008 (operação demorou demais)", "P1008"],
  ])("deve responder 500, sem Retry-After, para o erro conhecido %s", async (_caso, codigo) => {
    vi.spyOn(prismaFalso.lugar, "findMany").mockRejectedValueOnce(erroConhecido(codigo));

    const resposta = await request(app).get("/api/lugares");

    expect(resposta.status).toBe(500);
    expect(resposta.headers["retry-after"]).toBeUndefined();
    expect(resposta.body).toEqual(CORPO_ERRO_INTERNO);
  });

  it("deve responder 500 para um erro genérico", async () => {
    vi.spyOn(prismaFalso.lugar, "findMany").mockRejectedValueOnce(new Error("algo quebrou"));

    const resposta = await request(app).get("/api/lugares");

    expect(resposta.status).toBe(500);
    expect(resposta.headers["retry-after"]).toBeUndefined();
    expect(resposta.body).toEqual(CORPO_ERRO_INTERNO);
  });

  it("deve responder 500 para um erro comum que só imita o código P1001", async () => {
    const imitacao = Object.assign(new Error("não sou do Prisma"), { code: "P1001" });
    vi.spyOn(prismaFalso.lugar, "findMany").mockRejectedValueOnce(imitacao);

    const resposta = await request(app).get("/api/lugares");

    expect(resposta.status).toBe(500);
    expect(resposta.body).toEqual(CORPO_ERRO_INTERNO);
  });

  it("deve manter o 404 da AppException de rota inexistente", async () => {
    const resposta = await request(app).get("/api/nao-existe");

    expect(resposta.status).toBe(404);
    expect(resposta.headers["retry-after"]).toBeUndefined();
    expect(resposta.body).toEqual({ error: "Rota não encontrada." });
  });

  it("deve manter o status da AppException lançada por uma rota (item de checklist inválido)", async () => {
    const resposta = await request(app).put("/api/checklist/item-que-nao-existe").send({ marcado: true });

    expect(resposta.status).toBe(404);
    expect(resposta.headers["retry-after"]).toBeUndefined();
    expect(resposta.body).toEqual({ error: "Item do checklist não encontrado." });
  });

  it("não deve registrar a AppException no log", async () => {
    await request(app).get("/api/nao-existe");

    expect(log).not.toHaveBeenCalled();
  });
});
