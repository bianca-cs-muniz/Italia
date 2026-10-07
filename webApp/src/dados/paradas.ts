import type { TrechoId } from "./trechos";

// Paradas do mapa do hero, em coordenadas do viewBox (440 x 500). A ordem do
// array é a ordem em que elas aparecem na animação.
export interface IParada {
  id: string;
  nome: string;
  // Nome por extenso para leitores de tela, quando o rótulo é abreviado.
  nomeCompleto?: string;
  x: number;
  y: number;
  // Capítulo do roteiro para onde o clique leva.
  trecho: TrechoId;
  dias: string;
  // Deslocamento e alinhamento do rótulo em relação ao ponto.
  rotuloX: number;
  rotuloY: number;
  ancora?: "start" | "middle" | "end";
  // Cidade onde se dorme (ponto maior, com anel amarelo).
  base?: boolean;
}

export const LARGURA_MAPA = 440;
export const ALTURA_MAPA = 500;
export const PASSO_GRADE = 55;

export const PARADAS: IParada[] = [
  { id: "roma", nome: "Roma", x: 234, y: 343, trecho: "roma", dias: "dias 1–5", rotuloX: -14, rotuloY: 5, ancora: "end", base: true },
  { id: "napoles", nome: "Nápoles", x: 318, y: 404, trecho: "napoles", dias: "dias 6–7", rotuloX: -14, rotuloY: 20, ancora: "end", base: true },
  { id: "pompeia", nome: "Pompeia", x: 356, y: 412, trecho: "napoles", dias: "dia 7", rotuloX: -6, rotuloY: -34, ancora: "middle" },
  { id: "amalfi", nome: "Amalfi", x: 374, y: 452, trecho: "amalfi", dias: "dias 8–9", rotuloX: 12, rotuloY: 12, base: true },
  // Sem hífen no id: os bate-voltas são identificados como "de-para".
  {
    id: "sangiovanni",
    nome: "S. Giovanni Rotondo",
    nomeCompleto: "San Giovanni Rotondo",
    x: 387,
    y: 354,
    trecho: "sangiovanni",
    dias: "dias 10–11",
    rotuloX: -18,
    rotuloY: -40,
    ancora: "end",
    base: true,
  },
  { id: "assis", nome: "Assis", x: 236, y: 252, trecho: "umbria", dias: "dias 12–14", rotuloX: 14, rotuloY: -28, base: true },
  { id: "florenca", nome: "Florença", x: 166, y: 205, trecho: "toscana", dias: "dias 15–18", rotuloX: 20, rotuloY: -28, ancora: "middle", base: true },
  { id: "pisa", nome: "Pisa", x: 118, y: 222, trecho: "cinque", dias: "dia 19", rotuloX: -12, rotuloY: 16, ancora: "end" },
  { id: "cinque", nome: "Cinque Terre", x: 80, y: 180, trecho: "cinque", dias: "dias 19–21", rotuloX: 14, rotuloY: -38, base: true },
  { id: "milao", nome: "Milão", x: 56, y: 86, trecho: "norte", dias: "dias 22–24", rotuloX: 14, rotuloY: 5, base: true },
  { id: "como", nome: "Como", nomeCompleto: "Lago di Como", x: 78, y: 44, trecho: "norte", dias: "dia 24", rotuloX: 12, rotuloY: -2 },
];

const parada = (id: string): IParada => {
  const encontrada = PARADAS.find((p) => p.id === id);
  if (!encontrada) throw new Error(`Parada desconhecida: ${id}`);
  return encontrada;
};

const ponto = (id: string) => {
  const p = parada(id);
  return `${p.x},${p.y}`;
};

// O percurso inteiro num traço só, de Roma a Milão: desce a Nápoles e Amalfi,
// cruza até San Giovanni Rotondo, sobe a Assis e segue por Florença, Pisa e
// Cinque Terre. É o traço visível e também o trilho por onde o trem anda. A
// curva de San Giovanni Rotondo a Assis abre para a direita para contornar o
// rótulo de San Giovanni Rotondo.
export const CAMINHO_ROTA = `M${ponto("roma")} Q 270,385 ${ponto("napoles")} Q 335,440 ${ponto("amalfi")} Q 404,405 ${ponto("sangiovanni")} C 426,292 330,264 ${ponto("assis")} Q 196,236 ${ponto("florenca")} Q 140,220 ${ponto("pisa")} Q 92,208 ${ponto("cinque")} Q 40,135 ${ponto("milao")}`;

// Bate-voltas a partir de uma base.
export const BATE_VOLTAS: { id: string; d: string }[] = [
  ["napoles", "pompeia"],
  ["milao", "como"],
].map(([de, para]) => ({
  id: `${de}-${para}`,
  d: `M${ponto(de)} L${ponto(para)}`,
}));

export const PARADA_INICIAL = parada("roma");
