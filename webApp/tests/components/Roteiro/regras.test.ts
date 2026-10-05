import { describe, expect, it } from "vitest";
import { textoNoites } from "@/components/Roteiro/regras";
import { TRECHOS_COM_BASE } from "@/dados/trechos";

describe("textoNoites", () => {
  it("deve usar o singular para 1 noite", () => {
    expect(textoNoites(1)).toBe("1 noite");
  });

  it.each([
    [0, "0 noites"],
    [2, "2 noites"],
    [5, "5 noites"],
  ])("deve usar o plural para %i", (noites, esperado) => {
    expect(textoNoites(noites)).toBe(esperado);
  });

  it("deve escrever a única noite de Amalfi no singular", () => {
    const amalfi = TRECHOS_COM_BASE.find((trecho) => trecho.id === "amalfi");

    expect(textoNoites(Number(amalfi?.noites))).toBe("1 noite");
  });
});
