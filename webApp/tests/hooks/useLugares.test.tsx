// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useLugares } from "@/hooks/useDadosViagem";
import LugaresService, { type ILugar, type ILugarInput } from "@/services/lugares/lugares.service";
import { adiada } from "../apoio/adiada";

// A fronteira simulada é o service (a rede); o hook roda de verdade.
vi.mock("@/services/lugares/lugares.service", () => ({
  default: { listar: vi.fn(), criar: vi.fn(), atualizar: vi.fn(), deletar: vi.fn() },
}));
vi.mock("@/services/checklist/checklist.service", () => ({
  default: { obter: vi.fn(), marcar: vi.fn() },
}));

const listar = vi.mocked(LugaresService.listar);
const criar = vi.mocked(LugaresService.criar);
const atualizar = vi.mocked(LugaresService.atualizar);
const deletar = vi.mocked(LugaresService.deletar);

const ENTRADA: ILugarInput = {
  trecho: "roma",
  tipo: "Atração",
  nome: "Coliseu",
  resumo: "",
  preco: "",
  link: "",
  descricao: "",
  destaques: [],
  fotos: [],
};

const lugar = (id: string, dados: Partial<ILugar> = {}): ILugar => ({
  ...ENTRADA,
  id,
  criadoEm: "2026-01-01T00:00:00.000Z",
  atualizadoEm: "2026-01-01T00:00:00.000Z",
  ...dados,
});

const ids = (lugares: ILugar[]) => lugares.map((l) => l.id);

// Monta o hook e espera a primeira carga terminar.
const montar = async (noServidor: ILugar[] = []) => {
  listar.mockResolvedValueOnce(noServidor);
  const hook = renderHook(() => useLugares());
  await waitFor(() => expect(hook.result.current.carregando).toBe(false));
  return hook;
};

const voltarParaAAba = async () => {
  await act(async () => {
    window.dispatchEvent(new Event("focus"));
  });
};

beforeEach(() => {
  [listar, criar, atualizar, deletar].forEach((simulado) => simulado.mockReset());
  listar.mockResolvedValue([]);
  deletar.mockResolvedValue(undefined);
});

afterEach(() => {
  cleanup();
});

describe("useLugares: carga", () => {
  it("deve começar carregando e sem lugares", () => {
    listar.mockReturnValueOnce(new Promise(() => {}));

    const { result } = renderHook(() => useLugares());

    expect(result.current).toMatchObject({ lugares: [], carregando: true, erro: null });
  });

  it("deve trazer os lugares do servidor", async () => {
    const { result } = await montar([lugar("a"), lugar("b")]);

    expect(ids(result.current.lugares)).toEqual(["a", "b"]);
    expect(result.current.erro).toBeNull();
  });

  it("deve informar o erro quando a primeira carga falha", async () => {
    listar.mockRejectedValueOnce(new Error("Resposta inesperada do servidor."));

    const { result } = renderHook(() => useLugares());

    await waitFor(() => expect(result.current.carregando).toBe(false));
    expect(result.current.erro).toBe("Não foi possível carregar os lugares.");
    expect(result.current.lugares).toEqual([]);
  });

  it("deve buscar de novo quando a pessoa volta para a aba", async () => {
    const { result } = await montar([lugar("a")]);
    listar.mockResolvedValueOnce([lugar("a"), lugar("b")]);

    await voltarParaAAba();

    await waitFor(() => expect(ids(result.current.lugares)).toEqual(["a", "b"]));
  });

  it("deve fazer uma busca só quando foco e visibilidade disparam juntos", async () => {
    await montar();
    listar.mockReturnValueOnce(new Promise(() => {}));
    Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true });

    await act(async () => {
      window.dispatchEvent(new Event("focus"));
      document.dispatchEvent(new Event("visibilitychange"));
    });

    expect(listar).toHaveBeenCalledTimes(2);
  });

  it("deve manter os lugares na tela, sem erro, quando a recarga em segundo plano falha", async () => {
    const { result } = await montar([lugar("a")]);
    listar.mockRejectedValueOnce(new Error("fora do ar"));

    await voltarParaAAba();

    expect(listar).toHaveBeenCalledTimes(2);
    expect(ids(result.current.lugares)).toEqual(["a"]);
    expect(result.current.erro).toBeNull();
  });

  it("deve limpar o erro da primeira carga quando uma recarga dá certo", async () => {
    listar.mockRejectedValueOnce(new Error("fora do ar"));
    const { result } = renderHook(() => useLugares());
    await waitFor(() => expect(result.current.erro).not.toBeNull());
    listar.mockResolvedValueOnce([lugar("a")]);

    await voltarParaAAba();

    await waitFor(() => expect(result.current.erro).toBeNull());
    expect(ids(result.current.lugares)).toEqual(["a"]);
  });

  it("não deve buscar mais depois de desmontado", async () => {
    const { unmount } = await montar();

    unmount();
    window.dispatchEvent(new Event("focus"));

    expect(listar).toHaveBeenCalledTimes(1);
  });
});

