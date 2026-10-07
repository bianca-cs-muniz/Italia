import { describe, expect, it } from "vitest";
import { calcularBarra, ESTIMATIVA_TRECHO, ORCAMENTO, somarFaixas, TETO_ESTIMATIVA_TRECHO, TETO_ORCAMENTO } from "@/dados/orcamento";

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

describe("estimativa do trecho Roma, Assis e Florença", () => {
  it("deve identificar o recorte só pelo título, Roma, Assis e Florença", () => {
    expect(ESTIMATIVA_TRECHO.titulo).toBe("Roma, Assis e Florença");
  });

  // O recorte foi calculado para o roteiro anterior: os dias mudaram e o campo saiu.
  it("não deve mais informar os dias do recorte", () => {
    expect(ESTIMATIVA_TRECHO).not.toHaveProperty("dias");
  });

  it("deve ter as 4 faixas combinadas, com seus valores", () => {
    expect(ESTIMATIVA_TRECHO.faixas).toEqual([
      { rotulo: "Hospedagem", minimo: 5500, maximo: 7500 },
      { rotulo: "Transporte", minimo: 1000, maximo: 1500 },
      { rotulo: "Alimentação", minimo: 3500, maximo: 4500 },
      { rotulo: "Atrações", minimo: 1500, maximo: 2200 },
    ]);
  });

  it("deve ter rótulos únicos e preenchidos", () => {
    const rotulos = ESTIMATIVA_TRECHO.faixas.map((faixa) => faixa.rotulo.trim());

    expect(rotulos.every(Boolean)).toBe(true);
    expect(new Set(rotulos).size).toBe(rotulos.length);
  });

  it.each(ESTIMATIVA_TRECHO.faixas)("deve ter mínimo positivo e não maior que o máximo em $rotulo", ({ minimo, maximo }) => {
    expect(minimo).toBeGreaterThan(0);
    expect(minimo).toBeLessThanOrEqual(maximo);
  });

  it.each(ESTIMATIVA_TRECHO.faixas)("deve caber no trilho do trecho sem estourar o teto em $rotulo", ({ minimo, maximo }) => {
    expect(maximo).toBeLessThanOrEqual(TETO_ESTIMATIVA_TRECHO);

    const barra = calcularBarra(minimo, maximo, TETO_ESTIMATIVA_TRECHO);

    expect(barra.largura).toBeGreaterThan(0);
    expect(barra.largura).toBeLessThanOrEqual(100);
    expect(barra.inicioFaixa).toBeGreaterThan(0);
    expect(barra.inicioFaixa).toBeLessThanOrEqual(100);
  });

  it("deve usar 8.000 como barra cheia do trecho", () => {
    expect(TETO_ESTIMATIVA_TRECHO).toBe(8000);
  });

  it("deve somar de 11.500 a 15.700 no total do trecho", () => {
    expect(somarFaixas(ESTIMATIVA_TRECHO.faixas)).toEqual({ minimo: 11500, maximo: 15700 });
  });
});

describe("somarFaixas", () => {
  it("deve devolver zeros quando a lista está vazia", () => {
    expect(somarFaixas([])).toEqual({ minimo: 0, maximo: 0 });
  });

  it("deve devolver a própria faixa quando a lista tem uma só", () => {
    expect(somarFaixas([{ rotulo: "Única", minimo: 300, maximo: 450 }])).toEqual({ minimo: 300, maximo: 450 });
  });

  it("deve somar mínimos e máximos separadamente", () => {
    const faixas = [
      { rotulo: "A", minimo: 100, maximo: 250 },
      { rotulo: "B", minimo: 40, maximo: 60 },
    ];

    expect(somarFaixas(faixas)).toEqual({ minimo: 140, maximo: 310 });
  });

  it("não deve alterar a lista recebida", () => {
    const faixas = [{ rotulo: "A", minimo: 100, maximo: 250 }];

    somarFaixas(faixas);

    expect(faixas).toEqual([{ rotulo: "A", minimo: 100, maximo: 250 }]);
  });
});
