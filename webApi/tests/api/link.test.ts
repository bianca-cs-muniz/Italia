import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../../src/app";
import { banco } from "../apoio/prisma-em-memoria";
import { criarLugar, lugarValido } from "../apoio/fabricas";

const MENSAGEM = "link: Link inválido. Use um endereço que comece com http:// ou https://.";

describe("campo link de um lugar", () => {
  it.each([
    ["https://", "https://www.booking.com/hotel/it/artemide.html?aid=1&checkin=2027-05-01#quartos"],
    ["http://", "http://exemplo.com/restaurante"],
    ["vazio", ""],
    ["só espaços (vira vazio)", "   "],
    ["https com maiúsculas no protocolo", "HTTPS://Exemplo.com/Hotel"],
    ["https com porta e IP", "https://192.168.0.1:8443/caminho"],
    ["https com acento no caminho", "https://exemplo.com/atração/coliseu"],
  ])("deve aceitar link %s", async (_caso, link) => {
    const resposta = await request(app).post("/api/lugares").send(lugarValido({ link }));

    expect(resposta.status).toBe(201);
    expect(resposta.body.link).toBe(link.trim());
  });

  it.each([
    ["javascript:", "javascript:alert(document.cookie)"],
    ["javascript: com maiúsculas", "JavaScript:alert(1)"],
    ["javascript: com espaços antes", "   javascript:alert(1)"],
    ["javascript: com tab no meio do protocolo", "java\tscript:alert(1)"],
    ["javascript: com quebra de linha no meio do protocolo", "java\nscript:alert(1)"],
    ["javascript: disfarçado de http", "javascript://exemplo.com/%0aalert(1)"],
    ["data:", "data:text/html,<script>alert(1)</script>"],
    ["data: em base64", "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=="],
    ["ftp:", "ftp://exemplo.com/arquivo.zip"],
    ["vbscript:", "vbscript:msgbox(1)"],
    ["file:", "file:///etc/passwd"],
    ["mailto:", "mailto:alguem@exemplo.com"],
    ["tel:", "tel:+390612345678"],
    ["blob:", "blob:https://exemplo.com/3f2b8c1e-5d4a-4c7b-9e1f-0a1b2c3d4e5f"],
    ["endereço sem protocolo", "www.exemplo.com"],
    ["caminho relativo", "/hoteis/roma"],
    ["endereço relativo ao protocolo", "//exemplo.com/hotel"],
    ["texto qualquer", "ver no instagram"],
    ["só o protocolo", "https://"],
  ])("deve recusar link %s", async (_caso, link) => {
    const resposta = await request(app).post("/api/lugares").send(lugarValido({ link }));

    expect(resposta.status).toBe(400);
    expect(resposta.body).toEqual({ error: MENSAGEM });
    expect(banco.lugares()).toHaveLength(0);
  });

  it("deve recusar um link que não é texto", async () => {
    const resposta = await request(app)
      .post("/api/lugares")
      .send(lugarValido({ link: ["https://exemplo.com"] }));

    expect(resposta.status).toBe(400);
  });

  it("deve aplicar a mesma regra na edição e manter o link anterior quando recusa", async () => {
    const lugar = await criarLugar(app, { link: "https://exemplo.com/original" });

    const resposta = await request(app)
      .put(`/api/lugares/${lugar.id}`)
      .send(lugarValido({ link: "javascript:alert(1)" }));

    expect(resposta.status).toBe(400);
    expect(resposta.body).toEqual({ error: MENSAGEM });
    expect(banco.lugares()[0].link).toBe("https://exemplo.com/original");
  });

  it("deve permitir apagar o link na edição", async () => {
    const lugar = await criarLugar(app, { link: "https://exemplo.com/original" });

    const resposta = await request(app).put(`/api/lugares/${lugar.id}`).send(lugarValido({ link: "" }));

    expect(resposta.status).toBe(200);
    expect(resposta.body.link).toBe("");
  });
});
