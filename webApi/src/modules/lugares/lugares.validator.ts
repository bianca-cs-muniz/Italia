import BaseValidator from "@abstracts/validator.abstract";
import { RequestHandler } from "express";
import { Salvar } from "./dtos/salvar.dto";

class Validator extends BaseValidator {
  public salvar: RequestHandler = (req, _res, next) => {
    this.validateSchema(req, next, "body", Salvar);
  };
}

export default new Validator();
