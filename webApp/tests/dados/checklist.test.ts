import { describe, expect, it } from "vitest";
import { calcularProgresso, ITENS_CHECKLIST } from "@/dados/checklist";

const ITENS = [
  { id: "a", texto: "A" },
  { id: "b", texto: "B" },
  { id: "c", texto: "C" },
  { id: "d", texto: "D" },
];

describe("calcularProgresso", () => {
  it("deve contar zero quando nada está marcado", () => {
    expect(calcularProgresso([], ITENS)).toEqual({ feitos: 0, total: 4, percentual: 0 });
  });

  it("deve contar os itens marcados e o percentual correspondente", () => {
    expect(calcularProgresso(["a", "c"], ITENS)).toEqual({ feitos: 2, total: 4, percentual: 50 });
  });

  it("deve chegar a 100% quando todos estão marcados", () => {
    expect(calcularProgresso(["a", "b", "c", "d"], ITENS)).toEqual({ feitos: 4, total: 4, percentual: 100 });
  });

  it("deve ignorar ids que não existem na lista", () => {
    expect(calcularProgresso(["a", "item-antigo"], ITENS).feitos).toBe(1);
  });

  it("deve contar uma vez só um id repetido", () => {
    expect(calcularProgresso(["a", "a", "a"], ITENS).feitos).toBe(1);
  });

  it("não deve passar de 100% quando chegam ids repetidos e desconhecidos além de todos os válidos", () => {
    expect(calcularProgresso(["a", "b", "c", "d", "a", "x"], ITENS).percentual).toBe(100);
  });

  it("deve devolver percentual 0, e não NaN, quando a lista de itens é vazia", () => {
    expect(calcularProgresso(["a"], [])).toEqual({ feitos: 0, total: 0, percentual: 0 });
  });

  it("deve usar os 15 itens da viagem quando a lista não é informada", () => {
    expect(calcularProgresso([]).total).toBe(15);
  });

  it("deve contar sobre os itens da viagem quando a lista não é informada", () => {
    const { feitos, percentual } = calcularProgresso([ITENS_CHECKLIST[0].id, ITENS_CHECKLIST[1].id, ITENS_CHECKLIST[2].id]);

    expect(feitos).toBe(3);
    expect(percentual).toBe(20);
  });
});
