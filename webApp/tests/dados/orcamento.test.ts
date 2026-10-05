import { describe, expect, it } from "vitest";
import { calcularBarra, ORCAMENTO, TETO_ORCAMENTO } from "@/dados/orcamento";

describe("calcularBarra", () => {
  it("deve calcular a largura como percentual do teto", () => {
    expect(calcularBarra(12000, 18000, 20000).largura).toBe(90);
  });

  it("deve calcular o início da faixa como percentual da própria barra", () => {
    expect(calcularBarra(5000, 10000, 20000).inicioFaixa).toBe(50);
  });

  it("deve usar o teto padrão quando ele não é informado", () => {
    expect(calcularBarra(0, TETO_ORCAMENTO)).toEqual({ largura: 100, inicioFaixa: 0 });
  });

  it("deve limitar a largura a 100 quando o máximo passa do teto", () => {
    expect(calcularBarra(10000, 30000, 20000).largura).toBe(100);
  });

  it("deve começar a faixa em 0 quando o mínimo é zero", () => {
    expect(calcularBarra(0, 10000, 20000).inicioFaixa).toBe(0);
  });

  it("deve começar a faixa em 100 quando mínimo e máximo são iguais", () => {
    expect(calcularBarra(8000, 8000, 20000).inicioFaixa).toBe(100);
  });

  it("deve limitar o início da faixa a 100 quando o mínimo passa do máximo", () => {
    expect(calcularBarra(15000, 10000, 20000).inicioFaixa).toBe(100);
  });

  it("deve limitar o início da faixa a 0 quando o mínimo é negativo", () => {
    expect(calcularBarra(-500, 10000, 20000).inicioFaixa).toBe(0);
  });

  it("deve zerar a barra quando o máximo é zero", () => {
    expect(calcularBarra(0, 0, 20000)).toEqual({ largura: 0, inicioFaixa: 0 });
  });

  it("deve zerar a barra quando o máximo é negativo", () => {
    expect(calcularBarra(-10, -5, 20000)).toEqual({ largura: 0, inicioFaixa: 0 });
  });

  it("deve zerar a barra quando o teto é zero", () => {
    expect(calcularBarra(1000, 2000, 0)).toEqual({ largura: 0, inicioFaixa: 0 });
  });

  it("deve zerar a barra quando o teto é negativo", () => {
    expect(calcularBarra(1000, 2000, -1)).toEqual({ largura: 0, inicioFaixa: 0 });
  });
});

describe("faixas do orçamento", () => {
  it("deve ter 7 faixas", () => {
    expect(ORCAMENTO).toHaveLength(7);
  });

  it("deve ter rótulos únicos e preenchidos", () => {
    const rotulos = ORCAMENTO.map((faixa) => faixa.rotulo.trim());

    expect(rotulos.every(Boolean)).toBe(true);
    expect(new Set(rotulos).size).toBe(rotulos.length);
  });

  it.each(ORCAMENTO)("deve ter mínimo positivo e não maior que o máximo em $rotulo", ({ minimo, maximo }) => {
    expect(minimo).toBeGreaterThan(0);
    expect(minimo).toBeLessThanOrEqual(maximo);
  });

  it.each(ORCAMENTO)("deve caber no trilho sem estourar o teto em $rotulo", ({ minimo, maximo }) => {
    expect(maximo).toBeLessThanOrEqual(TETO_ORCAMENTO);

    const barra = calcularBarra(minimo, maximo);

    expect(barra.largura).toBeGreaterThan(0);
    expect(barra.largura).toBeLessThanOrEqual(100);
    expect(barra.inicioFaixa).toBeGreaterThan(0);
    expect(barra.inicioFaixa).toBeLessThanOrEqual(100);
  });
});
