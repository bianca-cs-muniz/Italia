import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";
import { Prisma } from "@prisma/client";
import { aquecerBanco } from "@database/aquecer-banco";

const HOST_DO_BANCO = "ep-teste-123456.sa-east-1.aws.neon.tech";
const SENHA_DO_BANCO = "s3nh4-Secreta";
const URL_DO_BANCO = `postgresql://dona:${SENHA_DO_BANCO}@${HOST_DO_BANCO}:5432/italia?sslmode=require`;

const AVISO_SEM_CONEXAO = "Banco: a API segue sem conexão; as rotas tentarão conectar de novo a cada requisição.";

let logSucesso: MockInstance;
let logErro: MockInstance;

// Espera de mentira: só anota quantos ms foram pedidos, sem esperar nada.
function esperaAnotada() {
  const esperas: number[] = [];
  const esperar = vi.fn(async (ms: number) => {
    esperas.push(ms);
  });
  return { esperas, esperar };
}

function erroComCodigo(campo: "errorCode" | "code", codigo: unknown) {
  return Object.assign(new Error(`Can't reach database server at \`${HOST_DO_BANCO}:5432\``), { [campo]: codigo });
}

function linhasDe(log: MockInstance): string[] {
  return log.mock.calls.map((chamada) => chamada.map(String).join(" "));
}

