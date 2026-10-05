import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";
import { ajustarUrlDoBanco } from "@database/url-banco";

const BASE = "postgresql://dona:segredo@ep-teste-123456-pooler.sa-east-1.aws.neon.tech/italia";
const AVISO_URL_NAO_AJUSTADA =
  "Banco: não foi possível ajustar a DATABASE_URL; os tempos de espera ficaram no padrão do Prisma.";

let aviso: MockInstance;

beforeEach(() => {
  aviso = vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ajustarUrlDoBanco — acrescenta os tempos de espera ausentes", () => {
  it("deve acrescentar os dois com ? quando a URL não tem query", () => {
    expect(ajustarUrlDoBanco(BASE)).toBe(`${BASE}?connect_timeout=15&pool_timeout=20`);
  });

  it("deve acrescentar os dois com & quando a URL já tem query", () => {
    expect(ajustarUrlDoBanco(`${BASE}?sslmode=require`)).toBe(
      `${BASE}?sslmode=require&connect_timeout=15&pool_timeout=20`,
    );
  });

  it("deve acrescentar os dois sem separador extra quando a URL termina em ?", () => {
    expect(ajustarUrlDoBanco(`${BASE}?`)).toBe(`${BASE}?connect_timeout=15&pool_timeout=20`);
  });

  it("deve acrescentar os dois sem separador extra quando a URL termina em &", () => {
    expect(ajustarUrlDoBanco(`${BASE}?sslmode=require&`)).toBe(
      `${BASE}?sslmode=require&connect_timeout=15&pool_timeout=20`,
    );
  });

  it("deve aceitar o protocolo postgres:", () => {
    const url = "postgres://dona:segredo@localhost:5432/italia";

    expect(ajustarUrlDoBanco(url)).toBe(`${url}?connect_timeout=15&pool_timeout=20`);
  });

  it("deve acrescentar em uma URL sem usuário nem senha", () => {
    const url = "postgresql://localhost/italia";

    expect(ajustarUrlDoBanco(url)).toBe(`${url}?connect_timeout=15&pool_timeout=20`);
  });

  it("deve devolver uma URL que o Prisma consegue ler, com os dois parâmetros", () => {
    const ajustada = new URL(ajustarUrlDoBanco(`${BASE}?sslmode=require`)!);

    expect(ajustada.searchParams.get("connect_timeout")).toBe("15");
    expect(ajustada.searchParams.get("pool_timeout")).toBe("20");
    expect(ajustada.searchParams.get("sslmode")).toBe("require");
  });
});

describe("ajustarUrlDoBanco — preserva o que já está definido", () => {
  it("deve acrescentar só pool_timeout quando connect_timeout já existe", () => {
    expect(ajustarUrlDoBanco(`${BASE}?connect_timeout=30`)).toBe(`${BASE}?connect_timeout=30&pool_timeout=20`);
  });

  it("deve acrescentar só connect_timeout quando pool_timeout já existe", () => {
    expect(ajustarUrlDoBanco(`${BASE}?pool_timeout=5`)).toBe(`${BASE}?pool_timeout=5&connect_timeout=15`);
  });

  it("deve devolver a URL intacta quando os dois já existem", () => {
    const url = `${BASE}?connect_timeout=30&pool_timeout=5`;

    expect(ajustarUrlDoBanco(url)).toBe(url);
  });

  it("deve devolver a URL intacta quando os dois já existem entre outros parâmetros", () => {
    const url = `${BASE}?sslmode=require&pool_timeout=0&pgbouncer=true&connect_timeout=0`;

    expect(ajustarUrlDoBanco(url)).toBe(url);
  });

  it("não deve duplicar um parâmetro que já existe com valor vazio", () => {
    expect(ajustarUrlDoBanco(`${BASE}?connect_timeout=`)).toBe(`${BASE}?connect_timeout=&pool_timeout=20`);
  });

  it("não deve mudar nada ao ser aplicada duas vezes", () => {
    const umaVez = ajustarUrlDoBanco(`${BASE}?sslmode=require`);

    expect(ajustarUrlDoBanco(umaVez)).toBe(umaVez);
  });

  it("não deve confundir um parâmetro de nome parecido com o que falta", () => {
    const url = `${BASE}?statement_connect_timeout=1&pool_timeout_ms=2`;

    expect(ajustarUrlDoBanco(url)).toBe(`${url}&connect_timeout=15&pool_timeout=20`);
  });

  it("deve acrescentar os dois quando o nome só aparece no usuário, na senha ou no banco", () => {
    const url = "postgresql://connect_timeout:pool_timeout@localhost/connect_timeout";

    expect(ajustarUrlDoBanco(url)).toBe(`${url}?connect_timeout=15&pool_timeout=20`);
  });
});

