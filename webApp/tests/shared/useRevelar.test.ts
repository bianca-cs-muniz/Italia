import { describe, expect, it } from "vitest";
import { classeRevelar, deveRevelar } from "@/shared/components/useRevelar";

const TELA = 800;

describe("deveRevelar", () => {
  it("deve revelar quando 12% do elemento está visível", () => {
    expect(deveRevelar(0.12, 400, TELA)).toBe(true);
  });

  it("deve revelar quando o elemento está inteiro na tela", () => {
    expect(deveRevelar(1, 400, TELA)).toBe(true);
  });

  it("não deve revelar um elemento comum com menos de 12% visível", () => {
    expect(deveRevelar(0.11, 400, TELA)).toBe(false);
  });

  it("não deve revelar um elemento comum com 2% visível", () => {
    expect(deveRevelar(0.02, 400, TELA)).toBe(false);
  });

  it("não deve revelar quando nada está visível", () => {
    expect(deveRevelar(0, 400, TELA)).toBe(false);
  });

  it("deve revelar com 2% visível um bloco muito mais alto que a tela", () => {
    expect(deveRevelar(0.02, 10_000, TELA)).toBe(true);
  });

  it("deve revelar um bloco muito alto com a maior fração que ele consegue mostrar", () => {
    // 10.000 px numa tela de 800 px: no máximo 8% do bloco aparece.
    expect(deveRevelar(TELA / 10_000, 10_000, TELA)).toBe(true);
  });

  it("não deve revelar um bloco muito alto com menos de 2% visível", () => {
    expect(deveRevelar(0.019, 10_000, TELA)).toBe(false);
  });

  it("não deve revelar um bloco muito alto que ainda não apareceu", () => {
    expect(deveRevelar(0, 10_000, TELA)).toBe(false);
  });

  it("não deve afrouxar a regra para um bloco alto cujos 12% ainda cabem na tela", () => {
    // 5.000 px: 12% são 600 px, que cabem em 800 px.
    expect(deveRevelar(0.05, 5_000, TELA)).toBe(false);
  });

  it("não deve afrouxar a regra quando os 12% do bloco têm exatamente a altura da tela", () => {
    expect(deveRevelar(0.05, 10_000, 1_200)).toBe(false);
  });

  it("deve afrouxar a regra assim que os 12% do bloco passam da altura da tela", () => {
    expect(deveRevelar(0.05, 10_000, 1_199)).toBe(true);
  });
});

describe("classeRevelar", () => {
  it('deve devolver só "reveal" enquanto o elemento não entrou em cena', () => {
    expect(classeRevelar(false)).toBe("reveal");
  });

  it('deve acrescentar "in" quando o elemento entrou em cena', () => {
    expect(classeRevelar(true)).toBe("reveal in");
  });

  it("deve manter as outras classes na frente", () => {
    expect(classeRevelar(true, "sec-head")).toBe("sec-head reveal in");
  });
});
