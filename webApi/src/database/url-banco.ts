// Tempos de espera acrescentados à URL do banco quando ela não os define.
// O Neon gratuito suspende o banco após alguns minutos parado, e a primeira
// conexão depois disso costuma passar dos 5 s que o Prisma espera por padrão.
const PARAMETROS_PADRAO: Array<[string, string]> = [
  // Segundos para abrir uma conexão com o banco.
  ["connect_timeout", "15"],
  // Segundos que uma consulta espera por uma conexão livre do pool.
  ["pool_timeout", "20"],
];

const AVISO_URL_NAO_AJUSTADA =
  "Banco: não foi possível ajustar a DATABASE_URL; os tempos de espera ficaram no padrão do Prisma.";

// Devolve a URL com os parâmetros acima, sem mexer nos que já existem. O texto
// original é mantido como veio (a URL não é remontada), para não alterar a
// senha nem os caracteres codificados dela. URL vazia, que não seja de
// Postgres ou que não dê para interpretar volta sem os parâmetros, com um
// aviso no log (que nunca mostra a URL).
export function ajustarUrlDoBanco(urlInformada: string | undefined): string | undefined {
  if (!urlInformada) return urlInformada;

  // Espaço ou quebra de linha que veio junto ao colar a URL no painel do host.
  const url = urlInformada.trim();
  if (!url) return url;

  let interpretada: URL | undefined;
  try {
    interpretada = new URL(url);
  } catch {
    interpretada = undefined;
  }

  const ehPostgres = interpretada?.protocol === "postgresql:" || interpretada?.protocol === "postgres:";
  // Com "#" não dá para acrescentar parâmetros só colando no fim do texto.
  if (!interpretada || !ehPostgres || url.includes("#")) {
    console.warn(AVISO_URL_NAO_AJUSTADA);
    return url;
  }

  const faltando = PARAMETROS_PADRAO.filter(([nome]) => !interpretada.searchParams.has(nome));
  if (faltando.length === 0) return url;

  const acrescimo = faltando.map(([nome, valor]) => `${nome}=${valor}`).join("&");
  let separador = "&";
  if (!url.includes("?")) separador = "?";
  else if (url.endsWith("?") || url.endsWith("&")) separador = "";

  return `${url}${separador}${acrescimo}`;
}