describe("ajustarUrlDoBanco — mantém o texto original byte a byte", () => {
  it("deve manter pgbouncer=true, sslmode e channel_binding como vieram", () => {
    const url = `${BASE}?sslmode=require&channel_binding=require&pgbouncer=true`;

    expect(ajustarUrlDoBanco(url)).toBe(`${url}&connect_timeout=15&pool_timeout=20`);
  });

  it.each([
    ["%40 (@)", "se%40nha"],
    ["%2F (/)", "se%2Fnha"],
    ["%23 (#)", "se%23nha"],
    ["os três juntos", "p%40ss%2Fw%23rd"],
    ["codificação em minúsculas", "se%2fnha%3a"],
    ["%25 (%)", "100%25certo"],
  ])("deve manter a senha com %s sem decodificar nem recodificar", (_caso, senha) => {
    const url = `postgresql://dona:${senha}@ep-teste.neon.tech/italia?sslmode=require`;

    const ajustada = ajustarUrlDoBanco(url)!;

    expect(ajustada).toBe(`${url}&connect_timeout=15&pool_timeout=20`);
    expect(ajustada.startsWith(url)).toBe(true);
  });

  it("deve manter a senha codificada também quando a URL não tem query", () => {
    const url = "postgresql://dona:p%40ss%2Fw%23rd@ep-teste.neon.tech/italia";

    expect(ajustarUrlDoBanco(url)).toBe(`${url}?connect_timeout=15&pool_timeout=20`);
  });

  it("deve manter maiúsculas do host, porta e nome do banco como vieram", () => {
    const url = "postgresql://Dona:Segredo@EP-Teste.Neon.Tech:5432/Italia%20Plano?sslmode=require";

    expect(ajustarUrlDoBanco(url)).toBe(`${url}&connect_timeout=15&pool_timeout=20`);
  });

  it("deve manter um valor de parâmetro codificado como veio", () => {
    const url = `${BASE}?options=endpoint%3Dep-teste-123456&schema=public`;

    expect(ajustarUrlDoBanco(url)).toBe(`${url}&connect_timeout=15&pool_timeout=20`);
  });
});

describe("ajustarUrlDoBanco — espaços e quebras de linha nas pontas", () => {
  it.each([
    ["espaço no início", `  ${BASE}?sslmode=require`],
    ["espaço no fim", `${BASE}?sslmode=require  `],
    ["quebra de linha no fim (\\n)", `${BASE}?sslmode=require\n`],
    ["quebra de linha do Windows no fim (\\r\\n)", `${BASE}?sslmode=require\r\n`],
    ["tab e quebras de linha nas duas pontas", `\n\t ${BASE}?sslmode=require \t\r\n`],
  ])("deve aparar e ajustar a URL com %s", (_caso, url) => {
    expect(ajustarUrlDoBanco(url)).toBe(`${BASE}?sslmode=require&connect_timeout=15&pool_timeout=20`);
  });

  it("deve usar ? quando a URL sem query vem com quebra de linha no fim", () => {
    expect(ajustarUrlDoBanco(`${BASE}\n`)).toBe(`${BASE}?connect_timeout=15&pool_timeout=20`);
  });

  it("não deve acrescentar separador extra quando a URL termina em ? seguida de espaço", () => {
    expect(ajustarUrlDoBanco(`${BASE}? `)).toBe(`${BASE}?connect_timeout=15&pool_timeout=20`);
  });

  it("deve devolver aparada a URL que já tem os dois parâmetros", () => {
    const url = `${BASE}?connect_timeout=30&pool_timeout=5`;

    expect(ajustarUrlDoBanco(` ${url}\n`)).toBe(url);
  });

  it("deve manter a senha codificada byte a byte ao aparar", () => {
    const url = "postgresql://dona:p%40ss%2Fw%23rd@ep-teste.neon.tech/italia?sslmode=require";

    expect(ajustarUrlDoBanco(`  ${url}\r\n`)).toBe(`${url}&connect_timeout=15&pool_timeout=20`);
  });

  it("deve devolver a string vazia quando só há espaços", () => {
    expect(ajustarUrlDoBanco("   ")).toBe("");
  });

  it("deve devolver a string vazia quando só há quebras de linha e tabs", () => {
    expect(ajustarUrlDoBanco("\r\n\t ")).toBe("");
  });

  it("deve devolver aparada a URL que não dá para ajustar", () => {
    expect(ajustarUrlDoBanco("  mysql://dona:segredo@localhost:3306/italia\n")).toBe(
      "mysql://dona:segredo@localhost:3306/italia",
    );
  });
});