beforeEach(() => {
  logSucesso = vi.spyOn(console, "log").mockImplementation(() => {});
  logErro = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("aquecerBanco — conexão na primeira tentativa", () => {
  it("deve chamar $connect uma única vez", async () => {
    const cliente = { $connect: vi.fn().mockResolvedValue(undefined) };
    const { esperar } = esperaAnotada();

    await aquecerBanco(cliente, esperar);

    expect(cliente.$connect).toHaveBeenCalledTimes(1);
  });

  it("não deve esperar", async () => {
    const cliente = { $connect: vi.fn().mockResolvedValue(undefined) };
    const { esperar } = esperaAnotada();

    await aquecerBanco(cliente, esperar);

    expect(esperar).not.toHaveBeenCalled();
  });

  it("deve registrar o sucesso em console.log com o número da tentativa e o tempo", async () => {
    const cliente = { $connect: vi.fn().mockResolvedValue(undefined) };

    await aquecerBanco(cliente, esperaAnotada().esperar);

    expect(linhasDe(logSucesso)).toHaveLength(1);
    expect(linhasDe(logSucesso)[0]).toMatch(/^Banco: conectado na tentativa 1 \(\d+ ms\)\.$/);
  });

  it("não deve escrever nada em console.error", async () => {
    const cliente = { $connect: vi.fn().mockResolvedValue(undefined) };

    await aquecerBanco(cliente, esperaAnotada().esperar);

    expect(logErro).not.toHaveBeenCalled();
  });
});

describe("aquecerBanco — conexão depois de falhas", () => {
  function clienteQueConectaNaTerceira() {
    return {
      $connect: vi
        .fn()
        .mockRejectedValueOnce(erroComCodigo("errorCode", "P1001"))
        .mockRejectedValueOnce(erroComCodigo("errorCode", "P1001"))
        .mockResolvedValue(undefined),
    };
  }

  it("deve esperar 2000 e 4000 ms quando falha duas vezes e conecta na terceira", async () => {
    const cliente = clienteQueConectaNaTerceira();
    const { esperas, esperar } = esperaAnotada();

    await aquecerBanco(cliente, esperar);

    expect(esperas).toEqual([2000, 4000]);
  });

  it("deve parar de tentar assim que conecta", async () => {
    const cliente = clienteQueConectaNaTerceira();

    await aquecerBanco(cliente, esperaAnotada().esperar);

    expect(cliente.$connect).toHaveBeenCalledTimes(3);
  });

  it("deve registrar cada falha em console.error com tentativa, total, código e tempo", async () => {
    const cliente = clienteQueConectaNaTerceira();

    await aquecerBanco(cliente, esperaAnotada().esperar);

    const linhas = linhasDe(logErro);
    expect(linhas).toHaveLength(2);
    expect(linhas[0]).toMatch(/^Banco: tentativa 1 de 5 falhou \(P1001\) após \d+ ms\.$/);
    expect(linhas[1]).toMatch(/^Banco: tentativa 2 de 5 falhou \(P1001\) após \d+ ms\.$/);
  });

  it("deve registrar o sucesso com o número da tentativa em que conectou", async () => {
    const cliente = clienteQueConectaNaTerceira();

    await aquecerBanco(cliente, esperaAnotada().esperar);

    expect(linhasDe(logSucesso)).toHaveLength(1);
    expect(linhasDe(logSucesso)[0]).toMatch(/^Banco: conectado na tentativa 3 \(\d+ ms\)\.$/);
  });

  it("não deve registrar o aviso de API sem conexão quando acaba conectando", async () => {
    const cliente = clienteQueConectaNaTerceira();

    await aquecerBanco(cliente, esperaAnotada().esperar);

    expect(linhasDe(logErro)).not.toContain(AVISO_SEM_CONEXAO);
  });

  it("deve conectar na última tentativa sem registrar o aviso de API sem conexão", async () => {
    const cliente = {
      $connect: vi
        .fn()
        .mockRejectedValueOnce(erroComCodigo("errorCode", "P1001"))
        .mockRejectedValueOnce(erroComCodigo("errorCode", "P1001"))
        .mockRejectedValueOnce(erroComCodigo("errorCode", "P1001"))
        .mockRejectedValueOnce(erroComCodigo("errorCode", "P1001"))
        .mockResolvedValue(undefined),
    };
    const { esperas, esperar } = esperaAnotada();

    await aquecerBanco(cliente, esperar);

    expect(esperas).toEqual([2000, 4000, 8000, 16000]);
    expect(linhasDe(logSucesso)[0]).toMatch(/^Banco: conectado na tentativa 5 /);
    expect(linhasDe(logErro)).not.toContain(AVISO_SEM_CONEXAO);
  });
});

describe("aquecerBanco — todas as tentativas falham", () => {
  function clienteQueNuncaConecta() {
    return { $connect: vi.fn().mockRejectedValue(erroComCodigo("errorCode", "P1001")) };
  }

  it("deve resolver sem lançar", async () => {
    await expect(aquecerBanco(clienteQueNuncaConecta(), esperaAnotada().esperar)).resolves.toBeUndefined();
  });

  it("deve tentar 5 vezes por padrão", async () => {
    const cliente = clienteQueNuncaConecta();

    await aquecerBanco(cliente, esperaAnotada().esperar);

    expect(cliente.$connect).toHaveBeenCalledTimes(5);
  });

  it("deve esperar 2000, 4000, 8000 e 16000 ms, sem esperar depois da última tentativa", async () => {
    const { esperas, esperar } = esperaAnotada();

    await aquecerBanco(clienteQueNuncaConecta(), esperar);

    expect(esperas).toEqual([2000, 4000, 8000, 16000]);
  });

  it("deve registrar as 5 falhas e, por último, o aviso de que a API segue sem conexão", async () => {
    await aquecerBanco(clienteQueNuncaConecta(), esperaAnotada().esperar);

    const linhas = linhasDe(logErro);
    expect(linhas).toHaveLength(6);
    for (let tentativa = 1; tentativa <= 5; tentativa++) {
      expect(linhas[tentativa - 1]).toMatch(
        new RegExp(`^Banco: tentativa ${tentativa} de 5 falhou \\(P1001\\) após \\d+ ms\\.$`),
      );
    }
    expect(linhas[5]).toBe(AVISO_SEM_CONEXAO);
  });

  it("não deve registrar sucesso em console.log", async () => {
    await aquecerBanco(clienteQueNuncaConecta(), esperaAnotada().esperar);

    expect(logSucesso).not.toHaveBeenCalled();
  });

  it("não deve lançar quando $connect lança de forma síncrona, em vez de rejeitar", async () => {
    const cliente = {
      $connect: vi.fn(() => {
        throw erroComCodigo("code", "ECONNREFUSED");
      }),
    };

    await expect(aquecerBanco(cliente, esperaAnotada().esperar)).resolves.toBeUndefined();
    expect(cliente.$connect).toHaveBeenCalledTimes(5);
  });

  it("não deve lançar quando $connect rejeita com algo que não é um Error", async () => {
    const cliente = { $connect: vi.fn().mockRejectedValue(undefined) };

    await expect(aquecerBanco(cliente, esperaAnotada().esperar)).resolves.toBeUndefined();
    expect(linhasDe(logErro)[0]).toMatch(/^Banco: tentativa 1 de 5 falhou \(sem código\) após \d+ ms\.$/);
  });
});

describe("aquecerBanco — número de tentativas customizado", () => {
  it("deve tentar 3 vezes e esperar só 2000 e 4000 ms quando tentativas = 3", async () => {
    const cliente = { $connect: vi.fn().mockRejectedValue(erroComCodigo("errorCode", "P1001")) };
    const { esperas, esperar } = esperaAnotada();

    await aquecerBanco(cliente, esperar, 3);

    expect(cliente.$connect).toHaveBeenCalledTimes(3);
    expect(esperas).toEqual([2000, 4000]);
  });

  it("deve usar o total customizado no texto do log de falha", async () => {
    const cliente = { $connect: vi.fn().mockRejectedValue(erroComCodigo("errorCode", "P1001")) };

    await aquecerBanco(cliente, esperaAnotada().esperar, 3);

    const linhas = linhasDe(logErro);
    expect(linhas).toHaveLength(4);
    expect(linhas[2]).toMatch(/^Banco: tentativa 3 de 3 falhou \(P1001\) após \d+ ms\.$/);
    expect(linhas[3]).toBe(AVISO_SEM_CONEXAO);
  });

  it("deve tentar uma única vez, sem esperar, quando tentativas = 1", async () => {
    const cliente = { $connect: vi.fn().mockRejectedValue(erroComCodigo("errorCode", "P1001")) };
    const { esperar } = esperaAnotada();

    await aquecerBanco(cliente, esperar, 1);

    expect(cliente.$connect).toHaveBeenCalledTimes(1);
    expect(esperar).not.toHaveBeenCalled();
    expect(linhasDe(logErro)).toEqual([
      expect.stringMatching(/^Banco: tentativa 1 de 1 falhou \(P1001\) após \d+ ms\.$/),
      AVISO_SEM_CONEXAO,
    ]);
  });
});

describe("aquecerBanco — código do erro no log", () => {
  async function primeiraLinhaDeFalha(erro: unknown) {
    const cliente = { $connect: vi.fn().mockRejectedValue(erro) };
    await aquecerBanco(cliente, esperaAnotada().esperar, 1);
    return linhasDe(logErro)[0];
  }

  it("deve usar errorCode (erro de inicialização do Prisma)", async () => {
    const erro = new Prisma.PrismaClientInitializationError(
      `Can't reach database server at \`${HOST_DO_BANCO}:5432\``,
      "5.22.0",
      "P1001",
    );

    expect(await primeiraLinhaDeFalha(erro)).toMatch(/falhou \(P1001\) após/);
  });

  it("deve usar code quando não há errorCode (erro conhecido do Prisma)", async () => {
    const erro = new Prisma.PrismaClientKnownRequestError("Server has closed the connection.", {
      code: "P1017",
      clientVersion: "5.22.0",
    });

    expect(await primeiraLinhaDeFalha(erro)).toMatch(/falhou \(P1017\) após/);
  });

  it("deve usar code de um erro de rede do Node", async () => {
    expect(await primeiraLinhaDeFalha(erroComCodigo("code", "ECONNREFUSED"))).toMatch(/falhou \(ECONNREFUSED\) após/);
  });

  it("deve preferir errorCode quando o erro traz os dois", async () => {
    const erro = Object.assign(new Error("falhou"), { errorCode: "P1001", code: "ETIMEDOUT" });

    expect(await primeiraLinhaDeFalha(erro)).toMatch(/falhou \(P1001\) após/);
  });

  it('deve escrever "sem código" quando o erro não traz código', async () => {
    expect(await primeiraLinhaDeFalha(new Error("falhou"))).toMatch(/falhou \(sem código\) após/);
  });

  it('deve escrever "sem código" quando o erro de inicialização do Prisma vem sem errorCode', async () => {
    const erro = new Prisma.PrismaClientInitializationError("Query engine não iniciou", "5.22.0");

    expect(await primeiraLinhaDeFalha(erro)).toMatch(/falhou \(sem código\) após/);
  });

  it.each([
    ["vazio", ""],
    ["numérico", 1001],
    ["um objeto", { host: HOST_DO_BANCO }],
  ])('deve escrever "sem código" quando o código é %s', async (_caso, codigo) => {
    expect(await primeiraLinhaDeFalha(erroComCodigo("code", codigo))).toMatch(/falhou \(sem código\) após/);
  });
});

describe("aquecerBanco — nada sensível no log", () => {
  it("não deve registrar host, URL nem senha quando a mensagem do erro os traz", async () => {
    const erro = new Prisma.PrismaClientInitializationError(
      `Can't reach database server at \`${HOST_DO_BANCO}:5432\`. Verifique ${URL_DO_BANCO} (senha ${SENHA_DO_BANCO}).`,
      "5.22.0",
      "P1001",
    );
    const cliente = { $connect: vi.fn().mockRejectedValue(erro) };

    await aquecerBanco(cliente, esperaAnotada().esperar);

    const tudo = JSON.stringify([...logErro.mock.calls, ...logSucesso.mock.calls]);
    expect(tudo).not.toContain(HOST_DO_BANCO);
    expect(tudo).not.toContain(SENHA_DO_BANCO);
    expect(tudo).not.toContain("postgresql://");
    expect(tudo).not.toContain("neon.tech");
  });

  it("não deve registrar o objeto do erro, só texto", async () => {
    const cliente = { $connect: vi.fn().mockRejectedValue(erroComCodigo("errorCode", "P1001")) };

    await aquecerBanco(cliente, esperaAnotada().esperar);

    const argumentos = logErro.mock.calls.flat();
    expect(argumentos.every((argumento) => typeof argumento === "string")).toBe(true);
  });

  it("não deve registrar host nem senha quando o erro não tem código", async () => {
    const cliente = {
      $connect: vi.fn().mockRejectedValue(new Error(`connect ECONNREFUSED ${URL_DO_BANCO}`)),
    };

    await aquecerBanco(cliente, esperaAnotada().esperar);

    const tudo = JSON.stringify(logErro.mock.calls);
    expect(tudo).not.toContain(HOST_DO_BANCO);
    expect(tudo).not.toContain(SENHA_DO_BANCO);
  });
});
