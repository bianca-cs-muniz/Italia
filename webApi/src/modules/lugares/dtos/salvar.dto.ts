import { z } from "zod";
import appConfig from "@config/app.config";
import TextoHelper, { MENSAGEM_CARACTERE_INVALIDO } from "@helpers/texto.helper";
import { TIPOS_DE_LUGAR, TRECHOS } from "../lugares.constantes";

// Só http e https: barra "javascript:", "data:" e afins, que virariam um link
// perigoso na tela. O protocolo é lido por `new URL`, não por comparação de texto.
function ehLinkSeguro(valor: string) {
  if (valor === "") return true;
  try {
    const { protocol } = new URL(valor);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

// Base de todo campo de texto: sem espaços nas pontas e sem o byte NUL, que o
// banco recusa (ver shared/helpers/texto.helper.ts).
function texto() {
  return z.string().trim().refine(TextoHelper.semByteNulo, MENSAGEM_CARACTERE_INVALIDO);
}

export type SalvarDto = z.output<typeof Salvar>;
export const Salvar = z.object({
  trecho: z.enum(TRECHOS, { message: "Trecho inválido." }),
  tipo: z.enum(TIPOS_DE_LUGAR, { message: "Tipo inválido." }),
  nome: texto().pipe(
    z.string().min(1, "Informe o nome do lugar.").max(120, "O nome pode ter no máximo 120 caracteres."),
  ),
  resumo: texto().pipe(z.string().max(200, "O resumo pode ter no máximo 200 caracteres.")),
  preco: texto().pipe(z.string().max(80, "O preço pode ter no máximo 80 caracteres.")),
  link: texto().pipe(
    z
      .string()
      .max(500, "O link pode ter no máximo 500 caracteres.")
      .refine(ehLinkSeguro, "Link inválido. Use um endereço que comece com http:// ou https://."),
  ),
  descricao: texto().pipe(z.string().max(5000, "A descrição pode ter no máximo 5.000 caracteres.")),
  destaques: z
    .array(
      texto().pipe(z.string().min(1, "Destaque vazio.").max(80, "Cada destaque pode ter no máximo 80 caracteres.")),
    )
    .max(20, "Um lugar pode ter no máximo 20 destaques."),
  // Ids das fotos já enviadas por POST /api/fotos, na ordem em que aparecem.
  // Vão para minúsculas antes da checagem de repetição: o mesmo uuid escrito
  // com maiúsculas e com minúsculas é a mesma foto.
  fotos: z
    .array(z.string().uuid("Foto inválida.").toLowerCase())
    .max(appConfig.limites.fotosPorLugar, `Um lugar pode ter no máximo ${appConfig.limites.fotosPorLugar} fotos.`)
    .refine((ids) => new Set(ids).size === ids.length, "A mesma foto não pode aparecer duas vezes."),
});