describe("useLugares: criar", () => {
  it("deve acrescentar o lugar criado ao fim da lista", async () => {
    const { result } = await montar([lugar("a")]);
    criar.mockResolvedValueOnce(lugar("novo"));

    await act(async () => {
      await result.current.criarLugar(ENTRADA);
    });

    expect(ids(result.current.lugares)).toEqual(["a", "novo"]);
  });

  it("deve enviar os dados ao service e devolver o lugar criado", async () => {
    const { result } = await montar();
    const criado = lugar("novo");
    criar.mockResolvedValueOnce(criado);

    let devolvido: ILugar | undefined;
    await act(async () => {
      devolvido = await result.current.criarLugar(ENTRADA);
    });

    expect(criar).toHaveBeenCalledWith(ENTRADA);
    expect(devolvido).toBe(criado);
  });

  it("não deve duplicar o lugar quando a recarga já o trouxe antes de a criação responder", async () => {
    const { result } = await montar([lugar("a")]);
    const resposta = adiada<ILugar>();
    criar.mockReturnValueOnce(resposta.promessa);
    let criacao!: Promise<ILugar>;
    act(() => {
      criacao = result.current.criarLugar(ENTRADA);
    });
    // O servidor já gravou; a pessoa volta para a aba e a recarga traz o lugar novo.
    listar.mockResolvedValueOnce([lugar("a"), lugar("novo")]);
    await voltarParaAAba();
    await waitFor(() => expect(result.current.lugares).toHaveLength(2));

    await act(async () => {
      resposta.resolver(lugar("novo"));
      await criacao;
    });

    expect(ids(result.current.lugares)).toEqual(["a", "novo"]);
  });

  it("deve ficar com a versão devolvida pela criação quando a recarga já trouxe o lugar", async () => {
    const { result } = await montar();
    const resposta = adiada<ILugar>();
    criar.mockReturnValueOnce(resposta.promessa);
    let criacao!: Promise<ILugar>;
    act(() => {
      criacao = result.current.criarLugar(ENTRADA);
    });
    listar.mockResolvedValueOnce([lugar("novo", { nome: "da recarga" })]);
    await voltarParaAAba();
    await waitFor(() => expect(result.current.lugares).toHaveLength(1));

    await act(async () => {
      resposta.resolver(lugar("novo", { nome: "da criação" }));
      await criacao;
    });

    expect(result.current.lugares.map((l) => l.nome)).toEqual(["da criação"]);
  });

  it("deve repassar o erro e não mexer na lista quando a criação falha", async () => {
    const { result } = await montar([lugar("a")]);
    const erroDaApi = new Error("Nome obrigatório.");
    criar.mockRejectedValueOnce(erroDaApi);

    let recebido: unknown;
    await act(async () => {
      recebido = await result.current.criarLugar(ENTRADA).catch((e: unknown) => e);
    });

    expect(recebido).toBe(erroDaApi);
    expect(ids(result.current.lugares)).toEqual(["a"]);
  });

  it("não deve deixar uma lista pedida antes da criação apagar o lugar novo", async () => {
    const { result } = await montar([lugar("a")]);
    const listaVelha = adiada<ILugar[]>();
    listar.mockReturnValueOnce(listaVelha.promessa).mockReturnValueOnce(new Promise(() => {}));
    await voltarParaAAba();
    criar.mockResolvedValueOnce(lugar("novo"));

    await act(async () => {
      await result.current.criarLugar(ENTRADA);
    });
    await act(async () => {
      // Foi lida no servidor antes da criação: ainda não tem o lugar novo.
      listaVelha.resolver([lugar("a")]);
    });

    expect(ids(result.current.lugares)).toEqual(["a", "novo"]);
  });

  it("deve buscar a lista de novo depois de descartar uma velha", async () => {
    const { result } = await montar([lugar("a")]);
    const listaVelha = adiada<ILugar[]>();
    listar.mockReturnValueOnce(listaVelha.promessa).mockResolvedValueOnce([lugar("a"), lugar("novo"), lugar("de-outra-pessoa")]);
    await voltarParaAAba();
    criar.mockResolvedValueOnce(lugar("novo"));

    await act(async () => {
      await result.current.criarLugar(ENTRADA);
    });
    await act(async () => {
      listaVelha.resolver([lugar("a")]);
    });

    await waitFor(() => expect(ids(result.current.lugares)).toEqual(["a", "novo", "de-outra-pessoa"]));
  });
});

