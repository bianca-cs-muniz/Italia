import HttpClient from "../HttpClient";
import type { TrechoId } from "@/dados/trechos";

export const TIPOS_LUGAR = ["Hospedagem", "Atração", "Restaurante", "Experiência", "Outro"] as const;
export type TipoLugar = (typeof TIPOS_LUGAR)[number];

export interface ILugar {
  id: string;
  // É o que a API devolve: pode ser um trecho que já saiu do roteiro.
  trecho: string;
  tipo: TipoLugar;
  nome: string;
  resumo: string;
  preco: string;
  link: string;
  descricao: string;
  destaques: string[];
  // Ids das fotos, na ordem de exibição (a primeira é a capa).
  fotos: string[];
  criadoEm: string;
  atualizadoEm: string;
}

// A API não preenche valores padrão: todos os campos vão sempre, com "" ou []
// quando não há valor.
export interface ILugarInput {
  trecho: TrechoId;
  tipo: TipoLugar;
  nome: string;
  resumo: string;
  preco: string;
  link: string;
  descricao: string;
  destaques: string[];
  fotos: string[];
}

class LugaresService {
  private httpClient = new HttpClient();
  private path = "/lugares";

  async listar(): Promise<ILugar[]> {
    const lista = await this.httpClient.get<unknown>(this.path);
    // Um 200 com outra coisa no corpo (uma página de erro de um proxy, por
    // exemplo) quebraria a tela inteira ao percorrer a lista.
    if (!Array.isArray(lista)) throw new Error("Resposta inesperada do servidor.");
    return lista as ILugar[];
  }

  async criar(data: ILugarInput): Promise<ILugar> {
    return await this.httpClient.post<ILugar>(this.path, data);
  }

  async atualizar(id: string, data: ILugarInput): Promise<ILugar> {
    return await this.httpClient.put<ILugar>(`${this.path}/${encodeURIComponent(id)}`, data);
  }

  async deletar(id: string): Promise<void> {
    await this.httpClient.delete(`${this.path}/${encodeURIComponent(id)}`);
  }
}

const lugaresService = new LugaresService();
export default lugaresService;
