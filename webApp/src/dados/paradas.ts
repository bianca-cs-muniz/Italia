import type { TrechoId } from "./trechos";

// Paradas do mapa do hero, em coordenadas do viewBox (440 x 500). A ordem do
// array é a ordem em que elas aparecem na animação.
export interface IParada {
  id: string;
  nome: string;
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
  { id: "florenca", nome: "Florença", x: 166, y: 205, trecho: "toscana", dias: "dias 6–8", rotuloX: 14, rotuloY: 2, base: true },
  { id: "pisa", nome: "Pisa", x: 118, y: 222, trecho: "toscana", dias: "dia 9", rotuloX: -12, rotuloY: 16, ancora: "end" },
  { id: "cinque", nome: "Cinque Terre", x: 80, y: 180, trecho: "cinque", dias: "dias 10–11", rotuloX: 0, rotuloY: -26, ancora: "middle", base: true },
  { id: "veneza", nome: "Veneza", x: 228, y: 84, trecho: "veneza", dias: "dias 12–14", rotuloX: 14, rotuloY: 5, base: true },
  { id: "verona", nome: "Verona", x: 152, y: 84, trecho: "norte", dias: "dia 15", rotuloX: 0, rotuloY: -24, ancora: "middle" },
  { id: "milao", nome: "Milão", x: 56, y: 86, trecho: "norte", dias: "dias 15–17", rotuloX: 0, rotuloY: 26, ancora: "middle", base: true },
  { id: "como", nome: "Como", x: 44, y: 44, trecho: "norte", dias: "dia 17", rotuloX: 14, rotuloY: -2 },
  { id: "napoles", nome: "Nápoles", x: 318, y: 404, trecho: "napoles", dias: "dias 18–19", rotuloX: -14, rotuloY: 4, ancora: "end", base: true },
  { id: "pompeia", nome: "Pompeia", x: 356, y: 412, trecho: "napoles", dias: "dia 19", rotuloX: 12, rotuloY: -8 },
  { id: "amalfi", nome: "Amalfi", x: 374, y: 452, trecho: "amalfi", dias: "dias 20–21", rotuloX: 12, rotuloY: 12, base: true },
  { id: "positano", nome: "Positano", x: 330, y: 468, trecho: "amalfi", dias: "dia 21", rotuloX: -12, rotuloY: 6, ancora: "end" },
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

// Trem entre bases, de Roma a Milão.
export const CAMINHO_NORTE = `M${ponto("roma")} Q 186,290 ${ponto("florenca")} Q 120,170 ${ponto("cinque")} Q 236,190 ${ponto("veneza")} Q 190,98 ${ponto("verona")} Q 104,72 ${ponto("milao")}`;

// Trecho longo, de Milão a Nápoles (pontilhado).
const CURVA_LONGA = `C 150,170 420,230 ${ponto("napoles")}`;
export const CAMINHO_LONGO = `M${ponto("milao")} ${CURVA_LONGA}`;

// Trem entre bases, de Nápoles a Amalfi.
const CURVA_SUL = `Q 360,430 ${ponto("amalfi")}`;
export const CAMINHO_SUL = `M${ponto("napoles")} ${CURVA_SUL}`;

// O percurso inteiro num traço só: é o trilho (invisível) por onde o trem anda.
export const CAMINHO_TREM = `${CAMINHO_NORTE} ${CURVA_LONGA} ${CURVA_SUL}`;

// Bate-voltas a partir de uma base.
export const BATE_VOLTAS: { id: string; d: string }[] = [
  ["florenca", "pisa"],
  ["milao", "como"],
  ["napoles", "pompeia"],
  ["amalfi", "positano"],
].map(([de, para]) => ({ id: `${de}-${para}`, d: `M${ponto(de)} L${ponto(para)}` }));

export const PARADA_INICIAL = parada("roma");