describe("useLugares: atualizar", () => {
  it("deve trocar o lugar pelo atualizado, na mesma posição", async () => {
    const { result } = await montar([lugar("a"), lugar("b", { nome: "Antes" }), lugar("c")]);
    atualizar.mockResolvedValueOnce(lugar("b", { nome: "Depois" }));

    await act(async () => {
      await result.current.atualizarLugar("b", { ...ENTRADA, nome: "Depois" });
    });

    expect(result.current.lugares.map((l) => `${l.id}:${l.nome}`)).toEqual(["a:Coliseu", "b:Depois", "c:Coliseu"]);
  });

  it("deve enviar id e dados ao service e devolver o lugar atualizado", async () => {
    const { result } = await montar([lugar("b")]);
    const atualizado = lugar("b", { nome: "Depois" });
    atualizar.mockResolvedValueOnce(atualizado);
    const dados = { ...ENTRADA, nome: "Depois" };

    let devolvido: ILugar | undefined;
    await act(async () => {
      devolvido = await result.current.atualizarLugar("b", dados);
    });

    expect(atualizar).toHaveBeenCalledWith("b", dados);
    expect(devolvido).toBe(atualizado);
  });

  it("deve refletir a mudança de trecho do lugar", async () => {
    const { result } = await montar([lugar("b", { trecho: "roma" })]);
    atualizar.mockResolvedValueOnce(lugar("b", { trecho: "norte" }));

    await act(async () => {
      await result.current.atualizarLugar("b", { ...ENTRADA, trecho: "norte" });
    });

    expect(result.current.lugares.map((l) => l.trecho)).toEqual(["norte"]);
  });

  it("deve repassar o erro e manter o lugar como estava quando a atualização falha", async () => {
    const { result } = await montar([lugar("b", { nome: "Antes" })]);
    const erroDaApi = new Error("Lugar não encontrado.");
    atualizar.mockRejectedValueOnce(erroDaApi);

    let recebido: unknown;
    await act(async () => {
      recebido = await result.current.atualizarLugar("b", { ...ENTRADA, nome: "Depois" }).catch((e: unknown) => e);
    });

    expect(recebido).toBe(erroDaApi);
    expect(result.current.lugares.map((l) => l.nome)).toEqual(["Antes"]);
  });
});

describe("useLugares: deletar", () => {
  it("deve tirar o lugar da lista", async () => {
    const { result } = await montar([lugar("a"), lugar("b"), lugar("c")]);

    await act(async () => {
      await result.current.deletarLugar("b");
    });

    expect(deletar).toHaveBeenCalledWith("b");
    expect(ids(result.current.lugares)).toEqual(["a", "c"]);
  });

  it("deve deixar a lista vazia ao excluir o único lugar", async () => {
    const { result } = await montar([lugar("a")]);

    await act(async () => {
      await result.current.deletarLugar("a");
    });

    expect(result.current.lugares).toEqual([]);
  });

  it("deve repassar o erro e manter o lugar quando a exclusão falha", async () => {
    const { result } = await montar([lugar("a")]);
    const erroDaApi = new Error("fora do ar");
    deletar.mockRejectedValueOnce(erroDaApi);

    let recebido: unknown;
    await act(async () => {
      recebido = await result.current.deletarLugar("a").catch((e: unknown) => e);
    });

    expect(recebido).toBe(erroDaApi);
    expect(ids(result.current.lugares)).toEqual(["a"]);
  });

  it("não deve deixar uma lista pedida antes da exclusão trazer o lugar de volta", async () => {
    const { result } = await montar([lugar("a"), lugar("b")]);
    const listaVelha = adiada<ILugar[]>();
    listar.mockReturnValueOnce(listaVelha.promessa).mockReturnValueOnce(new Promise(() => {}));
    await voltarParaAAba();

    await act(async () => {
      await result.current.deletarLugar("b");
    });
    await act(async () => {
      listaVelha.resolver([lugar("a"), lugar("b")]);
    });

    expect(ids(result.current.lugares)).toEqual(["a"]);
  });
});
