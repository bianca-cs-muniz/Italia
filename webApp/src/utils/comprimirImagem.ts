export const LADO_MAXIMO = 1800;
export const QUALIDADE_JPEG = 0.86;
// Limite da API por foto.
export const TAMANHO_MAXIMO_FOTO = 2 * 1024 * 1024;
// Quantas vezes a imagem pode ser refeita, cada vez menor, até caber no limite.
export const MAXIMO_TENTATIVAS = 6;

const QUALIDADE_MINIMA = 0.5;
const LADO_MINIMO = 600;

// Reduz mantendo a proporção até o maior lado caber em `maximo`; nunca amplia.
export const dimensoesReduzidas = (largura: number, altura: number, maximo: number) => {
  const fator = Math.min(1, maximo / Math.max(largura, altura));
  return { largura: Math.round(largura * fator), altura: Math.round(altura * fator) };
};

// Ajuste seguinte quando o arquivo ainda ficou grande: um pouco menos de
// qualidade e de tamanho, até os pisos.
export const proximaTentativa = (maximo: number, qualidade: number) => ({
  maximo: Math.max(LADO_MINIMO, Math.round(maximo * 0.85)),
  qualidade: Math.max(QUALIDADE_MINIMA, Math.round((qualidade - 0.08) * 100) / 100),
});

const carregarImagem = (arquivo: Blob): Promise<HTMLImageElement> => {
  return new Promise((resolver, rejeitar) => {
    const imagem = new Image();
    const url = URL.createObjectURL(arquivo);
    imagem.onload = () => {
      URL.revokeObjectURL(url);
      resolver(imagem);
    };
    imagem.onerror = () => {
      URL.revokeObjectURL(url);
      rejeitar(new Error("Não foi possível ler uma das imagens."));
    };
    imagem.src = url;
  });
};

const desenharJpeg = (imagem: HTMLImageElement, maximo: number, qualidade: number): Promise<Blob> => {
  return new Promise((resolver, rejeitar) => {
    const falhar = () => rejeitar(new Error("Não foi possível ler uma das imagens."));
    const { largura, altura } = dimensoesReduzidas(imagem.width, imagem.height, maximo);
    const canvas = document.createElement("canvas");
    canvas.width = largura;
    canvas.height = altura;
    const contexto = canvas.getContext("2d");
    if (!contexto) return falhar();
    // JPEG não tem transparência: sem o fundo branco, as áreas transparentes de um PNG sairiam pretas.
    contexto.fillStyle = "#fff";
    contexto.fillRect(0, 0, largura, altura);
    contexto.drawImage(imagem, 0, 0, largura, altura);
    canvas.toBlob((blob) => (blob ? resolver(blob) : falhar()), "image/jpeg", qualidade);
  });
};

// Redesenha a imagem num canvas e devolve um JPEG menor, pronto para o upload.
// Se ainda passar do limite da API, tenta de novo com menos qualidade e
// tamanho. Só roda no navegador.
export const comprimirImagem = async (
  arquivo: Blob,
  maximo = LADO_MAXIMO,
  qualidade = QUALIDADE_JPEG,
  tamanhoMaximo = TAMANHO_MAXIMO_FOTO,
): Promise<Blob> => {
  const imagem = await carregarImagem(arquivo);
  let ajuste = { maximo, qualidade };
  for (let tentativa = 1; tentativa <= MAXIMO_TENTATIVAS; tentativa += 1) {
    const blob = await desenharJpeg(imagem, ajuste.maximo, ajuste.qualidade);
    if (blob.size <= tamanhoMaximo) return blob;
    ajuste = proximaTentativa(ajuste.maximo, ajuste.qualidade);
  }
  throw new Error("Uma das fotos ficou grande demais mesmo depois de reduzida. Tente outra imagem.");
};
