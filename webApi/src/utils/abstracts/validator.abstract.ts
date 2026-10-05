import { NextFunction, Request, RequestHandler } from "express";
import { z } from "zod";
import AppException from "@erros/app-exception";
import { RequestPath } from "@dtos/request-path.dto";
import { TipoPropriedadeRequest } from "@tipos/request.type";

// Classe base para os Validators de cada módulo. Cada módulo estende essa
// classe e implementa seus próprios métodos (criar, atualizar...) chamando
// `validateSchema` com o schema Zod correspondente.
abstract class BaseValidator {
  constructor(protected readonly pathSchema = RequestPath) {}

  protected validateSchema(req: Request, next: NextFunction, propriedade: TipoPropriedadeRequest, schema: z.ZodTypeAny) {
    try {
      req[propriedade] = schema.parse(req[propriedade]);
      next();
    } catch (err: any) {
      const mensagem = err?.issues
        ? err.issues.map((i: any) => (i.path.length ? `${i.path.join(".")}: ${i.message}` : i.message)).join(" | ")
        : "Dados inválidos.";
      next(new AppException(400, mensagem));
    }
  }

  public pathParams: RequestHandler = (req, _res, next) => {
    this.validateSchema(req, next, "params", this.pathSchema);
  };
}

export default BaseValidator;
