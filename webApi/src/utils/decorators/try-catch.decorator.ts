import { NextFunction, Request, Response } from "express";

// Decorator aplicado nos métodos dos Controllers: envolve o método original
// num try/catch e encaminha qualquer erro para o middleware global de erros,
// evitando repetir try/catch em cada método. Erros inesperados (ex: do banco)
// seguem como estão: o middleware registra no log e devolve uma mensagem
// genérica, sem vazar detalhes internos para o cliente.
export function TryCatch() {
  return (_target: any, _key: string, descriptor: PropertyDescriptor) => {
    const metodoOriginal = descriptor.value;

    descriptor.value = async function (req: Request, res: Response, next: NextFunction) {
      try {
        await metodoOriginal.call(this, req, res, next);
      } catch (err) {
        next(err);
      }
    };

    return descriptor;
  };
}
