// Centraliza a leitura das variáveis de ambiente, com valores padrão
// seguros para desenvolvimento. Importe daqui em vez de usar
// process.env diretamente pelo resto do código.

const ambiente = process.env.NODE_ENV || "development";
const ehProducao = ambiente === "production";
const ehTeste = ambiente === "test";

// URL_FRONTEND aceita uma ou mais origens separadas por vírgula
// (ex: "http://localhost:3000,https://italiaplano.vercel.app").
function obterOrigensPermitidas(): string[] {
  const valor = process.env.URL_FRONTEND || "http://localhost:3000";
  // Sem barra no fim: o navegador envia a origem como "https://site.com", e
  // "https://site.com/" nunca bateria com ela.
  return valor.split(",").map((o) => o.trim().replace(/\/+$/, "")).filter(Boolean);
}

// Quantos proxies ficam entre a internet e a API (0 = nenhum, o padrão). Atrás
// de um proxy (ex: Render = 1), é isso que faz o Express enxergar o IP de quem
// chamou, e não o do proxy; sem isso o limite por IP vale para todos juntos.
// Não use um número maior que o real: permitiria forjar o IP pelo header.
function obterProxiesConfiaveis(): number {
  const valor = Number(process.env.PROXIES_CONFIAVEIS || 0);
  return Number.isInteger(valor) && valor >= 0 ? valor : 0;
}

export default {
  ambiente,
  ehProducao,
  ehTeste,
  porta: Number(process.env.PORTA || process.env.PORT || 4000),
  origensPermitidas: obterOrigensPermitidas(),
  proxiesConfiaveis: obterProxiesConfiaveis(),

  // Como não há login, estes tetos são o que impede alguém com a URL de
  // encher o banco.
  limites: {
    tamanhoMaximoFoto: 2 * 1024 * 1024, // 2 MB (o mesmo valor do CHECK no banco)
    fotosPorLugar: 12,
    maximoLugares: 300,
    maximoFotosOrfas: 200,
    // Foto enviada e não ligada a nenhum lugar depois deste prazo é apagada.
    horasParaApagarFotoOrfa: 24,
  },

  // Requisições por minuto, por IP (ver shared/middlewares/limite-requisicoes.ts).
  limiteRequisicoes: {
    janelaMs: 60 * 1000,
    escritasPorJanela: 60,
    uploadsPorJanela: 30,
  },
};
