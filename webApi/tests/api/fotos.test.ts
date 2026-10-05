import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../../src/app";
import { banco } from "../apoio/prisma-em-memoria";
import {
  GIF_MINIMO,
  SVG_MINIMO,
  UUID_INEXISTENTE,
  enviarFoto,
  jpegMinimo,
  obterFoto,
  pngMinimo,
  postarFoto,
  requisicaoCrua,
  webpMinimo,
} from "../apoio/fabricas";

const DOIS_MB = 2 * 1024 * 1024;
const HORA = 60 * 60 * 1000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const TIPO_NAO_ACEITO = { error: "Tipo de arquivo não aceito. Envie uma imagem JPEG, PNG ou WebP." };
const FOTO_INVALIDA = { error: "O arquivo enviado não é uma imagem válida do tipo informado." };
const FOTO_GRANDE = { error: "A foto pode ter no máximo 2 MB." };

const IMAGENS_VALIDAS: [string, string, () => Buffer][] = [
  ["JPEG", "image/jpeg", jpegMinimo],
  ["PNG", "image/png", pngMinimo],
  ["WebP", "image/webp", webpMinimo],
];

describe("POST /api/fotos — envio válido", () => {
  it.each(IMAGENS_VALIDAS)("deve responder 201 { id } para um %s", async (_nome, tipoMime, bytes) => {
    const resposta = await postarFoto(app, tipoMime, bytes());

    expect(resposta.status).toBe(201);
    expect(Object.keys(resposta.body)).toEqual(["id"]);
    expect(resposta.body.id).toMatch(UUID);
  });

  it("deve gravar a foto órfã, com o tipo e o tamanho do arquivo", async () => {
    const bytes = pngMinimo();

    const id = await enviarFoto(app, "image/png", bytes);

    expect(banco.fotos()).toMatchObject([{ id, lugarId: null, tipoMime: "image/png", tamanho: bytes.length }]);
  });

  it("deve dar um id diferente a cada envio do mesmo arquivo", async () => {
    const primeiro = await enviarFoto(app);
    const segundo = await enviarFoto(app);

    expect(primeiro).not.toBe(segundo);
    expect(banco.fotos()).toHaveLength(2);
  });

  it("deve aceitar o Content-Type com parâmetros e em maiúsculas", async () => {
    const resposta = await postarFoto(app, "IMAGE/JPEG; charset=binary", jpegMinimo());

    expect(resposta.status).toBe(201);
    expect(banco.fotos()[0].tipoMime).toBe("image/jpeg");
  });

  it("deve aceitar uma foto com exatamente 2 MB", async () => {
    const bytes = jpegMinimo(DOIS_MB - jpegMinimo().length);

    const resposta = await postarFoto(app, "image/jpeg", bytes);

    expect(bytes.length).toBe(DOIS_MB);
    expect(resposta.status).toBe(201);
  });
});

describe("POST /api/fotos — tipo não aceito → 415", () => {
  it.each([
    ["SVG", "image/svg+xml", SVG_MINIMO],
    ["GIF", "image/gif", GIF_MINIMO],
    ["PDF", "application/pdf", Buffer.from("%PDF-1.7")],
    ["binário genérico com bytes de JPEG", "application/octet-stream", jpegMinimo()],
    ["image/jpg (apelido) com bytes de JPEG", "image/jpg", jpegMinimo()],
    ["texto com bytes de PNG", "text/plain", pngMinimo()],
  ])("deve recusar %s", async (_nome, tipoMime, bytes) => {
    const resposta = await postarFoto(app, tipoMime, bytes);

    expect(resposta.status).toBe(415);
    expect(resposta.body).toEqual(TIPO_NAO_ACEITO);
    expect(banco.fotos()).toHaveLength(0);
  });

  it("deve recusar o envio sem Content-Type, mesmo com bytes de JPEG", async () => {
    const resposta = await requisicaoCrua(app, { metodo: "POST", caminho: "/api/fotos", corpo: jpegMinimo() });

    expect(resposta.status).toBe(415);
    expect(JSON.parse(resposta.corpo)).toEqual(TIPO_NAO_ACEITO);
    expect(banco.fotos()).toHaveLength(0);
  });

  it("deve recusar a requisição sem corpo e sem Content-Type", async () => {
    const resposta = await request(app).post("/api/fotos");

    expect(resposta.status).toBe(415);
    expect(resposta.body).toEqual(TIPO_NAO_ACEITO);
  });

  it("deve recusar uma foto enviada como JSON (base64)", async () => {
    const resposta = await request(app)
      .post("/api/fotos")
      .send({ dados: jpegMinimo().toString("base64"), tipoMime: "image/jpeg" });

    expect(resposta.status).toBe(415);
    expect(resposta.body).toEqual(TIPO_NAO_ACEITO);
    expect(banco.fotos()).toHaveLength(0);
  });
});

