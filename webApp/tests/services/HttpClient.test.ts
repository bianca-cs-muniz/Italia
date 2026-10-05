import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import HttpClient from "@/services/HttpClient";

const fetchSimulado = vi.fn<typeof fetch>();

const respostaJson = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), { status, headers: { "Content-Type": "application/json" } });

// Url e opções da única chamada feita ao fetch.
const chamada = () => {
  expect(fetchSimulado).toHaveBeenCalledTimes(1);
  const [url, opcoes] = fetchSimulado.mock.calls[0];
  return { url, opcoes: opcoes ?? {}, cabecalhos: (opcoes?.headers ?? {}) as Record<string, string> };
};

beforeEach(() => {
  fetchSimulado.mockReset();
  vi.stubGlobal("fetch", fetchSimulado);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("HttpClient: requisição", () => {
  it("deve chamar /api + caminho com GET e sem corpo", async () => {
    fetchSimulado.mockResolvedValue(respostaJson([]));

    await new HttpClient().get("/lugares");

    const { url, opcoes } = chamada();
    expect(url).toBe("/api/lugares");
    expect(opcoes.method).toBe("GET");
    expect(opcoes.body).toBeUndefined();
  });

  it("deve enviar o corpo do POST como JSON", async () => {
    fetchSimulado.mockResolvedValue(respostaJson({}));

    await new HttpClient().post("/lugares", { nome: "Coliseu", fotos: [] });

    const { opcoes, cabecalhos } = chamada();
    expect(opcoes.method).toBe("POST");
    expect(cabecalhos["Content-Type"]).toBe("application/json");
    expect(opcoes.body).toBe('{"nome":"Coliseu","fotos":[]}');
  });

  it("deve enviar o corpo do PUT como JSON", async () => {
    fetchSimulado.mockResolvedValue(respostaJson({}));

    await new HttpClient().put("/checklist/esim", { marcado: false });

    const { opcoes } = chamada();
    expect(opcoes.method).toBe("PUT");
    expect(opcoes.body).toBe('{"marcado":false}');
  });

  it("deve enviar um objeto vazio quando o POST não tem corpo", async () => {
    fetchSimulado.mockResolvedValue(respostaJson({}));

    await new HttpClient().post("/lugares");

    expect(chamada().opcoes.body).toBe("{}");
  });

  it("deve chamar com DELETE e sem corpo", async () => {
    fetchSimulado.mockResolvedValue(new Response(null, { status: 204 }));

    await new HttpClient().delete("/lugares/abc");

    const { url, opcoes } = chamada();
    expect(url).toBe("/api/lugares/abc");
    expect(opcoes.method).toBe("DELETE");
    expect(opcoes.body).toBeUndefined();
  });

  it("deve mandar um sinal de tempo limite em toda requisição", async () => {
    fetchSimulado.mockResolvedValue(respostaJson({}));

    await new HttpClient().get("/checklist");

    expect(chamada().opcoes.signal).toBeInstanceOf(AbortSignal);
  });
});

describe("HttpClient: resposta", () => {
  it("deve devolver o JSON da resposta quando dá certo", async () => {
    fetchSimulado.mockResolvedValue(respostaJson({ marcados: ["esim"] }));

    await expect(new HttpClient().get("/checklist")).resolves.toEqual({ marcados: ["esim"] });
  });

  it("deve devolver undefined, sem ler o corpo, quando a resposta é 204", async () => {
    const resposta = new Response(null, { status: 204 });
    const lerJson = vi.spyOn(resposta, "json");
    fetchSimulado.mockResolvedValue(resposta);

    await expect(new HttpClient().delete("/lugares/abc")).resolves.toBeUndefined();
    expect(lerJson).not.toHaveBeenCalled();
  });

  it("deve virar Error com a mensagem da API quando a resposta de erro traz { error }", async () => {
    fetchSimulado.mockResolvedValue(respostaJson({ error: "Trecho inválido." }, 400));

    const erro = await new HttpClient().post("/lugares", {}).catch((e: unknown) => e);

    expect(erro).toBeInstanceOf(Error);
    expect((erro as Error).message).toBe("Trecho inválido.");
  });

  it.each([404, 413, 500])("deve usar a mensagem da API quando o status é %d", async (status) => {
    fetchSimulado.mockResolvedValue(respostaJson({ error: "Mensagem da API." }, status));

    await expect(new HttpClient().get("/lugares")).rejects.toThrow("Mensagem da API.");
  });

  it("deve usar a mensagem genérica quando o erro não traz o campo error", async () => {
    fetchSimulado.mockResolvedValue(respostaJson({ detalhe: "x" }, 500));

    await expect(new HttpClient().get("/lugares")).rejects.toThrow("Algo deu errado. Tente novamente.");
  });

  it("deve usar a mensagem genérica quando o corpo do erro não é JSON", async () => {
    fetchSimulado.mockResolvedValue(new Response("<html>502 Bad Gateway</html>", { status: 502 }));

    await expect(new HttpClient().get("/lugares")).rejects.toThrow("Algo deu errado. Tente novamente.");
  });

  it("deve usar a mensagem genérica quando o erro vem sem corpo", async () => {
    fetchSimulado.mockResolvedValue(new Response(null, { status: 500 }));

    await expect(new HttpClient().get("/lugares")).rejects.toThrow("Algo deu errado. Tente novamente.");
  });
});

describe("HttpClient: falha de rede", () => {
  it("deve trocar o erro técnico do fetch por uma mensagem para a pessoa", async () => {
    fetchSimulado.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(new HttpClient().get("/lugares")).rejects.toThrow("Não foi possível falar com o servidor. Tente novamente.");
  });

  it("deve avisar da demora quando o tempo limite estoura", async () => {
    fetchSimulado.mockRejectedValue(new DOMException("The operation timed out.", "TimeoutError"));

    await expect(new HttpClient().get("/lugares")).rejects.toThrow("O servidor demorou demais para responder. Tente novamente.");
  });

  it("deve avisar da demora quando a requisição é abortada", async () => {
    fetchSimulado.mockRejectedValue(new DOMException("Aborted", "AbortError"));

    await expect(new HttpClient().get("/lugares")).rejects.toThrow("O servidor demorou demais para responder. Tente novamente.");
  });
});

describe("HttpClient: upload binário", () => {
  it("deve enviar o próprio blob como corpo, sem transformar em JSON", async () => {
    const blob = new Blob([new Uint8Array([1, 2, 3])], { type: "image/png" });
    fetchSimulado.mockResolvedValue(respostaJson({ id: "f1" }, 201));

    await new HttpClient().postBinario("/fotos", blob, "image/png");

    const { url, opcoes } = chamada();
    expect(url).toBe("/api/fotos");
    expect(opcoes.method).toBe("POST");
    expect(opcoes.body).toBe(blob);
  });

  it("deve usar como Content-Type o tipo informado, e não JSON", async () => {
    fetchSimulado.mockResolvedValue(respostaJson({ id: "f1" }, 201));

    await new HttpClient().postBinario("/fotos", new Blob(["x"]), "image/webp");

    expect(chamada().cabecalhos["Content-Type"]).toBe("image/webp");
  });

  it("deve virar Error com a mensagem da API quando o upload é recusado", async () => {
    fetchSimulado.mockResolvedValue(respostaJson({ error: "Imagem grande demais." }, 413));

    await expect(new HttpClient().postBinario("/fotos", new Blob(["x"]), "image/jpeg")).rejects.toThrow("Imagem grande demais.");
  });
});
