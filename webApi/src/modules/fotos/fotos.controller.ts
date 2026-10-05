import { Request, Response } from "express";
import Service from "./fotos.service";
import ImagemHelper, { TipoDeImagem } from "@helpers/imagem.helper";
import { TryCatch } from "@decorators/try-catch.decorator";

class Controller {
  @TryCatch()
  public async enviar(req: Request, res: Response) {
    // O validator já garantiu que o header traz um dos tipos aceitos.
    const tipoMime = ImagemHelper.tipoDoCabecalho(req.headers["content-type"]) as TipoDeImagem;
    const result = await Service.enviar(tipoMime, req.body);
    res.status(201).json(result);
  }

  @TryCatch()
  public async obter(req: Request, res: Response) {
    const foto = await Service.obter(req.params.id);
    // O tipo vem do banco (conferido pelos bytes no envio), nunca da requisição.
    res.setHeader("Content-Type", foto.tipoMime);
    // Uma foto nunca muda depois de gravada: o navegador pode guardar para sempre.
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    // O front roda em outra origem (outra porta/domínio) e mostra as fotos em
    // <img>: sem isto, o "same-origin" padrão do helmet bloquearia a imagem.
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.status(200).send(foto.dados);
  }
}

export default new Controller();
