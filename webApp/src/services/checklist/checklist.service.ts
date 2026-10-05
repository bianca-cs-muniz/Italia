import HttpClient from "../HttpClient";

export interface IMarcacao {
  itemId: string;
  marcado: boolean;
}

class ChecklistService {
  private httpClient = new HttpClient();
  private path = "/checklist";

  // Ids dos itens marcados.
  async obter(): Promise<string[]> {
    const res = await this.httpClient.get<{ marcados: string[] }>(this.path);
    return res.marcados;
  }

  async marcar(itemId: string, marcado: boolean): Promise<IMarcacao> {
    return await this.httpClient.put<IMarcacao>(`${this.path}/${encodeURIComponent(itemId)}`, { marcado });
  }
}

const checklistService = new ChecklistService();
export default checklistService;
