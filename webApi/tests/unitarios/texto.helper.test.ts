import { describe, expect, it } from "vitest";
import TextoHelper, { MENSAGEM_CARACTERE_INVALIDO } from "@helpers/texto.helper";

describe("TextoHelper.semByteNulo", () => {
  it("deve aceitar um texto comum, com acentos e emoji", () => {
    expect(TextoHelper.semByteNulo("Caffè Sant'Eustachio — ótimo ☕")).toBe(true);
  });

  it("deve aceitar o texto vazio", () => {
    expect(TextoHelper.semByteNulo("")).toBe(true);
  });

  it("deve aceitar outros caracteres de controle (quebra de linha, tab)", () => {
    expect(TextoHelper.semByteNulo("linha 1\nlinha 2\tfim")).toBe(true);
  });

  it.each([
    ["no começo", "\u0000abc"],
    ["no meio", "ab\u0000c"],
    ["no fim", "abc\u0000"],
    ["sozinho", "\u0000"],
  ])("deve recusar o byte NUL %s", (_onde, texto) => {
    expect(TextoHelper.semByteNulo(texto)).toBe(false);
  });

  it("deve expor uma mensagem de erro para o usuário", () => {
    expect(MENSAGEM_CARACTERE_INVALIDO).toBe("O texto contém um caractere inválido.");
  });
});
