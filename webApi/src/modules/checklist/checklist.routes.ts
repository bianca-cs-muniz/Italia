import { Router } from "express";
import Controller from "./checklist.controller";
import Validator from "./checklist.validator";
import limite from "@middlewares/limite-requisicoes";

const router = Router();

router.route("/").get(Controller.listar);
router.route("/:itemId").put(limite.escritas, Validator.marcar, Controller.marcar);

export default router;
