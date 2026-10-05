import { beforeEach, vi } from "vitest";
import { banco } from "./prisma-em-memoria";

// Vale para todos os arquivos de teste: a instância única do Prisma
// (src/database/data-source.ts) é trocada pelo dublê em memória. Nenhum teste
// abre conexão com banco algum.
vi.mock("@database/data-source", async () => {
  const { prismaFalso } = await import("./prisma-em-memoria");
  return { default: prismaFalso };
});

// Cada teste começa com o "banco" vazio: nenhum depende do que outro gravou.
beforeEach(() => {
  banco.reiniciar();
});
