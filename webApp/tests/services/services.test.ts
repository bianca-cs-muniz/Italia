import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import checklistService from "@/services/checklist/checklist.service";
import fotosService, { urlDaFoto } from "@/services/fotos/fotos.service";
import lugaresService, { type ILugar, type ILugarInput } from "@/services/lugares/lugares.service";

const fetchSimulado = vi.fn<typeof fetch>();

const respostaJson = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), { status, headers: { "Content-Type": "application/json" } });

const chamada = () => {
  expect(fetchSimulado).toHaveBeenCalledTimes(1);
  const [url, opcoes] = fetchSimulado.mock.calls[0];
  return { url, opcoes: opcoes ?? {}, cabecalhos: (opcoes?.headers ?? {}) as Record<string, string> };
};

const corpoEnviado = () => JSON.parse(String(chamada().opcoes.body)) as Record<string, unknown>;

const NOVE_CAMPOS = ["trecho", "tipo", "nome", "resumo", "preco", "link", "descricao", "destaques", "fotos"];

const ENTRADA_COMPLETA: ILugarInput = {
  trecho: "roma",
  tipo: "Hospedagem",
  nome: "Vatican Rooftop",
  resumo: "Terraço com vista",
  preco: "R$ 3.871",
  link: "https://exemplo.com",
  descricao: "Perto do metrô.",
  destaques: ["4 hóspedes"],
  fotos: ["f1", "f2"],
};

// Só o nome preenchido: o resto vai com "" e [].
const ENTRADA_MINIMA: ILugarInput = {
  trecho: "norte",
  tipo: "Atração",
  nome: "Duomo",
  resumo: "",
  preco: "",
  link: "",
  descricao: "",
  destaques: [],
  fotos: [],
};

const LUGAR: ILugar = { ...ENTRADA_COMPLETA, id: "l1", criadoEm: "2026-01-01T00:00:00.000Z", atualizadoEm: "2026-01-01T00:00:00.000Z" };

