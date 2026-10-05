// Confere o tipo de uma imagem pelos primeiros bytes do arquivo (a
// "assinatura"), em vez de confiar no Content-Type informado por quem envia:
// o header é só um texto e pode dizer qualquer coisa.
export const TIPOS_DE_IMAGEM_ACEITOS = ["image/jpeg", "image/png", "image/webp"] as const;

export type TipoDeImagem = (typeof TIPOS_DE_IMAGEM_ACEITOS)[number];

const ASSINATURA_JPEG = [0xff, 0xd8, 0xff];
const ASSINATURA_PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function comecaCom(dados: Buffer, assinatura: number[], inicio = 0) {
  if (dados.length < inicio + assinatura.length) return false;
  return assinatura.every((byte, i) => dados[inicio + i] === byte);
}

class ImagemHelper {
  // Lê o tipo do header Content-Type, sem parâmetros (ex: "; charset=...").
  // Devolve null quando o tipo não está entre os aceitos.
  public tipoDoCabecalho(contentType: string | undefined): TipoDeImagem | null {
    const tipo = (contentType ?? "").split(";")[0].trim().toLowerCase();
    return (TIPOS_DE_IMAGEM_ACEITOS as readonly string[]).includes(tipo) ? (tipo as TipoDeImagem) : null;
  }

  // Descobre o tipo real pelos bytes. Devolve null se não for JPEG, PNG nem WebP.
  public tipoPelosBytes(dados: Buffer): TipoDeImagem | null {
    if (comecaCom(dados, ASSINATURA_JPEG)) return "image/jpeg";
    if (comecaCom(dados, ASSINATURA_PNG)) return "image/png";
    // WebP: "RIFF" + 4 bytes de tamanho + "WEBP".
    if (dados.length >= 12 && dados.toString("latin1", 0, 4) === "RIFF" && dados.toString("latin1", 8, 12) === "WEBP") {
      return "image/webp";
    }
    return null;
  }
}

export default new ImagemHelper();
