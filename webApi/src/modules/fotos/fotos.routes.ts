import { Router } from "express";
import Controller from "./fotos.controller";
import Validator from "./fotos.validator";
import limite from "@middlewares/limite-requisicoes";

const router = Router();

// O limite por IP vem antes da leitura do corpo: requisição barrada não chega
// a ocupar memória com a imagem.
router.route("/").post(limite.uploads, Validator.corpoBinario, Validator.enviar, Controller.enviar);
router.route("/:id").get(Validator.pathParams, Controller.obter);

export default router;
