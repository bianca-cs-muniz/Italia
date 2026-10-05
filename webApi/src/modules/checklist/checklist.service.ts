import Repository from "./checklist.repository";
import { MarcarDto } from "./dtos/marcar.dto";
import { ITENS_CHECKLIST } from "./checklist.constantes";
import AppException from "@erros/app-exception";
import ErrorMessages from "@erros/error-messages";

class Service {
  private readonly repository;

  constructor() {
    this.repository = Repository;
  }

  // No banco, linha presente = item marcado. Um id que tenha saído da lista
  // de itens não é devolvido, mesmo que ainda esteja gravado.
  public async listar() {
    const marcados = await this.repository.listar();
    const validos = ITENS_CHECKLIST as readonly string[];
    return { marcados: marcados.map((m) => m.itemId).filter((itemId) => validos.includes(itemId)) };
  }

  public async marcar(itemId: string, data: MarcarDto) {
    if (!(ITENS_CHECKLIST as readonly string[]).includes(itemId)) {
      throw new AppException(404, ErrorMessages.ITEM_CHECKLIST_INVALIDO);
    }

    if (data.marcado) await this.repository.marcar(itemId);
    else await this.repository.desmarcar(itemId);

    return { itemId, marcado: data.marcado };
  }
}

export default new Service();
