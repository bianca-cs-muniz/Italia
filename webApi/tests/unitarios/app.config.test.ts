import { afterEach, describe, expect, it, vi } from "vitest";

// app.config lê process.env uma única vez, ao ser importado. Cada teste define
// as variáveis e importa o módulo de novo.
type Variaveis = Record<string, string | undefined>;

async function carregarConfig(variaveis: Variaveis) {
  for (const [nome, valor] of Object.entries(variaveis)) vi.stubEnv(nome, valor);
  vi.resetModules();
  return (await import("@config/app.config")).default;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("app.config — URL_FRONTEND", () => {
  it("deve usar http://localhost:3000 quando a variável não está definida", async () => {
    const config = await carregarConfig({ URL_FRONTEND: undefined });

    expect(config.origensPermitidas).toEqual(["http://localhost:3000"]);
  });

  it("deve usar http://localhost:3000 quando a variável está vazia", async () => {
    const config = await carregarConfig({ URL_FRONTEND: "" });

    expect(config.origensPermitidas).toEqual(["http://localhost:3000"]);
  });

  it("deve aceitar uma única origem", async () => {
    const config = await carregarConfig({ URL_FRONTEND: "https://italiaplano.vercel.app" });

    expect(config.origensPermitidas).toEqual(["https://italiaplano.vercel.app"]);
  });

  it("deve separar várias origens por vírgula, tirando os espaços", async () => {
    const config = await carregarConfig({ URL_FRONTEND: " http://localhost:3000 ,https://a.com,  https://b.com  " });

    expect(config.origensPermitidas).toEqual(["http://localhost:3000", "https://a.com", "https://b.com"]);
  });

  it("deve tirar a barra do fim de cada origem", async () => {
    const config = await carregarConfig({ URL_FRONTEND: "https://a.com/,https://b.com///" });

    expect(config.origensPermitidas).toEqual(["https://a.com", "https://b.com"]);
  });

  it("deve descartar entradas vazias entre vírgulas", async () => {
    const config = await carregarConfig({ URL_FRONTEND: "https://a.com,, ,https://b.com," });

    expect(config.origensPermitidas).toEqual(["https://a.com", "https://b.com"]);
  });
});

describe("app.config — PROXIES_CONFIAVEIS", () => {
  it.each([
    ["não definida", undefined, 0],
    ["vazia", "", 0],
    ["0", "0", 0],
    ["1", "1", 1],
    ["2 com espaços", " 2 ", 2],
    ["negativa", "-1", 0],
    ["fracionária", "1.5", 0],
    ["texto", "abc", 0],
    ["true (o Express confiaria em qualquer proxy)", "true", 0],
    ["Infinity", "Infinity", 0],
  ])("deve ler a variável %s", async (_caso, valor, esperado) => {
    const config = await carregarConfig({ PROXIES_CONFIAVEIS: valor });

    expect(config.proxiesConfiaveis).toBe(esperado);
  });
});

describe("app.config — ambiente e porta", () => {
  it("deve marcar ehTeste quando NODE_ENV=test", async () => {
    const config = await carregarConfig({ NODE_ENV: "test" });

    expect(config).toMatchObject({ ambiente: "test", ehTeste: true, ehProducao: false });
  });

  it("deve marcar ehProducao quando NODE_ENV=production", async () => {
    const config = await carregarConfig({ NODE_ENV: "production" });

    expect(config).toMatchObject({ ambiente: "production", ehTeste: false, ehProducao: true });
  });

  it("deve assumir development quando NODE_ENV não está definida", async () => {
    const config = await carregarConfig({ NODE_ENV: undefined });

    expect(config).toMatchObject({ ambiente: "development", ehTeste: false, ehProducao: false });
  });

  it("deve usar a porta 4000 quando PORTA e PORT não estão definidas", async () => {
    const config = await carregarConfig({ PORTA: undefined, PORT: undefined });

    expect(config.porta).toBe(4000);
  });

  it("deve preferir PORTA a PORT", async () => {
    const config = await carregarConfig({ PORTA: "5000", PORT: "6000" });

    expect(config.porta).toBe(5000);
  });

  it("deve usar PORT (definida pelo host) quando PORTA não existe", async () => {
    const config = await carregarConfig({ PORTA: undefined, PORT: "6000" });

    expect(config.porta).toBe(6000);
  });
});

describe("app.config — limites documentados no README", () => {
  it("deve manter os tetos de fotos, lugares e requisições", async () => {
    const config = await carregarConfig({});

    expect(config.limites).toEqual({
      tamanhoMaximoFoto: 2 * 1024 * 1024,
      fotosPorLugar: 12,
      maximoLugares: 300,
      maximoFotosOrfas: 200,
      horasParaApagarFotoOrfa: 24,
    });
    expect(config.limiteRequisicoes).toEqual({ janelaMs: 60_000, escritasPorJanela: 60, uploadsPorJanela: 30 });
  });
});
