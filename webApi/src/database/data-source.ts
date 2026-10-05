import { PrismaClient } from "@prisma/client";

// Padrão Singleton: garante uma única instância do Prisma Client
// em toda a aplicação.
class DataSource {
  private static db?: PrismaClient;

  // O construtor é privado para impedir chamadas diretas com `new`.
  private constructor() {}

  public static getInstance(): PrismaClient {
    if (!DataSource.db) {
      DataSource.db = new PrismaClient({ errorFormat: "minimal" });
    }
    return DataSource.db;
  }
}

export default DataSource.getInstance();
