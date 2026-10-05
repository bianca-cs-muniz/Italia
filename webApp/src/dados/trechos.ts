// Trechos da viagem que aceitam lugares salvos (os mesmos ids que a API valida).
export const IDS_TRECHOS = ["roma", "toscana", "cinque", "veneza", "norte", "napoles", "amalfi"] as const;
export type TrechoId = (typeof IDS_TRECHOS)[number];

// O capítulo "retorno" faz parte do roteiro, mas não tem base nem lugares.
export type CapituloId = TrechoId | "retorno";

export interface IDia {
  dia: number;
  titulo: string;
  paradas: string[];
  nota?: string;
}

export interface ITrecho {
  id: CapituloId;
  titulo: string;
  subtitulo: string;
  dias: string;
  // Cidade-base, noites e estratégia de hospedagem; null/ausentes no retorno.
  base: string | null;
  noites?: number;
  estadia?: string;
  itens: IDia[];
}

export const TRECHOS: ITrecho[] = [
  {
    id: "roma",
    titulo: "Roma",
    subtitulo: "Roma Antiga, Vaticano e piazzas",
    dias: "Dias 1–5",
    base: "Roma",
    noites: 5,
    estadia: "Prati, Monti ou área bem localizada próxima ao metrô.",
    itens: [
      { dia: 1, titulo: "Chegada", paradas: ["Brasil → Roma", "Check-in", "Jantar perto do hotel", "Descanso"], nota: "Sem passeio pesado no primeiro dia." },
      { dia: 2, titulo: "Roma Antiga", paradas: ["Coliseu", "Fórum Romano", "Palatino", "Piazza Venezia", "Fontana di Trevi"] },
      {
        dia: 3,
        titulo: "Vaticano",
        paradas: ["Praça de São Pedro", "Basílica de São Pedro", "Museus Vaticanos", "Capela Sistina"],
        nota: "Para a criança, visita objetiva e sem excesso de horas.",
      },
      { dia: 4, titulo: "Roma leve", paradas: ["Villa Borghese", "Piazza di Spagna", "Pantheon", "Piazza Navona", "Gelato", "Trastevere"] },
      { dia: 5, titulo: "Dia livre", paradas: ["Compras", "Parque", "Museu", "Descanso", "Repetir um lugar favorito"] },
    ],
  },
  {
    id: "toscana",
    titulo: "Florença",
    subtitulo: "Florença, Toscana e Pisa",
    dias: "Dias 6–9",
    base: "Florença",
    noites: 3,
    estadia: "Centro histórico ou Santa Maria Novella.",
    itens: [
      { dia: 6, titulo: "Centro histórico", paradas: ["Trem Roma → Florença", "Duomo", "Piazza del Duomo", "Piazza della Signoria", "Ponte Vecchio"] },
      {
        dia: 7,
        titulo: "Arte e cidade",
        paradas: ["Uffizi ou Accademia", "Mercado Central", "Santa Croce", "Piazzale Michelangelo"],
        nota: "Escolher apenas um grande museu.",
      },
      {
        dia: 8,
        titulo: "Toscana e vendemmia",
        paradas: ["Vinícola family-friendly", "Vinhas", "Colheita de uvas, se disponível", "Degustação para adultos", "Almoço típico"],
      },
      { dia: 9, titulo: "Pisa, bate-volta", paradas: ["Florença → Pisa", "Torre inclinada", "Piazza dei Miracoli", "Catedral", "Retorno a Florença"] },
    ],
  },
  {
    id: "cinque",
    titulo: "Cinque Terre",
    subtitulo: "Cinco vilas sobre o mar",
    dias: "Dias 10–11",
    base: "La Spezia",
    noites: 2,
    estadia: "Base prática e normalmente mais econômica para Cinque Terre.",
    itens: [
      { dia: 10, titulo: "Riomaggiore e Manarola", paradas: ["Trem a partir de La Spezia", "Riomaggiore", "Manarola"], nota: "Passeio tranquilo e tempo para fotos." },
      { dia: 11, titulo: "Vernazza e Monterosso", paradas: ["Corniglia", "Vernazza", "Monterosso", "Praia em Monterosso"] },
    ],
  },
  {
    id: "veneza",
    titulo: "Veneza",
    subtitulo: "Canais, ilhas e vaporetto",
    dias: "Dias 12–14",
    base: "Veneza",
    noites: 3,
    estadia: "Veneza propriamente dita se o orçamento permitir; Mestre para economizar.",
    itens: [
      { dia: 12, titulo: "Veneza clássica", paradas: ["Piazza San Marco", "Basílica de São Marcos", "Palácio Ducal", "Ponte dos Suspiros", "Rialto"] },
      { dia: 13, titulo: "Veneza sem pressa", paradas: ["Vaporetto", "Cannaregio", "Dorsoduro", "Canais", "Cafés", "Gelato"] },
      { dia: 14, titulo: "Murano e Burano", paradas: ["Murano e o vidro", "Burano e as casas coloridas"], nota: "Dia mais leve." },
    ],
  },
  {
    id: "norte",
    titulo: "Milão",
    subtitulo: "Verona, Milão e Lago di Como",
    dias: "Dias 15–17",
    base: "Milão",
    noites: 2,
    estadia: "Centro/Brera ou região próxima ao transporte.",
    itens: [
      { dia: 15, titulo: "Verona", paradas: ["Arena di Verona", "Piazza delle Erbe", "Casa de Julieta", "Centro histórico", "Verona → Milão"] },
      { dia: 16, titulo: "Milão", paradas: ["Duomo", "Galleria Vittorio Emanuele II", "Castelo Sforzesco", "Brera"] },
      { dia: 17, titulo: "Lago di Como", paradas: ["Bate-volta de Milão", "Passeio de barco pelo lago", "Retorno a Milão"] },
    ],
  },
  {
    id: "napoles",
    titulo: "Nápoles",
    subtitulo: "Nápoles e Pompeia",
    dias: "Dias 18–19",
    base: "Nápoles",
    noites: 2,
    estadia: "Área bem localizada e com boas avaliações de segurança.",
    itens: [
      {
        dia: 18,
        titulo: "Nápoles",
        paradas: ["Centro Histórico", "Via dei Tribunali", "Spaccanapoli", "Duomo di Napoli", "Pizza napolitana", "Tocar o nariz do Pulcinella"],
      },
      { dia: 19, titulo: "Pompeia", paradas: ["Nápoles → Pompeia", "Visita guiada curta e family-friendly", "Retorno a Nápoles"] },
    ],
  },
  {
    id: "amalfi",
    titulo: "Costa Amalfitana",
    subtitulo: "Amalfi, Ravello e Positano",
    dias: "Dias 20–21",
    base: "Amalfi",
    noites: 2,
    estadia: "Base para Ravello, Positano e passeio de barco.",
    itens: [
      {
        dia: 20,
        titulo: "Amalfi e Ravello",
        paradas: ["Duomo di Amalfi", "Centro", "Praia", "Ravello", "Villa Rufolo", "Villa Cimbrone", "Terrazza dell'Infinito"],
      },
      {
        dia: 21,
        titulo: "Positano e barco",
        paradas: ["Amalfi → Positano", "Passeio de barco", "Retorno a Amalfi"],
        nota: "Um dos dias mais leves e especiais da viagem.",
      },
    ],
  },
  {
    id: "retorno",
    titulo: "Retorno",
    subtitulo: "De volta ao Brasil",
    dias: "Dias 22–23",
    base: null,
    itens: [
      {
        dia: 22,
        titulo: "Deslocamento",
        paradas: ["Amalfi → aeroporto ou cidade de saída"],
        nota: "Idealmente, uma noite de segurança antes do voo internacional.",
      },
      { dia: 23, titulo: "Brasil", paradas: ["Voo de retorno"], nota: "A duração final pode ser ajustada conforme os horários das passagens." },
    ],
  },
];

export const ehTrechoId = (id: string): id is TrechoId => (IDS_TRECHOS as readonly string[]).includes(id);

// Capítulos que têm grade de lugares (todos menos o retorno).
export const TRECHOS_COM_LUGARES = TRECHOS.filter((t): t is ITrecho & { id: TrechoId } => ehTrechoId(t.id));

// Capítulos com cidade-base: alimentam a tabela "Onde ficar".
export const TRECHOS_COM_BASE = TRECHOS.filter((t) => t.base !== null);

export const obterTrecho = (id: string): ITrecho | undefined => TRECHOS.find((t) => t.id === id);
