import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Mesmo alias do tsconfig.json ("@/*" -> "./src/*").
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["tests/**/*.test.{ts,tsx}"],
    // Padrão sem DOM; os testes de hooks/componentes pedem jsdom no topo do arquivo.
    environment: "node",
  },
});
