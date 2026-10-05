// Tempo máximo de espera por uma resposta, em ms. O upload de foto é mais lento.
const TEMPO_LIMITE = 30_000;
const TEMPO_LIMITE_UPLOAD = 60_000;

class HttpClient {
  private baseUrl = "/api";

  private async tratarResposta<T>(response: Response): Promise<T> {
    if (response.status === 204) return undefined as T;
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(data?.error || "Algo deu errado. Tente novamente.");
    }
    return data as T;
  }

  private async requisitar<T>(path: string, init: RequestInit, tempoLimite = TEMPO_LIMITE): Promise<T> {
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, { ...init, signal: AbortSignal.timeout(tempoLimite) });
    } catch (err) {
      // O fetch rejeita com mensagens técnicas em inglês; aqui elas viram texto para a pessoa.
      if (err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError")) {
        throw new Error("O servidor demorou demais para responder. Tente novamente.");
      }
      throw new Error("Não foi possível falar com o servidor. Tente novamente.");
    }
    return this.tratarResposta<T>(response);
  }

  private enviar<T>(metodo: string, path: string, body?: unknown): Promise<T> {
    return this.requisitar<T>(path, {
      method: metodo,
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  get<T>(path: string): Promise<T> {
    return this.enviar<T>("GET", path);
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    return this.enviar<T>("POST", path, body ?? {});
  }

  put<T>(path: string, body?: unknown): Promise<T> {
    return this.enviar<T>("PUT", path, body ?? {});
  }

  delete<T>(path: string): Promise<T> {
    return this.enviar<T>("DELETE", path);
  }

  // Corpo binário cru (upload de foto): o Content-Type é o tipo do arquivo, não JSON.
  postBinario<T>(path: string, corpo: Blob, tipo: string): Promise<T> {
    return this.requisitar<T>(
      path,
      {
        method: "POST",
        headers: { "Content-Type": tipo },
        body: corpo,
      },
      TEMPO_LIMITE_UPLOAD,
    );
  }
}

export default HttpClient;
