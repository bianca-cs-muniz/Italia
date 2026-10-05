import { Request, Response } from "express";
import Service from "./lugares.service";
import { TryCatch } from "@decorators/try-catch.decorator";

class Controller {
  @TryCatch()
  public async listar(_req: Request, res: Response) {
    const result = await Service.listar();
    res.status(200).json(result);
  }

  @TryCatch()
  public async criar(req: Request, res: Response) {
    const result = await Service.criar(req.body);
    res.status(201).json(result);
  }

  @TryCatch()
  public async atualizar(req: Request, res: Response) {
    const result = await Service.atualizar(req.params.id, req.body);
    res.status(200).json(result);
  }

  @TryCatch()
  public async deletar(req: Request, res: Response) {
    await Service.deletar(req.params.id);
    res.status(204).send();
  }
}

export default new Controller();
