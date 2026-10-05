import DataSource from "@database/data-source";
import { Prisma } from "@prisma/client";
import { SalvarDto } from "./dtos/salvar.dto";

type DadosLugar = Omit<SalvarDto, "fotos">;

// Das fotos só os ids saem junto com o lugar, já na ordem de exibição. A
// coluna `dados` (os bytes) nunca é selecionada aqui: quem precisa da imagem
// pede em GET /api/fotos/:id.
const incluirFotos = { fotos: { select: { id: true }, orderBy: { ordem: "asc" } } } as const;

class Repository {
  private readonly repository;

  constructor() {
    this.repository = DataSource.lugar;
  }

  public async listar() {
    return await this.repository.findMany({ orderBy: { criadoEm: "asc" }, include: incluirFotos });
  }

  // deleteMany não falha quando o lugar não existe (ou já foi apagado por
  // outra requisição): devolve quantas linhas saíram e o service decide.
  public async deletar(id: string) {
    const resultado = await this.repository.deleteMany({ where: { id } });
    return resultado.count;
  }

  // Salvar um lugar mexe em duas tabelas (o lugar e as fotos dele): o service
  // faz tudo dentro desta transação, e os métodos abaixo recebem o `tx` dela.
  // Ou tudo é gravado, ou nada é. `maxWait` é a espera por uma conexão livre
  // (o banco do Neon pode estar "acordando"); `timeout`, a duração máxima.
  public async emTransacao<T>(operacao: (tx: Prisma.TransactionClient) => Promise<T>) {
    return await DataSource.$transaction(operacao, { maxWait: 10000, timeout: 30000 });
  }

  public async contar(tx: Prisma.TransactionClient) {
    return await tx.lugar.count();
  }

  public async criar(data: DadosLugar, tx: Prisma.TransactionClient) {
    return await tx.lugar.create({ data });
  }

  public async atualizar(id: string, data: DadosLugar, tx: Prisma.TransactionClient) {
    return await tx.lugar.update({ where: { id }, data });
  }

  public async apagarFotosForaDaLista(lugarId: string, fotoIds: string[], tx: Prisma.TransactionClient) {
    return await tx.foto.deleteMany({ where: { lugarId, id: { notIn: fotoIds } } });
  }

  // Só liga a foto se ela estiver órfã ou já for deste lugar. Devolve quantas
  // linhas mudaram: 0 significa que a foto não existe ou é de outro lugar. A
  // condição vai no próprio UPDATE para duas requisições simultâneas não
  // conseguirem ficar com a mesma foto.
  public async vincularFoto(fotoId: string, lugarId: string, ordem: number, tx: Prisma.TransactionClient) {
    const resultado = await tx.foto.updateMany({
      where: { id: fotoId, OR: [{ lugarId: null }, { lugarId }] },
      data: { lugarId, ordem },
    });
    return resultado.count;
  }

  // As fotos do lugar como ficaram gravadas, na ordem de exibição.
  public async listarFotos(lugarId: string, tx: Prisma.TransactionClient) {
    return await tx.foto.findMany({ where: { lugarId }, select: { id: true }, orderBy: { ordem: "asc" } });
  }
}

export default new Repository();