beforeEach(() => {
  fetchSimulado.mockReset();
  vi.stubGlobal("fetch", fetchSimulado);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("lugaresService.listar", () => {
  it("deve buscar em GET /api/lugares e devolver a lista", async () => {
    fetchSimulado.mockResolvedValue(respostaJson([LUGAR]));

    const lista = await lugaresService.listar();

    expect(chamada().url).toBe("/api/lugares");
    expect(lista).toEqual([LUGAR]);
  });

  it("deve devolver lista vazia quando não há lugares", async () => {
    fetchSimulado.mockResolvedValue(respostaJson([]));

    await expect(lugaresService.listar()).resolves.toEqual([]);
  });

  it.each([
    ["um objeto", { lugares: [] }],
    ["null", null],
    ["um texto", "ok"],
    ["um número", 0],
  ])("deve rejeitar quando o corpo de um 200 é %s", async (_nome, corpo) => {
    fetchSimulado.mockResolvedValue(respostaJson(corpo));

    await expect(lugaresService.listar()).rejects.toThrow("Resposta inesperada do servidor.");
  });

  it("deve rejeitar quando um 200 traz uma página HTML no lugar do JSON", async () => {
    fetchSimulado.mockResolvedValue(new Response("<html>proxy</html>", { status: 200 }));

    await expect(lugaresService.listar()).rejects.toThrow("Resposta inesperada do servidor.");
  });

  it("deve repassar a mensagem de erro da API", async () => {
    fetchSimulado.mockResolvedValue(respostaJson({ error: "Banco fora do ar." }, 500));

    await expect(lugaresService.listar()).rejects.toThrow("Banco fora do ar.");
  });
});

describe("lugaresService.criar", () => {
  it("deve enviar em POST /api/lugares e devolver o lugar criado", async () => {
    fetchSimulado.mockResolvedValue(respostaJson(LUGAR, 201));

    const criado = await lugaresService.criar(ENTRADA_COMPLETA);

    const { url, opcoes } = chamada();
    expect(url).toBe("/api/lugares");
    expect(opcoes.method).toBe("POST");
    expect(criado).toEqual(LUGAR);
  });

  it("deve mandar os 9 campos com os valores informados", async () => {
    fetchSimulado.mockResolvedValue(respostaJson(LUGAR, 201));

    await lugaresService.criar(ENTRADA_COMPLETA);

    expect(corpoEnviado()).toEqual(ENTRADA_COMPLETA);
  });

  it("deve mandar os 9 campos mesmo quando os opcionais estão vazios", async () => {
    fetchSimulado.mockResolvedValue(respostaJson(LUGAR, 201));

    await lugaresService.criar(ENTRADA_MINIMA);

    const corpo = corpoEnviado();
    expect(Object.keys(corpo).sort()).toEqual([...NOVE_CAMPOS].sort());
    expect(corpo).toEqual(ENTRADA_MINIMA);
  });

  it("deve rejeitar com a mensagem da API quando a validação falha", async () => {
    fetchSimulado.mockResolvedValue(respostaJson({ error: "Nome obrigatório." }, 400));

    await expect(lugaresService.criar(ENTRADA_MINIMA)).rejects.toThrow("Nome obrigatório.");
  });
});

describe("lugaresService.atualizar", () => {
  it("deve enviar em PUT /api/lugares/:id e devolver o lugar atualizado", async () => {
    fetchSimulado.mockResolvedValue(respostaJson(LUGAR));

    const atualizado = await lugaresService.atualizar("l1", ENTRADA_COMPLETA);

    const { url, opcoes } = chamada();
    expect(url).toBe("/api/lugares/l1");
    expect(opcoes.method).toBe("PUT");
    expect(atualizado).toEqual(LUGAR);
  });

  it("deve mandar os 9 campos mesmo quando os opcionais estão vazios", async () => {
    fetchSimulado.mockResolvedValue(respostaJson(LUGAR));

    await lugaresService.atualizar("l1", ENTRADA_MINIMA);

    const corpo = corpoEnviado();
    expect(Object.keys(corpo).sort()).toEqual([...NOVE_CAMPOS].sort());
    expect(corpo).toEqual(ENTRADA_MINIMA);
  });

  it("deve codificar o id na URL", async () => {
    fetchSimulado.mockResolvedValue(respostaJson(LUGAR));

    await lugaresService.atualizar("a/b ?c", ENTRADA_MINIMA);

    expect(chamada().url).toBe("/api/lugares/a%2Fb%20%3Fc");
  });
});

describe("lugaresService.deletar", () => {
  it("deve enviar DELETE /api/lugares/:id e resolver sem valor no 204", async () => {
    fetchSimulado.mockResolvedValue(new Response(null, { status: 204 }));

    await expect(lugaresService.deletar("l1")).resolves.toBeUndefined();

    const { url, opcoes } = chamada();
    expect(url).toBe("/api/lugares/l1");
    expect(opcoes.method).toBe("DELETE");
  });

  it("deve rejeitar com a mensagem da API quando o lugar não existe", async () => {
    fetchSimulado.mockResolvedValue(respostaJson({ error: "Lugar não encontrado." }, 404));

    await expect(lugaresService.deletar("sumiu")).rejects.toThrow("Lugar não encontrado.");
  });
});

describe("checklistService", () => {
  it("deve devolver os ids marcados vindos de GET /api/checklist", async () => {
    fetchSimulado.mockResolvedValue(respostaJson({ marcados: ["esim", "bagagem"] }));

    const marcados = await checklistService.obter();

    expect(chamada().url).toBe("/api/checklist");
    expect(marcados).toEqual(["esim", "bagagem"]);
  });

  it("deve marcar com PUT /api/checklist/:id e corpo { marcado: true }", async () => {
    fetchSimulado.mockResolvedValue(respostaJson({ itemId: "esim", marcado: true }));

    const salvo = await checklistService.marcar("esim", true);

    const { url, opcoes } = chamada();
    expect(url).toBe("/api/checklist/esim");
    expect(opcoes.method).toBe("PUT");
    expect(corpoEnviado()).toEqual({ marcado: true });
    expect(salvo).toEqual({ itemId: "esim", marcado: true });
  });

  it("deve desmarcar com corpo { marcado: false }", async () => {
    fetchSimulado.mockResolvedValue(respostaJson({ itemId: "esim", marcado: false }));

    await checklistService.marcar("esim", false);

    expect(corpoEnviado()).toEqual({ marcado: false });
  });

  it("deve rejeitar com a mensagem da API quando o item não existe", async () => {
    fetchSimulado.mockResolvedValue(respostaJson({ error: "Item desconhecido." }, 400));

    await expect(checklistService.marcar("nao-existe", true)).rejects.toThrow("Item desconhecido.");
  });
});

describe("fotosService", () => {
  it("deve enviar os bytes em POST /api/fotos e devolver o id da foto", async () => {
    const imagem = new Blob([new Uint8Array([1, 2, 3])], { type: "image/jpeg" });
    fetchSimulado.mockResolvedValue(respostaJson({ id: "foto-1" }, 201));

    const id = await fotosService.enviar(imagem);

    const { url, opcoes } = chamada();
    expect(url).toBe("/api/fotos");
    expect(opcoes.method).toBe("POST");
    expect(opcoes.body).toBe(imagem);
    expect(id).toBe("foto-1");
  });

  it.each(["image/jpeg", "image/png", "image/webp"])("deve usar %s como Content-Type quando esse é o tipo do blob", async (tipo) => {
    fetchSimulado.mockResolvedValue(respostaJson({ id: "foto-1" }, 201));

    await fotosService.enviar(new Blob(["x"], { type: tipo }));

    expect(chamada().cabecalhos["Content-Type"]).toBe(tipo);
  });

  it("deve usar image/jpeg quando o blob não tem tipo", async () => {
    fetchSimulado.mockResolvedValue(respostaJson({ id: "foto-1" }, 201));

    await fotosService.enviar(new Blob(["x"]));

    expect(chamada().cabecalhos["Content-Type"]).toBe("image/jpeg");
  });

  it("deve rejeitar com a mensagem da API quando a foto é recusada", async () => {
    fetchSimulado.mockResolvedValue(respostaJson({ error: "Formato não aceito." }, 415));

    await expect(fotosService.enviar(new Blob(["x"], { type: "image/gif" }))).rejects.toThrow("Formato não aceito.");
  });

  it("deve montar o endereço da foto passando pelo /api", () => {
    expect(urlDaFoto("foto-1")).toBe("/api/fotos/foto-1");
  });

  it("deve codificar o id no endereço da foto", () => {
    expect(urlDaFoto("a/b")).toBe("/api/fotos/a%2Fb");
  });
});
