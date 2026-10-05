import Repository from "./fotos.repository";
import ImagemHelper, { TipoDeImagem } from "@helpers/imagem.helper";
import appConfig from "@config/app.config";
import AppException from "@erros/app-exception";
import ErrorMessages from "@erros/error-messages";

class Service {
  private readonly repository;

  constructor() {
    this.repository = Repository;
  }

  // O front envia uma foto por requisição e guarda o id devolvido; depois
  // salva o lugar com a lista de ids na ordem escolhida.
  public async enviar(tipoMime: TipoDeImagem, dados: Buffer) {
    if (dados.length > appConfig.limites.tamanhoMaximoFoto) {
      throw new AppException(413, ErrorMessages.FOTO_GRANDE_DEMAIS);
    }
    // Os primeiros bytes precisam bater com o tipo informado no header: um
    // arquivo qualquer renomeado para .jpg não passa.
    if (ImagemHelper.tipoPelosBytes(dados) !== tipoMime) {
      throw new AppException(415, ErrorMessages.FOTO_INVALIDA);
    }

    // Faxina a cada upload: fotos enviadas há mais de 24 h que nunca foram
    // ligadas a um lugar (formulário abandonado) são apagadas.
    const prazo = new Date(Date.now() - appConfig.limites.horasParaApagarFotoOrfa * 60 * 60 * 1000);
    await this.repository.apagarOrfasAnterioresA(prazo);

    const orfas = await this.repository.contarOrfas();
    if (orfas >= appConfig.limites.maximoFotosOrfas) {
      throw new AppException(429, ErrorMessages.LIMITE_FOTOS_PENDENTES);
    }

    return await this.repository.criar({ tipoMime, tamanho: dados.length, dados });
  }

  public async obter(id: string) {
    const foto = await this.repository.buscarPorId(id);
    if (!foto) throw new AppException(404, ErrorMessages.FOTO_NAO_ENCONTRADA);
    return { tipoMime: foto.tipoMime, dados: Buffer.from(foto.dados) };
  }
}

export default new Service();
