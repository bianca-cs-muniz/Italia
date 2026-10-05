// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useChecklist } from "@/hooks/useDadosViagem";
import ChecklistService, { type IMarcacao } from "@/services/checklist/checklist.service";
import { adiada } from "../apoio/adiada";

// A fronteira simulada é o service (a rede); o hook roda de verdade.
vi.mock("@/services/checklist/checklist.service", () => ({
  default: { obter: vi.fn(), marcar: vi.fn() },
}));
vi.mock("@/services/lugares/lugares.service", () => ({
  default: { listar: vi.fn(), criar: vi.fn(), atualizar: vi.fn(), deletar: vi.fn() },
}));

const obter = vi.mocked(ChecklistService.obter);
const marcar = vi.mocked(ChecklistService.marcar);

// Monta o hook e espera a primeira carga terminar.
const montar = async (marcadosNoServidor: string[] = []) => {
  obter.mockResolvedValueOnce(marcadosNoServidor);
  const hook = renderHook(() => useChecklist());
  await waitFor(() => expect(hook.result.current.carregando).toBe(false));
  return hook;
};

const voltarParaAAba = async () => {
  await act(async () => {
    window.dispatchEvent(new Event("focus"));
  });
};

beforeEach(() => {
  obter.mockReset();
  marcar.mockReset();
  // Por padrão a API ecoa o que foi pedido e a lista vem vazia.
  obter.mockResolvedValue([]);
  marcar.mockImplementation(async (itemId, marcado) => ({ itemId, marcado }));
});

afterEach(() => {
  cleanup();
});

describe("useChecklist: carga", () => {
  it("deve começar carregando e sem itens", () => {
    obter.mockReturnValueOnce(new Promise(() => {}));

    const { result } = renderHook(() => useChecklist());

    expect(result.current).toMatchObject({ marcados: [], carregando: true, erro: null });
  });

  it("deve trazer os itens marcados no servidor", async () => {
    const { result } = await montar(["esim", "bagagem"]);

    expect(result.current.marcados).toEqual(["esim", "bagagem"]);
    expect(result.current.erro).toBeNull();
  });

  it("deve informar o erro quando a primeira carga falha", async () => {
    obter.mockRejectedValueOnce(new Error("fora do ar"));

    const { result } = renderHook(() => useChecklist());

    await waitFor(() => expect(result.current.carregando).toBe(false));
    expect(result.current.erro).toBe("Não foi possível carregar o checklist.");
    expect(result.current.marcados).toEqual([]);
  });

  it("deve buscar de novo quando a pessoa volta para a aba", async () => {
    const { result } = await montar(["esim"]);
    obter.mockResolvedValueOnce(["esim", "adaptador"]);

    await voltarParaAAba();

    await waitFor(() => expect(result.current.marcados).toEqual(["esim", "adaptador"]));
  });

  it("deve manter o que está na tela, sem erro, quando a recarga em segundo plano falha", async () => {
    const { result } = await montar(["esim"]);
    obter.mockRejectedValueOnce(new Error("fora do ar"));

    await voltarParaAAba();

    expect(obter).toHaveBeenCalledTimes(2);
    expect(result.current.marcados).toEqual(["esim"]);
    expect(result.current.erro).toBeNull();
  });
});

describe("useChecklist: marcação otimista", () => {
  it("deve marcar o item na hora, antes de a API responder", async () => {
    const { result } = await montar();
    marcar.mockReturnValueOnce(new Promise(() => {}));

    act(() => {
      void result.current.alternarItem("esim", true);
    });

    expect(result.current.marcados).toEqual(["esim"]);
  });

  it("deve desmarcar o item na hora, antes de a API responder", async () => {
    const { result } = await montar(["esim", "bagagem"]);
    marcar.mockReturnValueOnce(new Promise(() => {}));

    act(() => {
      void result.current.alternarItem("esim", false);
    });

    expect(result.current.marcados).toEqual(["bagagem"]);
  });

  it("deve pedir à API a marcação do item clicado", async () => {
    const { result } = await montar();

    await act(async () => {
      await result.current.alternarItem("passagens", true);
    });

    expect(marcar).toHaveBeenCalledTimes(1);
    expect(marcar).toHaveBeenCalledWith("passagens", true);
  });

  it("deve manter o item marcado depois que a API confirma", async () => {
    const { result } = await montar(["bagagem"]);

    await act(async () => {
      await result.current.alternarItem("esim", true);
    });

    expect([...result.current.marcados].sort()).toEqual(["bagagem", "esim"]);
  });

  it("não deve duplicar o item quando ele é marcado duas vezes", async () => {
    const { result } = await montar(["esim"]);

    await act(async () => {
      await result.current.alternarItem("esim", true);
    });

    expect(result.current.marcados).toEqual(["esim"]);
  });

  it("deve ficar com o valor que a API devolveu quando ele difere do pedido", async () => {
    const { result } = await montar();
    marcar.mockResolvedValueOnce({ itemId: "esim", marcado: false });

    await act(async () => {
      await result.current.alternarItem("esim", true);
    });

    expect(result.current.marcados).toEqual([]);
  });
});

