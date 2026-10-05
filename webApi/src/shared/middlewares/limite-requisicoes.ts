import rateLimit from "express-rate-limit";
import appConfig from "@config/app.config";
import AppException from "@erros/app-exception";
import ErrorMessages from "@erros/error-messages";

// Sem login, o limite por IP é o que segura um script que fique gravando ou
// enviando fotos sem parar. As leituras (GET) não passam por aqui.
function criarLimite(maximo: number) {
  return rateLimit({
    windowMs: appConfig.limiteRequisicoes.janelaMs,
    limit: maximo,
    standardHeaders: true,
    legacyHeaders: false,
    // Nos testes automatizados o limite fica desligado, para não derrubar
    // suítes que fazem muitas escritas seguidas.
    skip: () => appConfig.ehTeste,
    // Encaminha para o middleware global, que responde { error } como o resto da API.
    handler: (_req, _res, next) => next(new AppException(429, ErrorMessages.MUITAS_REQUISICOES)),
  });
}

class LimiteRequisicoes {
  // Criar, editar e apagar lugares; marcar e desmarcar o checklist.
  public escritas = criarLimite(appConfig.limiteRequisicoes.escritasPorJanela);

  // Envio de fotos: mais apertado, porque cada requisição pode gravar até 2 MB.
  public uploads = criarLimite(appConfig.limiteRequisicoes.uploadsPorJanela);
}

export default new LimiteRequisicoes();
