import { ehTrechoId } from "@/dados/trechos";
import type { ILugar } from "@/services/lugares/lugares.service";

// Regras puras da tela de lugares, separadas dos componentes para poderem ser
// testadas sem DOM. Os limites espelham a validação da API.
export const MAXIMO_FOTOS = 12;
export const MAXIMO_DESTAQUES = 20;
export const TAMANHO_MAXIMO_DESTAQUE = 80;

// Lugares de um trecho, do mais antigo para o mais novo (a ordem em que foram salvos).
export const lugaresDoTrecho = (lugares: readonly ILugar[], trecho: string): ILugar[] =>
  lugares.filter((lugar) => lugar.trecho === trecho).sort((a, b) => a.criadoEm.localeCompare(b.criadoEm));

// Lugares salvos num trecho que não existe mais no roteiro, do mais antigo para
// o mais novo. Continuam na tela para poderem ser movidos ou apagados.
export const lugaresForaDoRoteiro = (lugares: readonly ILugar[]): ILugar[] =>
  lugares.filter((lugar) => !ehTrechoId(lugar.trecho)).sort((a, b) => a.criadoEm.localeCompare(b.criadoEm));

// Quantidade de lugares por trecho: { roma: 2, norte: 1 }.
export const contarPorTrecho = (lugares: readonly ILugar[]): Record<string, number> => {
  const contagem: Record<string, number> = {};
  lugares.forEach((lugar) => {
    contagem[lugar.trecho] = (contagem[lugar.trecho] ?? 0) + 1;
  });
  return contagem;
};

// Campo "Destaques" (um por linha) <-> lista de etiquetas.
export const textoParaDestaques = (texto: string): string[] =>
  texto
    .split("\n")
    .map((linha) => linha.trim())
    .filter(Boolean);

export const destaquesParaTexto = (destaques: readonly string[]): string => destaques.join("\n");

// Mensagem do problema, ou null quando a lista pode ser enviada.
export const validarDestaques = (destaques: readonly string[]): string | null => {
  if (destaques.length > MAXIMO_DESTAQUES) return `Use no máximo ${MAXIMO_DESTAQUES} destaques.`;
  if (destaques.some((d) => d.length > TAMANHO_MAXIMO_DESTAQUE)) return `Cada destaque pode ter até ${TAMANHO_MAXIMO_DESTAQUE} caracteres.`;
  return null;
};

// Dos arquivos escolhidos, ficam só as imagens e só até completar 12 fotos.
export const aceitarFotos = <T extends { type: string }>(arquivos: readonly T[], quantidadeAtual: number, maximo = MAXIMO_FOTOS): T[] =>
  arquivos.filter((arquivo) => arquivo.type.startsWith("image/")).slice(0, Math.max(0, maximo - quantidadeAtual));

// Descrição -> parágrafos (separados por linha em branco), cada um com suas linhas.
export const paragrafos = (descricao: string): string[][] =>
  descricao
    .split(/\n\s*\n/)
    .map((paragrafo) => paragrafo.trim())
    .filter(Boolean)
    .map((paragrafo) => paragrafo.split("\n"));

// Letra do cartão sem foto.
export const inicialDoNome = (nome: string): string => Array.from(nome.trim())[0] ?? "?";

// Galeria circular: depois da última foto vem a primeira, e vice-versa.
export const proximoIndice = (atual: number, passo: number, total: number): number => {
  if (total < 2) return 0;
  return (((atual + passo) % total) + total) % total;
};

// Selo da capa: só aparece quando há mais de uma foto.
export const rotuloFotos = (quantidade: number): string | null => (quantidade > 1 ? `${quantidade} fotos` : null);