describe("POST /api/fotos — bytes que não batem com o header → 415", () => {
  it.each([
    ["header image/jpeg com bytes de PNG", "image/jpeg", pngMinimo()],
    ["header image/png com bytes de JPEG", "image/png", jpegMinimo()],
    ["header image/webp com bytes de PNG", "image/webp", pngMinimo()],
    ["header image/jpeg com bytes de WebP", "image/jpeg", webpMinimo()],
    ["header image/png com um SVG", "image/png", SVG_MINIMO],
    ["header image/jpeg com um GIF", "image/jpeg", GIF_MINIMO],
    ["header image/jpeg com HTML", "image/jpeg", Buffer.from("<html><script>alert(1)</script></html>")],
    ["header image/webp com um RIFF que não é WebP", "image/webp", Buffer.from("RIFF\u0000\u0000\u0000\u0000WAVEfmt ")],
    ["header image/png com a assinatura cortada", "image/png", pngMinimo().subarray(0, 4)],
  ])("deve recusar %s", async (_caso, tipoMime, bytes) => {
    const resposta = await postarFoto(app, tipoMime, bytes);

    expect(resposta.status).toBe(415);
    expect(resposta.body).toEqual(FOTO_INVALIDA);
    expect(banco.fotos()).toHaveLength(0);
  });

  it("deve recusar o corpo vazio com header de imagem", async () => {
    const resposta = await requisicaoCrua(app, {
      metodo: "POST",
      caminho: "/api/fotos",
      headers: { "Content-Type": "image/jpeg", "Content-Length": "0" },
    });

    expect(resposta.status).toBe(415);
    expect(JSON.parse(resposta.corpo)).toEqual(FOTO_INVALIDA);
  });

  it("deve recusar o corpo comprimido (Content-Encoding), para o limite valer sobre o que chega", async () => {
    const resposta = await request(app)
      .post("/api/fotos")
      .set("Content-Type", "image/jpeg")
      .set("Content-Encoding", "gzip")
      .send(jpegMinimo());

    expect(resposta.status).toBe(415);
    expect(resposta.body).toHaveProperty("error");
    expect(banco.fotos()).toHaveLength(0);
  });
});

describe("POST /api/fotos — tamanho → 413", () => {
  it("deve recusar uma foto com 1 byte a mais que 2 MB", async () => {
    const bytes = jpegMinimo(DOIS_MB - jpegMinimo().length + 1);

    const resposta = await postarFoto(app, "image/jpeg", bytes);

    expect(bytes.length).toBe(DOIS_MB + 1);
    expect(resposta.status).toBe(413);
    expect(resposta.body).toEqual(FOTO_GRANDE);
    expect(banco.fotos()).toHaveLength(0);
  });

  it("deve recusar uma foto de 3 MB em PNG", async () => {
    const bytes = Buffer.concat([pngMinimo(), Buffer.alloc(3 * 1024 * 1024, 7)]);

    const resposta = await postarFoto(app, "image/png", bytes);

    expect(resposta.status).toBe(413);
    expect(resposta.body).toEqual(FOTO_GRANDE);
  });
});

describe("GET /api/fotos/:id", () => {
  it.each(IMAGENS_VALIDAS)("deve devolver os mesmos bytes e o Content-Type de um %s", async (_nome, tipoMime, bytes) => {
    const enviados = Buffer.concat([bytes(), Buffer.from([0x00, 0xff, 0x0a, 0x0d, 0x80, 0x7f])]);
    const id = await enviarFoto(app, tipoMime, enviados);

    const resposta = await obterFoto(app, id);

    expect(resposta.status).toBe(200);
    expect(resposta.headers["content-type"]).toBe(tipoMime);
    expect(Buffer.isBuffer(resposta.body)).toBe(true);
    expect(Buffer.compare(resposta.body, enviados)).toBe(0);
    expect(resposta.headers["content-length"]).toBe(String(enviados.length));
  });

  it("deve permitir que o navegador guarde a foto para sempre (Cache-Control imutável)", async () => {
    const id = await enviarFoto(app);

    const resposta = await obterFoto(app, id);

    expect(resposta.headers["cache-control"]).toBe("public, max-age=31536000, immutable");
  });

  it("deve enviar Cross-Origin-Resource-Policy: cross-origin, para o <img> do front em outra origem", async () => {
    const id = await enviarFoto(app);

    const resposta = await obterFoto(app, id);

    expect(resposta.headers["cross-origin-resource-policy"]).toBe("cross-origin");
  });

  it("deve enviar X-Content-Type-Options: nosniff junto com a foto", async () => {
    const id = await enviarFoto(app);

    const resposta = await obterFoto(app, id);

    expect(resposta.headers["x-content-type-options"]).toBe("nosniff");
  });

  it("deve servir o tipo gravado no envio, ignorando o Accept de quem pede", async () => {
    const id = await enviarFoto(app, "image/webp", webpMinimo());

    const resposta = await obterFoto(app, id).set("Accept", "text/html");

    expect(resposta.headers["content-type"]).toBe("image/webp");
  });

  it("deve aceitar o id em maiúsculas", async () => {
    const id = await enviarFoto(app);

    const resposta = await obterFoto(app, id.toUpperCase());

    expect(resposta.status).toBe(200);
  });

  it("deve responder 404 { error } quando o id não existe", async () => {
    const resposta = await request(app).get(`/api/fotos/${UUID_INEXISTENTE}`);

    expect(resposta.status).toBe(404);
    expect(resposta.body).toEqual({ error: "Foto não encontrada." });
  });

  it("não deve mandar o navegador guardar a resposta de foto não encontrada", async () => {
    const resposta = await request(app).get(`/api/fotos/${UUID_INEXISTENTE}`);

    expect(resposta.headers["cache-control"] ?? "").not.toContain("immutable");
  });

  it("deve responder 400 quando o id não é um uuid", async () => {
    const resposta = await request(app).get("/api/fotos/foto-1.jpg");

    expect(resposta.status).toBe(400);
    expect(resposta.body).toEqual({ error: "id: Identificador inválido." });
  });
});

