import express, { RequestHandler } from "express";
import BaseValidator from "@abstracts/validator.abstract";
import ImagemHelper, { TIPOS_DE_IMAGEM_ACEITOS } from "@helpers/imagem.helper";
import appConfig from "@config/app.config";
import AppException from "@erros/app-exception";
import ErrorMessages from "@erros/error-messages";

// Lê o corpo binário cru (sem multer e sem base64) só quando o Content-Type é
// um dos aceitos, e interrompe a leitura ao passar do tamanho máximo.
// `inflate: false`: corpo comprimido (Content-Encoding) é recusado, para o
// limite valer sobre o que realmente chega.
const lerCorpoBinario = express.raw({
  type: [...TIPOS_DE_IMAGEM_ACEITOS],
  inflate: false,
  limit: appConfig.limites.tamanhoMaximoFoto,
});

class Validator extends BaseValidator {
  // Usado só em POST /fotos. Troca o erro genérico de "corpo grande demais"
  // pela mensagem própria da foto.
  public corpoBinario: RequestHandler = (req, res, next) => {
    lerCorpoBinario(req, res, (err?: any) => {
      if (err?.type === "entity.too.large") return next(new AppException(413, ErrorMessages.FOTO_GRANDE_DEMAIS));
      next(err);
    });
  };

  // Aqui só se confere o que o header diz e se veio um corpo binário. Se os
  // bytes são mesmo de uma imagem desse tipo, quem confere é o service.
  public enviar: RequestHandler = (req, _res, next) => {
    if (!ImagemHelper.tipoDoCabecalho(req.headers["content-type"])) {
      return next(new AppException(415, ErrorMessages.FOTO_TIPO_NAO_ACEITO));
    }
    if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
      return next(new AppException(415, ErrorMessages.FOTO_INVALIDA));
    }
    next();
  };
}

export default new Validator();