describe("ajustarUrlDoBanco — aviso no log", () => {
  it.each([
    ["texto solto", "isto não é uma url"],
    ["endereço sem protocolo", "localhost:5432/italia"],
    ["protocolo mysql:", "mysql://dona:segredo@localhost:3306/italia"],
    ["protocolo file: (SQLite)", "file:./dev.db"],
    ["# no fim", `${BASE}?sslmode=require#fragmento`],
    ["# solto na senha", "postgresql://dona:se#nha@localhost/italia"],
    ["não ajustável e com espaços nas pontas", "  mysql://dona:segredo@localhost:3306/italia\n"],
  ])("deve avisar uma vez, com o texto fixo, quando não dá para ajustar: %s", (_caso, url) => {
    ajustarUrlDoBanco(url);

    expect(aviso).toHaveBeenCalledTimes(1);
    expect(aviso).toHaveBeenCalledWith(AVISO_URL_NAO_AJUSTADA);
  });

  it.each([
    ["mysql com senha", "mysql://dona:s3nh4-Secreta@banco.exemplo.com:3306/italia"],
    ["postgres com # e senha", "postgresql://dona:s3nh4-Secreta@banco.exemplo.com/italia#fragmento"],
    ["texto ininterpretável com senha", "dona:s3nh4-Secreta@banco.exemplo.com/italia"],
  ])("não deve colocar a URL, o host nem a senha no aviso: %s", (_caso, url) => {
    ajustarUrlDoBanco(url);

    const registrado = JSON.stringify(aviso.mock.calls);
    expect(aviso).toHaveBeenCalledTimes(1);
    expect(registrado).not.toContain(url);
    expect(registrado).not.toContain("s3nh4-Secreta");
    expect(registrado).not.toContain("banco.exemplo.com");
    expect(registrado).not.toContain("dona");
  });

  it.each([
    ["undefined", undefined],
    ["string vazia", ""],
    ["só espaços", "   "],
    ["só quebra de linha", "\r\n"],
  ])("não deve avisar quando a URL é %s", (_caso, url) => {
    ajustarUrlDoBanco(url);

    expect(aviso).not.toHaveBeenCalled();
  });

  it.each([
    ["sem query", BASE],
    ["com query", `${BASE}?sslmode=require&pgbouncer=true`],
    ["já com os dois parâmetros", `${BASE}?connect_timeout=30&pool_timeout=5`],
    ["só com um dos parâmetros", `${BASE}?pool_timeout=5`],
    ["protocolo postgres:", "postgres://dona:segredo@localhost:5432/italia"],
    ["senha com %23 codificado", "postgresql://dona:se%23nha@localhost/italia"],
    ["com espaços e quebra de linha nas pontas", `  ${BASE}?sslmode=require\r\n`],
  ])("não deve avisar quando a URL é ajustável: %s", (_caso, url) => {
    ajustarUrlDoBanco(url);

    expect(aviso).not.toHaveBeenCalled();
  });
});

describe("ajustarUrlDoBanco — devolve como veio o que não dá para ajustar", () => {
  it("deve devolver undefined para undefined", () => {
    expect(ajustarUrlDoBanco(undefined)).toBeUndefined();
  });

  it("deve devolver a string vazia para a string vazia", () => {
    expect(ajustarUrlDoBanco("")).toBe("");
  });

  it.each([
    ["texto solto", "isto não é uma url"],
    ["endereço sem protocolo", "localhost:5432/italia"],
    ["host sem protocolo", "ep-teste.neon.tech/italia"],
    ["porta que não é número", "postgresql://dona:segredo@localhost:porta/italia"],
  ])("deve devolver intacto um texto que não dá para interpretar: %s", (_caso, texto) => {
    expect(ajustarUrlDoBanco(texto)).toBe(texto);
  });

  it.each([
    ["mysql:", "mysql://dona:segredo@localhost:3306/italia"],
    ["file: (SQLite)", "file:./dev.db"],
    ["https:", "https://exemplo.com/italia?sslmode=require"],
    ["mongodb+srv:", "mongodb+srv://dona:segredo@cluster.exemplo.net/italia"],
  ])("deve devolver intacta uma URL de protocolo %s", (_caso, url) => {
    expect(ajustarUrlDoBanco(url)).toBe(url);
  });

  it.each([
    ["no fim, depois da query", `${BASE}?sslmode=require#fragmento`],
    ["no fim, sem query", `${BASE}#fragmento`],
    ["solto na senha (não codificado)", "postgresql://dona:se#nha@localhost/italia"],
    ["sozinho no fim", `${BASE}?sslmode=require#`],
  ])("deve devolver intacta uma URL com #: %s", (_caso, url) => {
    expect(ajustarUrlDoBanco(url)).toBe(url);
  });
});
