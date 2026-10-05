import { describe, expect, it } from "vitest";
import ImagemHelper, { TIPOS_DE_IMAGEM_ACEITOS } from "@helpers/imagem.helper";
import { GIF_MINIMO, SVG_MINIMO, jpegMinimo, pngMinimo, webpMinimo } from "../apoio/fabricas";

describe("ImagemHelper.tipoPelosBytes", () => {
  it("deve reconhecer JPEG pela assinatura FF D8 FF", () => {
    expect(ImagemHelper.tipoPelosBytes(jpegMinimo())).toBe("image/jpeg");
  });

  it("deve reconhecer JPEG quando o arquivo tem só os 3 bytes da assinatura", () => {
    expect(ImagemHelper.tipoPelosBytes(Buffer.from([0xff, 0xd8, 0xff]))).toBe("image/jpeg");
  });

  it("deve reconhecer PNG pela assinatura de 8 bytes", () => {
    expect(ImagemHelper.tipoPelosBytes(pngMinimo())).toBe("image/png");
  });

  it("deve reconhecer WebP por RIFF + tamanho + WEBP", () => {
    expect(ImagemHelper.tipoPelosBytes(webpMinimo())).toBe("image/webp");
  });

  it("deve devolver null para um arquivo vazio", () => {
    expect(ImagemHelper.tipoPelosBytes(Buffer.alloc(0))).toBeNull();
  });

  it("deve devolver null quando a assinatura de JPEG está incompleta", () => {
    expect(ImagemHelper.tipoPelosBytes(Buffer.from([0xff, 0xd8]))).toBeNull();
  });

  it("deve devolver null quando a assinatura de PNG está incompleta", () => {
    expect(ImagemHelper.tipoPelosBytes(pngMinimo().subarray(0, 7))).toBeNull();
  });

  it("deve devolver null quando o último byte da assinatura de PNG é outro", () => {
    const quasePng = pngMinimo();
    quasePng[7] = 0x00;

    expect(ImagemHelper.tipoPelosBytes(quasePng)).toBeNull();
  });

  it("deve devolver null para um RIFF que não é WebP (ex: WAV)", () => {
    const wav = Buffer.concat([Buffer.from("RIFF"), Buffer.alloc(4), Buffer.from("WAVEfmt ")]);

    expect(ImagemHelper.tipoPelosBytes(wav)).toBeNull();
  });

  it("deve devolver null para um WebP cortado antes do 12º byte", () => {
    expect(ImagemHelper.tipoPelosBytes(webpMinimo().subarray(0, 11))).toBeNull();
  });

  it("deve devolver null quando a assinatura não está no começo do arquivo", () => {
    const deslocado = Buffer.concat([Buffer.from([0x00]), jpegMinimo()]);

    expect(ImagemHelper.tipoPelosBytes(deslocado)).toBeNull();
  });

  it.each([
    ["GIF", GIF_MINIMO],
    ["SVG", SVG_MINIMO],
    ["PDF", Buffer.from("%PDF-1.7\n")],
    ["HTML", Buffer.from("<!doctype html><script>alert(1)</script>")],
    ["bytes zerados", Buffer.alloc(64)],
  ])("deve devolver null para %s", (_nome, bytes) => {
    expect(ImagemHelper.tipoPelosBytes(bytes)).toBeNull();
  });
});

describe("ImagemHelper.tipoDoCabecalho", () => {
  it.each(TIPOS_DE_IMAGEM_ACEITOS)("deve aceitar %s", (tipo) => {
    expect(ImagemHelper.tipoDoCabecalho(tipo)).toBe(tipo);
  });

  it("deve ignorar os parâmetros depois do ponto e vírgula", () => {
    expect(ImagemHelper.tipoDoCabecalho("image/png; charset=binary")).toBe("image/png");
  });

  it("deve ignorar maiúsculas e espaços em volta", () => {
    expect(ImagemHelper.tipoDoCabecalho("  IMAGE/JPEG ")).toBe("image/jpeg");
  });

  it.each([
    ["header ausente", undefined],
    ["texto vazio", ""],
    ["GIF", "image/gif"],
    ["SVG", "image/svg+xml"],
    ["image/jpg (apelido que não é um tipo registrado)", "image/jpg"],
    ["binário genérico", "application/octet-stream"],
    ["JSON", "application/json"],
    ["tipo aceito só depois do ponto e vírgula", "text/html; image/png"],
  ])("deve devolver null para %s", (_nome, header) => {
    expect(ImagemHelper.tipoDoCabecalho(header)).toBeNull();
  });
});
