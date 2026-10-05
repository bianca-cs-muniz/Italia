import app from "./app";
import DataSource from "@database/data-source";
import appConfig from "@config/app.config";

async function iniciar() {
  try {
    // verifica a conexão com o banco antes de subir o servidor.
    await DataSource.$connect();

    app.listen(appConfig.porta, () => {
      console.log("Itália Plano — API iniciada com sucesso!");
      console.log(`Disponível em http://localhost:${appConfig.porta}/api`);
    });
  } catch (err) {
    console.error("Erro ao iniciar o servidor:", err);
    process.exit(1);
  }
}

iniciar();
