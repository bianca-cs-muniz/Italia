import app from "./app";
import DataSource from "@database/data-source";
import { aquecerBanco } from "@database/aquecer-banco";
import appConfig from "@config/app.config";

function iniciar() {
  // Sobe sem esperar o banco: ele pode estar suspenso (Neon gratuito) e levar
  // alguns segundos para acordar. Enquanto isso as rotas respondem 503.
  app.listen(appConfig.porta, () => {
    console.log("Itália Plano — API iniciada com sucesso!");
    console.log(`Disponível em http://localhost:${appConfig.porta}/api`);
  });

  // Acorda o banco em segundo plano. Uma falha aqui nunca derruba a API, e o
  // erro não vai para o log (a mensagem do Prisma traz o endereço do banco).
  aquecerBanco(DataSource).catch(() => {
    console.error("Banco: falha inesperada ao tentar conectar em segundo plano.");
  });
}

iniciar();