describe("useChecklist: falha da API", () => {
  it("deve desfazer a marcação quando a API falha", async () => {
    const { result } = await montar(["bagagem"]);
    marcar.mockRejectedValueOnce(new Error("Item desconhecido."));
    // A conferência com o servidor depois da falha fica sem resposta aqui,
    // para o teste olhar só o rollback.
    obter.mockReturnValueOnce(new Promise(() => {}));

    await act(async () => {
      await result.current.alternarItem("esim", true).catch(() => {});
    });

    expect(result.current.marcados).toEqual(["bagagem"]);
  });

  it("deve voltar a marcar o item quando a API falha ao desmarcar", async () => {
    const { result } = await montar(["esim"]);
    marcar.mockRejectedValueOnce(new Error("fora do ar"));
    obter.mockReturnValueOnce(new Promise(() => {}));

    await act(async () => {
      await result.current.alternarItem("esim", false).catch(() => {});
    });

    expect(result.current.marcados).toEqual(["esim"]);
  });

  it("deve relançar o mesmo erro da API para quem chamou", async () => {
    const { result } = await montar();
    const erroDaApi = new Error("Item desconhecido.");
    marcar.mockRejectedValueOnce(erroDaApi);

    let recebido: unknown;
    await act(async () => {
      recebido = await result.current.alternarItem("esim", true).then(
        () => "não rejeitou",
        (e: unknown) => e,
      );
    });

    expect(recebido).toBe(erroDaApi);
  });

  it("deve conferir a lista com o servidor depois de uma falha", async () => {
    const { result } = await montar();
    marcar.mockRejectedValueOnce(new Error("tempo esgotado"));
    // A gravação chegou ao servidor apesar do erro.
    obter.mockResolvedValueOnce(["esim"]);

    await act(async () => {
      await result.current.alternarItem("esim", true).catch(() => {});
    });

    await waitFor(() => expect(result.current.marcados).toEqual(["esim"]));
    expect(obter).toHaveBeenCalledTimes(2);
  });

  it("não deve mexer nos outros itens quando a marcação de um falha", async () => {
    const { result } = await montar(["bagagem", "trens"]);
    marcar.mockRejectedValueOnce(new Error("fora do ar"));
    obter.mockReturnValueOnce(new Promise(() => {}));

    await act(async () => {
      await result.current.alternarItem("esim", true).catch(() => {});
    });

    expect(result.current.marcados).toEqual(["bagagem", "trens"]);
  });
});

