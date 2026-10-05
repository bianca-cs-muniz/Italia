import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compiler: {
    emotion: true,
  },
  // Fixa a raiz do projeto: sem isso o Next pode escolher um package-lock.json
  // de uma pasta acima como raiz do workspace.
  turbopack: {
    root: path.resolve(__dirname),
  },
  async rewrites() {
    // O front encaminha /api/* para o webApi. Em dev aponta para localhost:4000;
    // em produção, defina API_URL com a URL pública do backend implantado.
    const apiUrl = process.env.API_URL || "http://localhost:4000";
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
