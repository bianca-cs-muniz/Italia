import { readFileSync } from "node:fs";
import path from "node:path";
import { defineConfig } from "vitest/config";

// Os aliases (@config/*, @erros/*, ...) são lidos do próprio tsconfig.json,
// para os testes resolverem os imports exatamente como o `tsc` + `tsc-alias`.
function aliasesDoTsconfig() {
  const tsconfig = JSON.parse(readFileSync(path.resolve(__dirname, "tsconfig.json"), "utf8"));
  const { baseUrl = ".", paths = {} } = tsconfig.compilerOptions as {
    baseUrl?: string;
    paths?: Record<string, string[]>;
  };

  return Object.entries(paths).map(([apelido, [destino]]) => ({
    // "@erros/*" → /^@erros\/(.*)$/  e  "errors/*" → <raiz>/src/errors/$1
    find: new RegExp(`^${apelido.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace("*", "(.*)")}$`),
    replacement: path.resolve(__dirname, baseUrl, destino.replace("*", "$1")),
  }));
}

export default defineConfig({
  resolve: { alias: aliasesDoTsconfig() },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/apoio/setup.ts"],
    env: {
      // Desliga o limite de requisições (ver shared/middlewares/limite-requisicoes.ts).
      NODE_ENV: "test",
      URL_FRONTEND: "http://localhost:3000, https://italia.exemplo.com/",
      PROXIES_CONFIAVEIS: "0",
      // Os testes nunca falam com um banco: o Prisma é trocado por um dublê em
      // memória (tests/apoio/setup.ts). Estes endereços inválidos são só uma
      // trava: como já estão definidos, nenhum `.env` consegue colocar a URL
      // de um banco de verdade no lugar.
      DATABASE_URL: "postgresql://teste:teste@127.0.0.1:1/banco-que-nao-existe",
      DIRECT_URL: "postgresql://teste:teste@127.0.0.1:1/banco-que-nao-existe",
    },
  },
});
