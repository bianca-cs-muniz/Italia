import { z } from "zod";

export type MarcarDto = z.output<typeof Marcar>;
export const Marcar = z.object({
  marcado: z.boolean({ message: "Informe se o item está marcado (true ou false)." }),
});
