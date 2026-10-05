// "Acorda" o banco em segundo plano depois que a API já está no ar. O Neon
// gratuito suspende o banco após alguns minutos parado, e a primeira conexão
// pode demorar ou falhar. Este arquivo não importa o data-source: recebe o
// cliente de quem chama.

type ClienteDoBanco = { $connect: () => Promise<unknown> };
type Esperar = (ms: number) => Promise<void>;

const TENTATIVAS_PADRAO = 5;
const ESPERA_INICIAL_MS = 2000;

const esperarDeVerdade: Esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Só o código do erro vai para o log: a mensagem do Prisma traz o endereço do
// banco.
function codigoDoErro(err: unknown): string {
  const codigo = (err as any)?.errorCode ?? (err as any)?.code;
  return typeof codigo === "string" && codigo ? codigo : "sem código";
}

// Tenta conectar até `tentativas` vezes, esperando 2, 4, 8 e 16 s entre elas.
// Nunca lança: se todas falharem, a API segue no ar e cada rota tenta conectar
// de novo ao consultar o banco. `esperar` e `tentativas` existem para os testes.
export async function aquecerBanco(
  cliente: ClienteDoBanco,
  esperar: Esperar = esperarDeVerdade,
  tentativas: number = TENTATIVAS_PADRAO,
): Promise<void> {
  for (let tentativa = 1; tentativa <= tentativas; tentativa++) {
    const inicio = Date.now();
    try {
      await cliente.$connect();
      console.log(`Banco: conectado na tentativa ${tentativa} (${Date.now() - inicio} ms).`);
      return;
    } catch (err) {
      console.error(
        `Banco: tentativa ${tentativa} de ${tentativas} falhou (${codigoDoErro(err)}) após ${Date.now() - inicio} ms.`,
      );
    }

    if (tentativa < tentativas) {
      await esperar(ESPERA_INICIAL_MS * 2 ** (tentativa - 1));
    }
  }

  console.error("Banco: a API segue sem conexão; as rotas tentarão conectar de novo a cada requisição.");
}
