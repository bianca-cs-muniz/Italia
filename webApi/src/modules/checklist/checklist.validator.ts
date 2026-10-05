import BaseValidator from "@abstracts/validator.abstract";
import { RequestHandler } from "express";
import { Marcar } from "./dtos/marcar.dto";

// O `:itemId` da rota não é um uuid (não passa por `pathParams`): se ele
// existe ou não na lista de itens é conferido no service, que responde 404.
class Validator extends BaseValidator {
  public marcar: RequestHandler = (req, _res, next) => {
    this.validateSchema(req, next, "body", Marcar);
  };
}

export default new Validator();
