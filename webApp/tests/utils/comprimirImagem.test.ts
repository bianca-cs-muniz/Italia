import { describe, expect, it } from "vitest";
import {
  dimensoesReduzidas,
  LADO_MAXIMO,
  MAXIMO_TENTATIVAS,
  proximaTentativa,
  QUALIDADE_JPEG,
  TAMANHO_MAXIMO_FOTO,
} from "@/utils/comprimirImagem";

describe("constantes da compressão", () => {
  it("deve limitar o maior lado a 1800 px", () => {
    expect(LADO_MAXIMO).toBe(1800);
  });

  it("deve começar com qualidade JPEG de 0,86", () => {
    expect(QUALIDADE_JPEG).toBe(0.86);
  });

  it("deve usar o limite de 2 MB por foto, o mesmo da API", () => {
    expect(TAMANHO_MAXIMO_FOTO).toBe(2 * 1024 * 1024);
  });

  it("deve permitir 6 tentativas", () => {
    expect(MAXIMO_TENTATIVAS).toBe(6);
  });
});

describe("dimensoesReduzidas", () => {
  it("deve reduzir pela largura quando a imagem é paisagem", () => {
    expect(dimensoesReduzidas(3600, 2400, 1800)).toEqual({ largura: 1800, altura: 1200 });
  });

  it("deve reduzir pela altura quando a imagem é retrato", () => {
    expect(dimensoesReduzidas(2400, 3600, 1800)).toEqual({ largura: 1200, altura: 1800 });
  });

  it("deve reduzir os dois lados por igual quando a imagem é quadrada", () => {
    expect(dimensoesReduzidas(4000, 4000, 1800)).toEqual({ largura: 1800, altura: 1800 });
  });

  it("não deve ampliar quando a imagem já é menor que o máximo", () => {
    expect(dimensoesReduzidas(800, 600, 1800)).toEqual({ largura: 800, altura: 600 });
  });

  it("não deve mexer quando o maior lado é exatamente o máximo", () => {
    expect(dimensoesReduzidas(1800, 900, 1800)).toEqual({ largura: 1800, altura: 900 });
  });

  it("deve arredondar para pixels inteiros", () => {
    expect(dimensoesReduzidas(4000, 3001, 1800)).toEqual({ largura: 1800, altura: 1350 });
  });

  it("deve devolver zero quando a imagem não tem tamanho", () => {
    expect(dimensoesReduzidas(0, 0, 1800)).toEqual({ largura: 0, altura: 0 });
  });
});

describe("proximaTentativa", () => {
  it("deve reduzir o lado em 15% e a qualidade em 0,08", () => {
    expect(proximaTentativa(1800, 0.86)).toEqual({ maximo: 1530, qualidade: 0.78 });
  });

  it("não deve baixar o lado além do piso de 600 px", () => {
    expect(proximaTentativa(650, 0.86).maximo).toBe(600);
  });

  it("não deve baixar a qualidade além do piso de 0,5", () => {
    expect(proximaTentativa(1800, 0.54).qualidade).toBe(0.5);
  });

  it("deve ficar parada quando já está nos dois pisos", () => {
    expect(proximaTentativa(600, 0.5)).toEqual({ maximo: 600, qualidade: 0.5 });
  });

  it("deve diminuir a cada passo, sem erro de ponto flutuante, ao longo das tentativas", () => {
    const ajustes = [{ maximo: LADO_MAXIMO, qualidade: QUALIDADE_JPEG }];
    for (let i = 1; i < MAXIMO_TENTATIVAS; i += 1) {
      const anterior = ajustes[ajustes.length - 1];
      ajustes.push(proximaTentativa(anterior.maximo, anterior.qualidade));
    }

    expect(ajustes).toEqual([
      { maximo: 1800, qualidade: 0.86 },
      { maximo: 1530, qualidade: 0.78 },
      { maximo: 1301, qualidade: 0.7 },
      { maximo: 1106, qualidade: 0.62 },
      { maximo: 940, qualidade: 0.54 },
      { maximo: 799, qualidade: 0.5 },
    ]);
  });
});
