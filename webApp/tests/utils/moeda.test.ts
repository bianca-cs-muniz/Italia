import { describe, expect, it } from "vitest";
import { formatarFaixaReais, formatarMilhar, formatarReais } from "@/utils/moeda";

describe("formatarMilhar", () => {
  it.each([
    [0, "0"],
    [7, "7"],
    [999, "999"],
    [1000, "1.000"],
    [12000, "12.000"],
    [123456, "123.456"],
    [1234567, "1.234.567"],
  ])("deve formatar %d como %s", (valor, esperado) => {
    expect(formatarMilhar(valor)).toBe(esperado);
  });

  it("deve arredondar para o inteiro mais próximo quando há centavos", () => {
    expect(formatarMilhar(1999.5)).toBe("2.000");
  });

  it("deve manter o sinal quando o valor é negativo", () => {
    expect(formatarMilhar(-1234)).toBe("-1.234");
  });
});

describe("formatarReais", () => {
  it('deve formatar 12000 como "R$ 12.000"', () => {
    expect(formatarReais(12000)).toBe("R$ 12.000");
  });

  it("deve formatar valores abaixo de mil sem ponto", () => {
    expect(formatarReais(950)).toBe("R$ 950");
  });

  it("deve formatar zero", () => {
    expect(formatarReais(0)).toBe("R$ 0");
  });
});

describe("formatarFaixaReais", () => {
  it("deve juntar mínimo e máximo com travessão e um único R$", () => {
    expect(formatarFaixaReais(12000, 18000)).toBe("R$ 12.000–18.000");
  });

  it("deve formatar os dois lados com milhar", () => {
    expect(formatarFaixaReais(1000, 1500)).toBe("R$ 1.000–1.500");
  });
});
