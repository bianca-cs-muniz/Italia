// @vitest-environment jsdom
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { FormularioLugar } from "@/components/Lugares/FormularioLugar";
import type { ILugar, ILugarInput } from "@/services/lugares/lugares.service";
import { instalarDialogo, simularMatchMedia } from "../../apoio/dom";

// Só o caminho sem fotos: nada de canvas, compressão ou upload. O <dialog> usa
// o substituto de tests/apoio/dom.ts (o jsdom não tem showModal).
beforeAll(() => {
  instalarDialogo();
});

beforeEach(() => {
  // Movimento reduzido: a sobreposição fecha sem esperar a animação.
  simularMatchMedia(true);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const NOVE_CAMPOS = ["trecho", "tipo", "nome", "resumo", "preco", "link", "descricao", "destaques", "fotos"];

const LUGAR: ILugar = {
  id: "l1",
  trecho: "veneza",
  tipo: "Hospedagem",
  nome: "Casa no canal",
  resumo: "Perto do Rialto",
  preco: "R$ 2.000",
  link: "https://exemplo.com/casa",
  descricao: "Dois quartos.",
  destaques: ["Wi-Fi", "Terraço"],
  fotos: ["f1", "f2"],
  criadoEm: "2026-01-01T00:00:00.000Z",
  atualizadoEm: "2026-01-01T00:00:00.000Z",
};

const montar = (lugar?: ILugar) => {
  const aoSalvar = vi.fn<(dados: ILugarInput, id?: string) => Promise<void>>().mockResolvedValue(undefined);
  const mostrarToast = vi.fn<(mensagem: string) => void>();
  const tela = render(
    <FormularioLugar
      lugar={lugar}
      trechoInicial="roma"
      toast={null}
      mostrarToast={mostrarToast}
      aoSalvar={aoSalvar}
      aoExcluir={vi.fn().mockResolvedValue(undefined)}
      aoSalvo={vi.fn()}
      aoFechar={vi.fn()}
    />,
  );
  const formulario = tela.baseElement.querySelector("form");
  if (!formulario) throw new Error("O formulário não foi renderizado.");
  const preencher = (rotulo: RegExp, valor: string) => fireEvent.change(tela.getByLabelText(rotulo), { target: { value: valor } });
  const enviar = () => fireEvent.submit(formulario);
  return { ...tela, aoSalvar, mostrarToast, preencher, enviar };
};

describe("FormularioLugar: corpo enviado ao salvar", () => {
  it("deve mandar os 9 campos, com vazio nos opcionais, quando só o nome é preenchido", async () => {
    const { aoSalvar, preencher, enviar } = montar();
    preencher(/^Nome/, "Coliseu");

    enviar();

    await waitFor(() => expect(aoSalvar).toHaveBeenCalledTimes(1));
    const [dados, id] = aoSalvar.mock.calls[0];
    expect(Object.keys(dados).sort()).toEqual([...NOVE_CAMPOS].sort());
    expect(dados).toEqual({
      trecho: "roma",
      tipo: "Atração",
      nome: "Coliseu",
      resumo: "",
      preco: "",
      link: "",
      descricao: "",
      destaques: [],
      fotos: [],
    });
    expect(id).toBeUndefined();
  });

  it("deve limpar os espaços, normalizar o link e separar os destaques", async () => {
    const { aoSalvar, preencher, enviar } = montar();
    preencher(/^Nome/, "  Vatican Rooftop  ");
    preencher(/^Resumo/, "  Terraço com vista ");
    preencher(/^Preço/, " R$ 3.871 ");
    preencher(/^Link/, " exemplo.com/quarto ");
    preencher(/^Descrição/, "\nPerto do metrô.\n");
    preencher(/^Destaques/, " 4 hóspedes \n\nTerraço\n");

    enviar();

    await waitFor(() => expect(aoSalvar).toHaveBeenCalledTimes(1));
    expect(aoSalvar.mock.calls[0][0]).toEqual({
      trecho: "roma",
      tipo: "Atração",
      nome: "Vatican Rooftop",
      resumo: "Terraço com vista",
      preco: "R$ 3.871",
      link: "https://exemplo.com/quarto",
      descricao: "Perto do metrô.",
      destaques: ["4 hóspedes", "Terraço"],
      fotos: [],
    });
  });

  it("deve mandar os 9 campos do lugar e o id ao salvar uma edição sem mudanças", async () => {
    const { aoSalvar, enviar } = montar(LUGAR);

    enviar();

    await waitFor(() => expect(aoSalvar).toHaveBeenCalledTimes(1));
    const [dados, id] = aoSalvar.mock.calls[0];
    expect(dados).toEqual({
      trecho: "veneza",
      tipo: "Hospedagem",
      nome: "Casa no canal",
      resumo: "Perto do Rialto",
      preco: "R$ 2.000",
      link: "https://exemplo.com/casa",
      descricao: "Dois quartos.",
      destaques: ["Wi-Fi", "Terraço"],
      fotos: ["f1", "f2"],
    });
    expect(id).toBe("l1");
  });

  it("deve mandar o trecho e o tipo escolhidos", async () => {
    const { aoSalvar, preencher, enviar } = montar();
    preencher(/^Nome/, "Trattoria");
    preencher(/^Trecho da viagem/, "amalfi");
    preencher(/^Tipo/, "Restaurante");

    enviar();

    await waitFor(() => expect(aoSalvar).toHaveBeenCalledTimes(1));
    expect(aoSalvar.mock.calls[0][0]).toMatchObject({ trecho: "amalfi", tipo: "Restaurante" });
  });
});

describe("FormularioLugar: validação antes de salvar", () => {
  it("não deve salvar e deve avisar quando o nome está vazio", () => {
    const { aoSalvar, mostrarToast, enviar } = montar();

    enviar();

    expect(aoSalvar).not.toHaveBeenCalled();
    expect(mostrarToast).toHaveBeenCalledWith("Dê um nome ao lugar.");
  });

  it("não deve salvar quando o nome só tem espaços", () => {
    const { aoSalvar, preencher, enviar } = montar();
    preencher(/^Nome/, "   ");

    enviar();

    expect(aoSalvar).not.toHaveBeenCalled();
  });

  it("não deve salvar e deve avisar quando há mais de 20 destaques", () => {
    const { aoSalvar, mostrarToast, preencher, enviar } = montar();
    preencher(/^Nome/, "Coliseu");
    preencher(/^Destaques/, Array.from({ length: 21 }, (_, i) => `d${i}`).join("\n"));

    enviar();

    expect(aoSalvar).not.toHaveBeenCalled();
    expect(mostrarToast).toHaveBeenCalledWith("Use no máximo 20 destaques.");
  });

  it("deve mostrar a mensagem do erro quando o salvamento falha", async () => {
    const { aoSalvar, mostrarToast, preencher, enviar } = montar();
    aoSalvar.mockRejectedValueOnce(new Error("Trecho inválido."));
    preencher(/^Nome/, "Coliseu");

    enviar();

    await waitFor(() => expect(mostrarToast).toHaveBeenCalledWith("Trecho inválido."));
  });
});
