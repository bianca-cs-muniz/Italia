import { PrismaClient } from "@prisma/client";

import { ajustarUrlDoBanco } from "./url-banco";

// Padrão Singleton: garante uma única instância do Prisma Client
// em toda a aplicação.
class DataSource {
  private static db?: PrismaClient;

  // O construtor é privado para impedir chamadas diretas com `new`.
  private constructor() {}

  public static getInstance(): PrismaClient {
    if (!DataSource.db) {
      // Acrescenta os tempos de espera à DATABASE_URL (ver url-banco.ts). Sem a
      // variável, o Prisma segue lendo a URL do schema, como antes.
      const url = ajustarUrlDoBanco(process.env.DATABASE_URL);
      DataSource.db = new PrismaClient({
        errorFormat: "minimal",
        ...(url ? { datasourceUrl: url } : {}),
      });
    }
    return DataSource.db;
  }
}

export default DataSource.getInstance();
