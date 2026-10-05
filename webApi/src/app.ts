import express from "express";
import cors from "cors";
import helmet from "helmet";
import { Prisma } from "@prisma/client";

import routes from "./modules/index.routes";
import AppException from "@erros/app-exception";
import ErrorMessages from "@erros/error-messages";
import appConfig from "@config/app.config";

// Códigos do Prisma para "não consegui falar com o banco": servidor
// inalcançável (P1001), tempo esgotado ao conectar (P1002) e conexão fechada
// pelo servidor (P1017).
const CODIGOS_BANCO_INDISPONIVEL = ["P1001", "P1002", "P1017"];

// Falha ao iniciar a conexão sem código, ou com um dos códigos acima, é
// passageira (banco acordando). Com outro código é erro de configuração.
function ehBancoIndisponivel(err: unknown): boolean {
  if (err instanceof Prisma.PrismaClientInitializationError) {
    return !err.errorCode || CODIGOS_BANCO_INDISPONIVEL.includes(err.errorCode);
  }
  return err instanceof Prisma.PrismaClientKnownRequestError && CODIGOS_BANCO_INDISPONIVEL.includes(err.code);
}

class App {
  public app: express.Application;

  constructor() {
    this.app = express();
    // Antes de tudo: define de onde vem o IP usado pelo limite de requisições.
    this.app.set("trust proxy", appConfig.proxiesConfiaveis);
    this.registrarMiddlewares();
    this.registrarRotas();
    this.registrarTratamentoGlobalDeErros();
  }

  private registrarMiddlewares() {
    // Inclui X-Content-Type-Options: nosniff, que impede o navegador de
    // "adivinhar" outro tipo para as fotos servidas.
    this.app.use(helmet());
    this.app.use(
      cors({
        origin: appConfig.origensPermitidas,
        // Não há login nem cookies: nenhuma credencial acompanha as requisições.
        credentials: false,
      }),
    );
    // Limite padrão (100kb): os JSONs são pequenos. As fotos não passam por
    // aqui, vão como corpo binário só em POST /api/fotos.
    this.app.use(express.json());
  }

  private registrarRotas() {
    this.app.get("/api/saude", (_req, res) => res.json({ ok: true }));
    this.app.use("/api", routes);
    // Rota ou método que não existe: 404 em JSON, como os demais erros.
    this.app.use((_req, _res, next) => next(new AppException(404, ErrorMessages.ROTA_NAO_ENCONTRADA)));
  }

  private registrarTratamentoGlobalDeErros() {
    this.app.use(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
        // O Express e o leitor de corpo marcam com um status 4xx os erros
        // causados por quem enviou a requisição. Erros internos (banco, bugs)
        // não trazem status e seguem para o 500 lá embaixo.
        const status = Number(err?.status ?? err?.statusCode);
        const ehErroDoCliente = Number.isInteger(status) && status >= 400 && status < 500;

        if (err instanceof AppException) {
          res.status(err.status).json({ error: err.message });
        } else if (ehErroDoCliente && err instanceof URIError) {
          // "%" mal formado no endereço (ex: /api/fotos/%ZZ): o Express falha
          // ao decodificar o parâmetro da rota, antes dos middlewares dela.
          res.status(status).json({ error: ErrorMessages.ENDERECO_INVALIDO });
        } else if (ehErroDoCliente && typeof err?.type === "string") {
          // Erros do leitor de corpo (JSON quebrado, corpo grande demais,
          // Content-Encoding ou charset não suportado, envio interrompido).
          res.status(status).json({ error: ErrorMessages.CORPO_INVALIDO });
        } else if (ehErroDoCliente) {
          // Qualquer outro 4xx vindo do Express: devolve o status dele, sem
          // registrar no log.
          res.status(status).json({ error: ErrorMessages.REQUISICAO_INVALIDA });
        } else if (ehBancoIndisponivel(err)) {
          // Banco suspenso ou conexão caída: quem chamou pode tentar de novo
          // em instantes. Registra só o código, porque a mensagem do Prisma
          // traz o endereço do banco.
          console.error(`Banco indisponível (${err.errorCode ?? err.code ?? "sem código"})`);
          res.status(503).set("Retry-After", "5").json({ error: ErrorMessages.BANCO_INDISPONIVEL });
        } else if (err instanceof Prisma.PrismaClientInitializationError) {
          // Senha recusada, banco inexistente, schema inválido: tentar de novo
          // não resolve. Também aqui só o código vai para o log.
          console.error(`Erro de configuração do banco (${err.errorCode})`);
          res.status(500).json({ error: ErrorMessages.ERRO_INTERNO });
        } else {
          // Registra só a mensagem, nunca o corpo da requisição.
          console.error(err?.message ?? err);
          res.status(500).json({ error: ErrorMessages.ERRO_INTERNO });
        }
      },
    );
  }
}

export default new App().app;
