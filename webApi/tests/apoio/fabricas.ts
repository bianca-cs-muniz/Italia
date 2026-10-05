import http from "node:http";
import type { AddressInfo } from "node:net";
import type { Application } from "express";
import request from "supertest";

export const UUID_INEXISTENTE = "3f2b8c1e-5d4a-4c7b-9e1f-0a1b2c3d4e5f";

// Corpo válido de POST/PUT /api/lugares (todos os campos são obrigatórios).
export function lugarValido(sobrescritas: Record<string, unknown> = {}) {
  return {
    trecho: "roma",
    tipo: "Hospedagem",
    nome: "Hotel Artemide",
    resumo: "Perto da estação Termini",
    preco: "€ 180 / noite",
    link: "https://exemplo.com/hotel-artemide",
    descricao: "Quarto duplo com café da manhã.",
    destaques: ["Café da manhã", "Terraço"],
    fotos: [] as string[],
    ...sobrescritas,
  };
}

// Menores arquivos que carregam a assinatura correta de cada tipo. Não são
// imagens que abrem num visualizador: a API só confere os primeiros bytes.
export function jpegMinimo(extra = 0) {
  return Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]), Buffer.alloc(extra, 1)]);
}

export function pngMinimo() {
  return Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52]);
}

export function webpMinimo() {
  return Buffer.concat([
    Buffer.from("RIFF", "latin1"),
    Buffer.from([0x1a, 0x00, 0x00, 0x00]),
    Buffer.from("WEBPVP8 ", "latin1"),
    Buffer.from([0x0e, 0x00, 0x00, 0x00]),
  ]);
}

export const GIF_MINIMO = Buffer.from("GIF89a\u0001\u0000\u0001\u0000", "latin1");
export const SVG_MINIMO = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>', "utf8");

export function postarFoto(app: Application, tipoMime: string, bytes: Buffer) {
  return request(app).post("/api/fotos").set("Content-Type", tipoMime).send(bytes);
}

// Envia uma foto válida e devolve o id (falha o teste se o envio não der 201).
export async function enviarFoto(app: Application, tipoMime = "image/jpeg", bytes: Buffer = jpegMinimo()) {
  const resposta = await postarFoto(app, tipoMime, bytes);
  if (resposta.status !== 201) {
    throw new Error(`Preparação: POST /api/fotos devolveu ${resposta.status} ${JSON.stringify(resposta.body)}`);
  }
  return resposta.body.id as string;
}

// Cria um lugar válido e devolve o corpo da resposta (falha o teste se não der 201).
export async function criarLugar(app: Application, sobrescritas: Record<string, unknown> = {}) {
  const resposta = await request(app).post("/api/lugares").send(lugarValido(sobrescritas));
  if (resposta.status !== 201) {
    throw new Error(`Preparação: POST /api/lugares devolveu ${resposta.status} ${JSON.stringify(resposta.body)}`);
  }
  return resposta.body as Record<string, any> & { id: string; fotos: string[] };
}

export function obterFoto(app: Application, id: string) {
  // responseType("blob"): o corpo chega como Buffer, byte a byte.
  return request(app).get(`/api/fotos/${id}`).responseType("blob");
}

// Requisição feita direto pelo módulo http, para controlar exatamente os
// headers enviados (o supertest acrescenta um Content-Type por conta própria).
export async function requisicaoCrua(
  app: Application,
  opcoes: { metodo: string; caminho: string; headers?: Record<string, string>; corpo?: Buffer },
) {
  const servidor = http.createServer(app);
  await new Promise<void>((resolve) => servidor.listen(0, "127.0.0.1", resolve));
  const { port } = servidor.address() as AddressInfo;

  try {
    return await new Promise<{ status: number; headers: http.IncomingHttpHeaders; corpo: string }>((resolve, reject) => {
      const req = http.request(
        { host: "127.0.0.1", port, method: opcoes.metodo, path: opcoes.caminho, headers: opcoes.headers ?? {} },
        (res) => {
          const partes: Buffer[] = [];
          res.on("data", (parte) => partes.push(parte));
          res.on("end", () =>
            resolve({ status: res.statusCode ?? 0, headers: res.headers, corpo: Buffer.concat(partes).toString("utf8") }),
          );
        },
      );
      req.on("error", reject);
      req.end(opcoes.corpo);
    });
  } finally {
    await new Promise((resolve) => servidor.close(resolve));
  }
}
