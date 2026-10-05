import { Request, Response } from "express";
import Service from "./checklist.service";
import { TryCatch } from "@decorators/try-catch.decorator";

class Controller {
  @TryCatch()
  public async listar(_req: Request, res: Response) {
    const result = await Service.listar();
    res.status(200).json(result);
  }

  @TryCatch()
  public async marcar(req: Request, res: Response) {
    const result = await Service.marcar(req.params.itemId, req.body);
    res.status(200).json(result);
  }
}

export default new Controller();
