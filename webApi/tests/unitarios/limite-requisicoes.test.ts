import express, { type Application, type RequestHandler } from "express";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { jpegMinimo } from "../apoio/fabricas";

const MENSAGEM_429 = "Muitas requisições em pouco tempo. Aguarde um minuto e tente de novo.";

// O middleware decide se fica ligado ao ser importado (lê NODE_ENV por
// app.config). Cada teste escolhe o ambiente e importa uma cópia nova, com os
// contadores zerados.
async function carregarLimite(ambiente: string) {
  vi.stubEnv("NODE_ENV", ambiente);
  vi.resetModules();
  return (await import("@middlewares/limite-requisicoes")).default;
}

// App à parte, só com o middleware na frente de uma rota qualquer.
function appCom(limite: RequestHandler): Application {
  const app = express();
  app.post("/alvo", limite, (_req, res) => res.status(200).json({ ok: true }));
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(err.status ?? 500).json({ error: err.message });
  });
  return app;
}

async function disparar(app: Application, quantas: number) {
  const status: number[] = [];
  for (let i = 0; i < quantas; i++) status.push((await request(app).post("/alvo")).status);
  return status;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("middleware de limite de requisições (isolado)", () => {
  it("deve deixar passar as 60 primeiras escritas do minuto e responder 429 na 61ª", async () => {
    const limite = await carregarLimite("development");
    const app = appCom(limite.escritas);

    const primeiras = await disparar(app, 60);
    const excedente = await request(app).post("/alvo");

    expect(primeiras.every((status) => status === 200)).toBe(true);
    expect(excedente.status).toBe(429);
    expect(excedente.body).toEqual({ error: MENSAGEM_429 });
  });

  it("deve deixar passar os 30 primeiros envios de foto do minuto e responder 429 no 31º", async () => {
    const limite = await carregarLimite("development");
    const app = appCom(limite.uploads);

    const primeiras = await disparar(app, 30);
    const excedente = await request(app).post("/alvo");

    expect(primeiras.every((status) => status === 200)).toBe(true);
    expect(excedente.status).toBe(429);
    expect(excedente.body).toEqual({ error: MENSAGEM_429 });
  });

  it("deve continuar respondendo 429 nas requisições seguintes à que estourou", async () => {
    const limite = await carregarLimite("development");
    const app = appCom(limite.uploads);
    await disparar(app, 30);

    const seguintes = await disparar(app, 3);

    expect(seguintes).toEqual([429, 429, 429]);
  });

  it("deve contar escritas e envios de foto em separado", async () => {
    const limite = await carregarLimite("development");
    await disparar(appCom(limite.uploads), 31);

    const escrita = await request(appCom(limite.escritas)).post("/alvo");

    expect(escrita.status).toBe(200);
  });

  it("deve informar o limite e o que resta nos headers RateLimit-*", async () => {
    const limite = await carregarLimite("development");

    const resposta = await request(appCom(limite.uploads)).post("/alvo");

    expect(resposta.headers["ratelimit-limit"]).toBe("30");
    expect(resposta.headers["ratelimit-remaining"]).toBe("29");
    expect(resposta.headers["x-ratelimit-limit"]).toBeUndefined();
  });

  it("deve valer também em produção", async () => {
    const limite = await carregarLimite("production");
    const app = appCom(limite.uploads);

    const status = await disparar(app, 31);

    expect(status[30]).toBe(429);
  });

  it("deve ficar desligado quando NODE_ENV=test", async () => {
    const limite = await carregarLimite("test");
    const app = appCom(limite.uploads);

    const status = await disparar(app, 35);

    expect(status.every((codigo) => codigo === 200)).toBe(true);
  });
});

// O mesmo limite, agora com o app de verdade (rotas + tratamento global de
// erros) e o banco em memória.
describe("limite de requisições no app completo (NODE_ENV=development)", () => {
  async function carregarApp(proxiesConfiaveis = "0") {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("PROXIES_CONFIAVEIS", proxiesConfiaveis);
    vi.resetModules();
    return (await import("../../src/app")).default;
  }

  function enviarFotoDe(app: Application, xForwardedFor: string) {
    return request(app)
      .post("/api/fotos")
      .set("Content-Type", "image/jpeg")
      .set("X-Forwarded-For", xForwardedFor)
      .send(jpegMinimo());
  }

  it("não deve deixar burlar o limite forjando X-Forwarded-For quando não há proxy (PROXIES_CONFIAVEIS=0)", async () => {
    // O express-rate-limit avisa no console que recebeu o header sem proxy configurado.
    vi.spyOn(console, "error").mockImplementation(() => {});
    const app = await carregarApp("0");
    for (let i = 0; i < 30; i++) await enviarFotoDe(app, `10.0.0.${i}`);

    const excedente = await enviarFotoDe(app, "10.0.1.1");

    expect(excedente.status).toBe(429);
  });

  it("deve contar por IP de quem chamou quando há um proxy na frente (PROXIES_CONFIAVEIS=1)", async () => {
    const app = await carregarApp("1");
    for (let i = 0; i < 30; i++) await enviarFotoDe(app, "203.0.113.7");

    const mesmoIp = await enviarFotoDe(app, "203.0.113.7");
    const outroIp = await enviarFotoDe(app, "198.51.100.9");

    expect(mesmoIp.status).toBe(429);
    expect(outroIp.status).toBe(201);
  });

  it("não deve deixar burlar o limite acrescentando IPs falsos antes do IP informado pelo proxy", async () => {
    const app = await carregarApp("1");
    // O proxy acrescenta o IP real no fim; o que vem antes foi escrito por quem chamou.
    for (let i = 0; i < 30; i++) await enviarFotoDe(app, `10.0.0.${i}, 203.0.113.7`);

    const excedente = await enviarFotoDe(app, "10.9.9.9, 203.0.113.7");

    expect(excedente.status).toBe(429);
  });

  it("deve responder 429 em JSON na 61ª escrita e continuar atendendo leituras", async () => {
    const app = await carregarApp();
    for (let i = 0; i < 60; i++) {
      await request(app).put("/api/checklist/trens").send({ marcado: i % 2 === 0 });
    }

    const escrita = await request(app).put("/api/checklist/trens").send({ marcado: true });
    const leituraChecklist = await request(app).get("/api/checklist");
    const leituraLugares = await request(app).get("/api/lugares");

    expect(escrita.status).toBe(429);
    expect(escrita.body).toEqual({ error: MENSAGEM_429 });
    expect(leituraChecklist.status).toBe(200);
    expect(leituraLugares.status).toBe(200);
  });

  it("deve somar no mesmo limite as escritas de lugares e do checklist", async () => {
    const app = await carregarApp();
    for (let i = 0; i < 60; i++) {
      await request(app).put("/api/checklist/trens").send({ marcado: true });
    }

    const criacao = await request(app).post("/api/lugares").send({});
    const exclusao = await request(app).delete("/api/lugares/3f2b8c1e-5d4a-4c7b-9e1f-0a1b2c3d4e5f");

    expect(criacao.status).toBe(429);
    expect(exclusao.status).toBe(429);
  });

  it("deve responder 429 no 31º envio de foto sem gravar a foto", async () => {
    const app = await carregarApp();
    const enviar = () => request(app).post("/api/fotos").set("Content-Type", "image/jpeg").send(jpegMinimo());
    const ids: string[] = [];
    for (let i = 0; i < 30; i++) ids.push((await enviar()).body.id);

    const excedente = await enviar();
    const ultimaAceita = await request(app).get(`/api/fotos/${ids[29]}`);

    expect(new Set(ids).size).toBe(30);
    expect(excedente.status).toBe(429);
    expect(excedente.body).toEqual({ error: MENSAGEM_429 });
    expect(ultimaAceita.status).toBe(200);
  });
});
