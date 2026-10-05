import { Prisma } from "@prisma/client";
import Repository from "./lugares.repository";
import { SalvarDto } from "./dtos/salvar.dto";
import appConfig from "@config/app.config";
import AppException from "@erros/app-exception";
import ErrorMessages from "@erros/error-messages";

type LugarComFotos = {
  id: string;
  trecho: string;
  tipo: string;
  nome: string;
  resumo: string;
  preco: string;
  link: string;
  descricao: string;
  destaques: string[];
  criadoEm: Date;
  atualizadoEm: Date;
  fotos: { id: string }[];
};

// Na resposta, `fotos` é só a lista de ids, na ordem de exibição. O front
// monta a URL de cada imagem (GET /api/fotos/:id).
function paraResposta(lugar: LugarComFotos) {
  return {
    id: lugar.id,
    trecho: lugar.trecho,
    tipo: lugar.tipo,
    nome: lugar.nome,
    resumo: lugar.resumo,
    preco: lugar.preco,
    link: lugar.link,
    descricao: lugar.descricao,
    destaques: lugar.destaques,
    fotos: lugar.fotos.map((foto) => foto.id),
    criadoEm: lugar.criadoEm,
    atualizadoEm: lugar.atualizadoEm,
  };
}

function ehRegistroNaoEncontrado(err: unknown) {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025";
}

class Service {
  private readonly repository;

  constructor() {
    this.repository = Repository;
  }

  public async listar() {
    const lugares = await this.repository.listar();
    return lugares.map(paraResposta);
  }

  public async criar(data: SalvarDto) {
    const { fotos, ...campos } = data;

    return await this.repository.emTransacao(async (tx) => {
      const total = await this.repository.contar(tx);
      if (total >= appConfig.limites.maximoLugares) throw new AppException(409, ErrorMessages.LIMITE_LUGARES);

      const lugar = await this.repository.criar(campos, tx);
      await this.sincronizarFotos(lugar.id, fotos, tx);
      // As fotos da resposta são relidas do banco: é o que ficou gravado, não
      // um eco do que foi enviado.
      return paraResposta({ ...lugar, fotos: await this.repository.listarFotos(lugar.id, tx) });
    });
  }

  // O próprio UPDATE diz se o lugar existe: se não existir (ou tiver sido
  // apagado por outra requisição no meio do caminho), o Prisma lança P2025 e
  // a resposta é 404, sem uma consulta prévia que poderia ficar desatualizada.
  public async atualizar(id: string, data: SalvarDto) {
    const { fotos, ...campos } = data;

    try {
      return await this.repository.emTransacao(async (tx) => {
        const lugar = await this.repository.atualizar(id, campos, tx);
        await this.sincronizarFotos(id, fotos, tx);
        return paraResposta({ ...lugar, fotos: await this.repository.listarFotos(id, tx) });
      });
    } catch (err) {
      if (ehRegistroNaoEncontrado(err)) throw new AppException(404, ErrorMessages.LUGAR_NAO_ENCONTRADO);
      throw err;
    }
  }

  // As fotos do lugar são apagadas junto (ON DELETE CASCADE).
  public async deletar(id: string) {
    const apagados = await this.repository.deletar(id);
    if (apagados === 0) throw new AppException(404, ErrorMessages.LUGAR_NAO_ENCONTRADO);
  }

  // Deixa as fotos do lugar iguais à lista enviada: as que saíram da lista são
  // apagadas, as demais são ligadas ao lugar com a posição em que vieram. Toda
  // foto citada precisa existir e estar órfã ou já ser deste lugar; se alguma
  // não estiver, o erro desfaz a transação inteira (o lugar também não é salvo).
  private async sincronizarFotos(lugarId: string, fotoIds: string[], tx: Prisma.TransactionClient) {
    await this.repository.apagarFotosForaDaLista(lugarId, fotoIds, tx);

    for (let ordem = 0; ordem < fotoIds.length; ordem++) {
      const vinculadas = await this.repository.vincularFoto(fotoIds[ordem], lugarId, ordem, tx);
      if (vinculadas !== 1) throw new AppException(400, ErrorMessages.FOTO_INDISPONIVEL);
    }
  }
}

export default new Service();
