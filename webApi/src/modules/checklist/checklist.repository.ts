import DataSource from "@database/data-source";

class Repository {
  private readonly repository;

  constructor() {
    this.repository = DataSource.checklistMarcado;
  }

  public async listar() {
    return await this.repository.findMany({ orderBy: { marcadoEm: "asc" }, select: { itemId: true } });
  }

  // createMany com skipDuplicates (ON CONFLICT DO NOTHING) e deleteMany não
  // falham se o item já estiver (ou já não estiver) marcado: repetir a mesma
  // requisição, mesmo duas ao mesmo tempo, dá sempre o mesmo resultado.
  public async marcar(itemId: string) {
    return await this.repository.createMany({ data: [{ itemId }], skipDuplicates: true });
  }

  public async desmarcar(itemId: string) {
    return await this.repository.deleteMany({ where: { itemId } });
  }
}

export default new Repository();
