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
  { id: "roma", nome: "Roma", x: 234, y: 343, trecho: "roma", dias: "dias 1–5", rotuloX: 14, rotuloY: 5, base: true },
  { id: "assis", nome: "Assis", x: 236, y: 252, trecho: "umbria", dias: "dias 6–7", rotuloX: -14, rotuloY: 2, ancora: "end", base: true },
  { id: "florenca", nome: "Florença", x: 166, y: 205, trecho: "toscana", dias: "dias 8–11", rotuloX: 14, rotuloY: 14, base: true },
  { id: "pisa", nome: "Pisa", x: 118, y: 222, trecho: "cinque", dias: "dia 12", rotuloX: -12, rotuloY: 16, ancora: "end" },
  { id: "cinque", nome: "Cinque Terre", x: 80, y: 180, trecho: "cinque", dias: "dias 12–14", rotuloX: 0, rotuloY: -26, ancora: "middle", base: true },
  { id: "veneza", nome: "Veneza", x: 228, y: 84, trecho: "veneza", dias: "dias 15–17", rotuloX: 14, rotuloY: 5, base: true },
  { id: "verona", nome: "Verona", x: 152, y: 84, trecho: "norte", dias: "dia 18", rotuloX: 0, rotuloY: -24, ancora: "middle" },
  { id: "milao", nome: "Milão", x: 56, y: 86, trecho: "norte", dias: "dias 18–19", rotuloX: 0, rotuloY: -26, ancora: "middle", base: true },
  { id: "napoles", nome: "Nápoles", x: 318, y: 404, trecho: "napoles", dias: "dias 20–21", rotuloX: -10, rotuloY: -26, ancora: "end", base: true },
  { id: "pompeia", nome: "Pompeia", x: 356, y: 412, trecho: "napoles", dias: "dia 21", rotuloX: -10, rotuloY: 20, ancora: "end" },
  // Sem hífen no id: os bate-voltas são identificados como "de-para".
  {
    id: "sangiovanni",
    nome: "S. Giovanni Rotondo",
    nomeCompleto: "San Giovanni Rotondo",
    x: 387,
    y: 354,
    trecho: "sangiovanni",
    dias: "dias 22–23",
    rotuloX: 38,
    rotuloY: -26,
    ancora: "end",
    base: true,
  },
  { id: "amalfi", nome: "Amalfi", x: 374, y: 452, trecho: "amalfi", dias: "dia 24", rotuloX: 12, rotuloY: 12, base: true },
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

// Entre bases, de Roma a Milão: sobe por Assis, passa por Florença, Pisa,
// Cinque Terre e Veneza, e chega a Milão por Verona. A curva de Assis a
// Florença contorna o rótulo de Florença por cima.
export const CAMINHO_NORTE = `M${ponto("roma")} Q 226,300 ${ponto("assis")} Q 260,130 ${ponto("florenca")} Q 140,220 ${ponto("pisa")} Q 92,208 ${ponto("cinque")} Q 236,190 ${ponto("veneza")} Q 190,98 ${ponto("verona")} Q 104,96 ${ponto("milao")}`;

// Trecho longo, de Milão a Nápoles (pontilhado), descendo pelo lado oeste do mapa.
const CURVA_LONGA = `C -40,230 140,450 ${ponto("napoles")}`;
export const CAMINHO_LONGO = `M${ponto("milao")} ${CURVA_LONGA}`;

// Entre bases, de Nápoles a Amalfi, passando por San Giovanni Rotondo (o trecho de carro).
const CURVA_SUL = `Q 350,360 ${ponto("sangiovanni")} Q 400,405 ${ponto("amalfi")}`;
export const CAMINHO_SUL = `M${ponto("napoles")} ${CURVA_SUL}`;

// O percurso inteiro num traço só: é o trilho (invisível) por onde o trem anda.
export const CAMINHO_TREM = `${CAMINHO_NORTE} ${CURVA_LONGA} ${CURVA_SUL}`;

// Bate-voltas a partir de uma base.
export const BATE_VOLTAS: { id: string; d: string }[] = [["napoles", "pompeia"]].map(([de, para]) => ({
  id: `${de}-${para}`,
  d: `M${ponto(de)} L${ponto(para)}`,
}));

export const PARADA_INICIAL = parada("roma");
