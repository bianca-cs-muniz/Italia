// O Postgres não aceita o byte NUL (\u0000) em colunas de texto: sem esta
// checagem, um texto com ele passaria pela validação e estouraria no banco
// como erro 500. Usado nos schemas Zod dos campos de texto.
export const MENSAGEM_CARACTERE_INVALIDO = "O texto contém um caractere inválido.";

class TextoHelper {
  public semByteNulo(valor: string): boolean {
    return !valor.includes("\u0000");
  }
}

export default new TextoHelper();
