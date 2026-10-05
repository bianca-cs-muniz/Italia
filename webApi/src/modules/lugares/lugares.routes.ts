import { Router } from "express";
import Controller from "./lugares.controller";
import Validator from "./lugares.validator";
import limite from "@middlewares/limite-requisicoes";

const router = Router();

router.route("/").get(Controller.listar).post(limite.escritas, Validator.salvar, Controller.criar);
router
  .route("/:id")
  .put(limite.escritas, Validator.pathParams, Validator.salvar, Controller.atualizar)
  .delete(limite.escritas, Validator.pathParams, Controller.deletar);

export default router;