describe("useChecklist: cliques rápidos no mesmo item", () => {
  // Dois cliques seguidos, com as duas respostas ainda pendentes.
  const clicarDuasVezes = async (inicial: string[], primeiro: boolean) => {
    const hook = await montar(inicial);
    const resposta1 = adiada<IMarcacao>();
    const resposta2 = adiada<IMarcacao>();
    marcar.mockReturnValueOnce(resposta1.promessa).mockReturnValueOnce(resposta2.promessa);

    let clique1!: Promise<void>;
    let clique2!: Promise<void>;
    act(() => {
      clique1 = hook.result.current.alternarItem("esim", primeiro);
    });
    act(() => {
      clique2 = hook.result.current.alternarItem("esim", !primeiro);
    });
    // Rejeições são conferidas por quem precisar; aqui só não podem ficar soltas.
    clique1.catch(() => {});
    clique2.catch(() => {});

    const assentar = async () => {
      await act(async () => {
        await Promise.allSettled([clique1, clique2]);
      });
    };
    return { hook, resposta1, resposta2, assentar };
  };

  it("deve mostrar o último clique enquanto as respostas não chegam", async () => {
    const { hook } = await clicarDuasVezes([], true);

    expect(hook.result.current.marcados).toEqual([]);
  });

  it("deve terminar desmarcado ao marcar e desmarcar com as respostas em ordem", async () => {
    const { hook, resposta1, resposta2, assentar } = await clicarDuasVezes([], true);

    await act(async () => {
      resposta1.resolver({ itemId: "esim", marcado: true });
    });
    await act(async () => {
      resposta2.resolver({ itemId: "esim", marcado: false });
    });
    await assentar();

    expect(hook.result.current.marcados).toEqual([]);
  });

  it("deve terminar desmarcado ao marcar e desmarcar com as respostas fora de ordem", async () => {
    const { hook, resposta1, resposta2, assentar } = await clicarDuasVezes([], true);

    await act(async () => {
      resposta2.resolver({ itemId: "esim", marcado: false });
    });
    await act(async () => {
      resposta1.resolver({ itemId: "esim", marcado: true });
    });
    await assentar();

    expect(hook.result.current.marcados).toEqual([]);
  });

  it("deve terminar marcado ao desmarcar e marcar com as respostas fora de ordem", async () => {
    const { hook, resposta1, resposta2, assentar } = await clicarDuasVezes(["esim"], false);

    await act(async () => {
      resposta2.resolver({ itemId: "esim", marcado: true });
    });
    await act(async () => {
      resposta1.resolver({ itemId: "esim", marcado: false });
    });
    await assentar();

    expect(hook.result.current.marcados).toEqual(["esim"]);
  });

  it("não deve desfazer o último clique quando é o clique antigo que falha", async () => {
    const { hook, resposta1, resposta2, assentar } = await clicarDuasVezes([], true);
    // A conferência com o servidor depois da falha fica sem resposta.
    obter.mockReturnValueOnce(new Promise(() => {}));

    await act(async () => {
      resposta2.resolver({ itemId: "esim", marcado: false });
    });
    await act(async () => {
      resposta1.rejeitar(new Error("fora do ar"));
    });
    await assentar();

    expect(hook.result.current.marcados).toEqual([]);
  });

  it("deve desfazer para o estado anterior ao último clique quando é ele que falha", async () => {
    const { hook, resposta1, resposta2, assentar } = await clicarDuasVezes([], true);
    obter.mockReturnValueOnce(new Promise(() => {}));

    await act(async () => {
      resposta1.resolver({ itemId: "esim", marcado: true });
    });
    await act(async () => {
      resposta2.rejeitar(new Error("fora do ar"));
    });
    await assentar();

    expect(hook.result.current.marcados).toEqual(["esim"]);
  });

  it("não deve misturar cliques de itens diferentes", async () => {
    const { result } = await montar();
    const respostaEsim = adiada<IMarcacao>();
    const respostaBagagem = adiada<IMarcacao>();
    marcar.mockReturnValueOnce(respostaEsim.promessa).mockReturnValueOnce(respostaBagagem.promessa);

    let cliques!: Promise<void>[];
    act(() => {
      cliques = [result.current.alternarItem("esim", true), result.current.alternarItem("bagagem", true)];
    });
    await act(async () => {
      respostaBagagem.resolver({ itemId: "bagagem", marcado: true });
      respostaEsim.resolver({ itemId: "esim", marcado: true });
      await Promise.all(cliques);
    });

    expect([...result.current.marcados].sort()).toEqual(["bagagem", "esim"]);
  });
});

describe("useChecklist: lista velha durante uma marcação", () => {
  it("não deve deixar uma lista pedida antes do clique apagar a marcação", async () => {
    const { result } = await montar();
    const listaVelha = adiada<string[]>();
    // A nova busca que o hook faz depois de descartar a lista velha fica sem
    // resposta, para o teste olhar só o descarte.
    obter.mockReturnValueOnce(listaVelha.promessa).mockReturnValueOnce(new Promise(() => {}));
    await voltarParaAAba();

    await act(async () => {
      await result.current.alternarItem("esim", true);
    });
    await act(async () => {
      // Foi lida no servidor antes da marcação: ainda não tem o item.
      listaVelha.resolver([]);
    });

    expect(result.current.marcados).toEqual(["esim"]);
  });

  it("deve buscar a lista de novo depois de descartar uma velha", async () => {
    const { result } = await montar();
    const listaVelha = adiada<string[]>();
    obter.mockReturnValueOnce(listaVelha.promessa).mockResolvedValueOnce(["esim", "trens"]);
    await voltarParaAAba();

    await act(async () => {
      await result.current.alternarItem("esim", true);
    });
    await act(async () => {
      listaVelha.resolver([]);
    });

    await waitFor(() => expect(result.current.marcados).toEqual(["esim", "trens"]));
  });

  it("não deve buscar a lista enquanto há uma marcação a caminho, e sim logo depois", async () => {
    const { result } = await montar();
    const resposta = adiada<IMarcacao>();
    marcar.mockReturnValueOnce(resposta.promessa);
    obter.mockResolvedValueOnce(["esim", "trens"]);

    let clique!: Promise<void>;
    act(() => {
      clique = result.current.alternarItem("esim", true);
    });
    await voltarParaAAba();
    const buscasDuranteAGravacao = obter.mock.calls.length;
    await act(async () => {
      resposta.resolver({ itemId: "esim", marcado: true });
      await clique;
    });

    expect(buscasDuranteAGravacao).toBe(1);
    await waitFor(() => expect(result.current.marcados).toEqual(["esim", "trens"]));
  });
});
