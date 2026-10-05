import DataSource from "@database/data-source";

class Repository {
  private readonly repository;

  constructor() {
    this.repository = DataSource.foto;
  }

  // A foto nasce órfã (sem lugarId): só é ligada a um lugar quando ele é salvo.
  public async criar(data: { tipoMime: string; tamanho: number; dados: Buffer }) {
    return await this.repository.create({ data, select: { id: true } });
  }

  // Único ponto que lê a coluna `dados`.
  public async buscarPorId(id: string) {
    return await this.repository.findUnique({ where: { id }, select: { tipoMime: true, dados: true } });
  }

  public async contarOrfas() {
    return await this.repository.count({ where: { lugarId: null } });
  }

  public async apagarOrfasAnterioresA(data: Date) {
    return await this.repository.deleteMany({ where: { lugarId: null, criadoEm: { lt: data } } });
  }
}

export default new Repository();