describe("teto de fotos órfãs (enviadas e ainda sem lugar)", () => {
  it("deve responder 429 quando já existem 200 fotos órfãs", async () => {
    for (let i = 0; i < 200; i++) banco.semearFoto();

    const resposta = await postarFoto(app, "image/jpeg", jpegMinimo());

    expect(resposta.status).toBe(429);
    expect(resposta.body).toEqual({
      error: "Há fotos demais enviadas e ainda não salvas em um lugar. Tente de novo mais tarde.",
    });
    expect(banco.fotos()).toHaveLength(200);
  });

  it("deve aceitar a 200ª foto órfã", async () => {
    for (let i = 0; i < 199; i++) banco.semearFoto();

    const resposta = await postarFoto(app, "image/jpeg", jpegMinimo());

    expect(resposta.status).toBe(201);
    expect(banco.fotosOrfas()).toHaveLength(200);
  });

  it("não deve contar no teto as fotos que já pertencem a um lugar", async () => {
    const lugar = banco.semearLugar();
    for (let i = 0; i < 200; i++) banco.semearFoto({ lugarId: lugar.id, ordem: i });
    for (let i = 0; i < 199; i++) banco.semearFoto();

    const resposta = await postarFoto(app, "image/jpeg", jpegMinimo());

    expect(resposta.status).toBe(201);
  });

  it("deve conferir o tipo do arquivo antes do teto (415, e não 429, para arquivo inválido)", async () => {
    for (let i = 0; i < 200; i++) banco.semearFoto();

    const resposta = await postarFoto(app, "image/jpeg", pngMinimo());

    expect(resposta.status).toBe(415);
  });
});

describe("faxina das fotos órfãs antigas", () => {
  it("deve apagar, no envio seguinte, a órfã enviada há mais de 24 h", async () => {
    const antiga = banco.semearFoto({ criadoEm: new Date(Date.now() - 25 * HORA) });

    const nova = await enviarFoto(app);
    const respostaAntiga = await request(app).get(`/api/fotos/${antiga.id}`);

    expect(respostaAntiga.status).toBe(404);
    expect(banco.fotos().map((f) => f.id)).toEqual([nova]);
  });

  it("deve manter a órfã enviada há menos de 24 h", async () => {
    const recente = banco.semearFoto({ criadoEm: new Date(Date.now() - 23 * HORA) });

    await enviarFoto(app);
    const resposta = await obterFoto(app, recente.id);

    expect(resposta.status).toBe(200);
  });

  it("nunca deve apagar a foto de um lugar, por mais antiga que seja", async () => {
    const lugar = banco.semearLugar();
    const doLugar = banco.semearFoto({ lugarId: lugar.id, criadoEm: new Date(Date.now() - 24 * 365 * HORA) });

    await enviarFoto(app);
    const resposta = await obterFoto(app, doLugar.id);

    expect(resposta.status).toBe(200);
    expect(banco.fotosDoLugar(lugar.id)).toHaveLength(1);
  });

  it("deve liberar o teto: com 200 órfãs antigas, o envio seguinte é aceito", async () => {
    for (let i = 0; i < 200; i++) banco.semearFoto({ criadoEm: new Date(Date.now() - 48 * HORA) });

    const resposta = await postarFoto(app, "image/jpeg", jpegMinimo());

    expect(resposta.status).toBe(201);
    expect(banco.fotos()).toHaveLength(1);
  });

  it("não deve apagar as órfãs antigas só por alguém pedir uma foto (GET)", async () => {
    const antiga = banco.semearFoto({ criadoEm: new Date(Date.now() - 25 * HORA) });

    const resposta = await obterFoto(app, antiga.id);

    expect(resposta.status).toBe(200);
    expect(banco.fotos()).toHaveLength(1);
  });
});
