// Trechos da viagem que aceitam lugares salvos (os mesmos ids que a API valida).
export const IDS_TRECHOS = ["roma", "umbria", "toscana", "cinque", "veneza", "norte", "napoles", "sangiovanni", "amalfi"] as const;
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
    subtitulo: "Roma Antiga, Vaticano e basílicas",
    dias: "Dias 1–5",
    base: "Roma",
    noites: 5,
    estadia: "Prati, Monti ou área bem localizada próxima ao metrô.",
    itens: [
      {
        dia: 1,
        titulo: "Chegada",
        paradas: ["Brasil → Roma", "Check-in", "Passeio leve pelo bairro", "Jantar", "Gelato"],
        nota: "Sem atrações importantes no primeiro dia.",
      },
      {
        dia: 2,
        titulo: "Roma Antiga",
        paradas: ["Coliseu", "Fórum Romano", "Palatino", "Piazza Venezia", "Monumento a Vittorio Emanuele II", "Fontana di Trevi à noite"],
        nota: "Praticamente o dia inteiro.",
      },
      {
        dia: 3,
        titulo: "Vaticano",
        paradas: ["Praça de São Pedro", "Basílica de São Pedro", "Túmulo de São Pedro", "Cúpula (opcional)", "Museus Vaticanos", "Capela Sistina"],
        nota: "Um dos dias mais importantes da peregrinação; com a criança, visita objetiva.",
      },
      {
        dia: 4,
        titulo: "Centro histórico",
        paradas: ["Panteão", "Piazza Navona", "Fontana di Trevi", "Piazza di Spagna e Escadaria Espanhola", "Via del Corso", "Almoço em trattoria"],
        nota: "Fim do dia livre para compras e gelato.",
      },
      {
        dia: 5,
        titulo: "São Paulo Extramuros e Castel Sant'Angelo",
        paradas: ["Basílica de São Paulo Extramuros", "Castel Sant'Angelo", "Ponte Sant'Angelo", "Caminhada pelo Tibre", "Passeio por Prati"],
        nota: "Segunda grande parada religiosa de Roma.",
      },
    ],
  },
  {
    id: "umbria",
    titulo: "Assis",
    subtitulo: "São Francisco, Santa Clara e a Porciúncula",
    dias: "Dias 6–7",
    base: "Assis",
    noites: 2,
    estadia: "Centro histórico ou perto da estação, em Santa Maria degli Angeli.",
    itens: [
      {
        dia: 6,
        titulo: "Roma → Assis",
        paradas: ["Trem Roma → Assis", "Check-in", "Basílica de São Francisco", "Centro medieval", "Piazza del Comune", "Gelato e jantar"],
        nota: "Centro a pé: Via San Francesco, Via Portica e Corso Mazzini.",
      },
      {
        dia: 7,
        titulo: "Assis com calma",
        paradas: ["Basílica de Santa Clara", "Piazza del Comune", "Santa Maria degli Angeli e a Porciúncula", "Gelato", "Jantar tranquilo"],
        nota: "Fim de tarde na cidade.",
      },
    ],
  },
  {
    id: "toscana",
    titulo: "Florença",
    subtitulo: "Florença e Toscana",
    dias: "Dias 8–11",
    base: "Florença",
    noites: 4,
    estadia: "Centro histórico ou Santa Maria Novella.",
    itens: [
      {
        dia: 8,
        titulo: "Assis → Florença",
        paradas: ["Café da manhã", "Check-out", "Trem Assis → Florença", "Check-in"],
        nota: "Dia de deslocamento, sem passeio pesado.",
      },
      {
        dia: 9,
        titulo: "Duomo, centro histórico e vinho",
        paradas: [
          "Catedral (Duomo)",
          "Batistério",
          "Campanile",
          "Cúpula de Brunelleschi",
          "Piazza della Signoria",
          "Palazzo Vecchio",
          "Ponte Vecchio",
          "Buchette del vino",
          "Jantar em osteria",
        ],
        nota: "A subida à Cúpula precisa de reserva antecipada.",
      },
      {
        dia: 10,
        titulo: "Uffizi, Santa Croce e pôr do sol",
        paradas: [
          "Galeria Uffizi",
          "Almoço perto da Santa Croce",
          "Basílica de Santa Croce",
          "Travessia do Arno",
          "Piazzale Michelangelo ao pôr do sol",
          "Jantar em Oltrarno",
        ],
        nota: "Uffizi cedo e com reserva.",
      },
      {
        dia: 11,
        titulo: "David e Toscana",
        paradas: [
          "Galeria da Academia (David)",
          "Almoço no Mercato Centrale",
          "Chianti",
          "Vinícola e vinhedos",
          "Vindima, se disponível",
          "Degustação (adultos)",
        ],
        nota: "Experiência pensada para o grupo, com a criança de 11 anos.",
      },
    ],
  },
  {
    id: "cinque",
    titulo: "Cinque Terre",
    subtitulo: "Pisa e cinco vilas sobre o mar",
    dias: "Dias 12–14",
    base: "La Spezia",
    noites: 3,
    estadia: "Base prática e normalmente mais econômica para Cinque Terre.",
    itens: [
      {
        dia: 12,
        titulo: "Pisa a caminho",
        paradas: ["Florença → Pisa", "Torre inclinada", "Piazza dei Miracoli", "Pisa → La Spezia"],
        nota: "Deixar as malas no guarda-volumes da estação de Pisa.",
      },
      { dia: 13, titulo: "Riomaggiore e Manarola", paradas: ["Trem a partir de La Spezia", "Riomaggiore", "Manarola"], nota: "Passeio tranquilo e tempo para fotos." },
      { dia: 14, titulo: "Vernazza e Monterosso", paradas: ["Vernazza", "Monterosso", "Praia em Monterosso"] },
    ],
  },
  {
    id: "veneza",
    titulo: "Veneza",
    subtitulo: "Canais, ilhas e vaporetto",
    dias: "Dias 15–17",
    base: "Veneza",
    noites: 3,
    estadia: "Veneza propriamente dita se o orçamento permitir; Mestre para economizar.",
    itens: [
      {
        dia: 15,
        titulo: "Rumo a Veneza",
        paradas: ["Trem La Spezia → Veneza", "Check-in", "Rialto", "Primeiro passeio pelos canais"],
        nota: "Trecho longo de trem, com conexão.",
      },
      { dia: 16, titulo: "Veneza clássica", paradas: ["Piazza San Marco", "Basílica de São Marcos", "Palácio Ducal", "Ponte dos Suspiros"] },
      { dia: 17, titulo: "Murano e Burano", paradas: ["Murano e o vidro", "Burano e as casas coloridas", "Passeio de barco"], nota: "Dia mais leve." },
    ],
  },
  {
    id: "norte",
    titulo: "Milão",
    subtitulo: "Verona e Milão",
    dias: "Dias 18–19",
    base: "Milão",
    noites: 2,
    estadia: "Centro/Brera ou região próxima ao transporte.",
    itens: [
      { dia: 18, titulo: "Verona a caminho", paradas: ["Veneza → Verona", "Arena di Verona", "Piazza delle Erbe", "Casa de Julieta", "Verona → Milão"] },
      { dia: 19, titulo: "Milão", paradas: ["Duomo", "Galleria Vittorio Emanuele II", "Brera"] },
    ],
  },
  {
    id: "napoles",
    titulo: "Nápoles",
    subtitulo: "Nápoles e Pompeia",
    dias: "Dias 20–21",
    base: "Nápoles",
    noites: 2,
    estadia: "Área bem localizada e com boas avaliações de segurança.",
    itens: [
      {
        dia: 20,
        titulo: "Rumo a Nápoles",
        paradas: ["Trem Milão → Nápoles", "Check-in", "Pizza napolitana"],
        nota: "O trecho mais longo de trem da viagem.",
      },
      {
        dia: 21,
        titulo: "Nápoles e Pompeia",
        paradas: ["Pompeia em visita curta e family-friendly", "Spaccanapoli", "Via dei Tribunali", "Tocar o nariz do Pulcinella"],
      },
    ],
  },
  {
    id: "sangiovanni",
    titulo: "San Giovanni Rotondo",
    subtitulo: "Santuário de Padre Pio",
    dias: "Dias 22–23",
    base: "San Giovanni Rotondo",
    noites: 2,
    estadia: "Perto do santuário, com estacionamento: este é o trecho de carro.",
    itens: [
      {
        dia: 22,
        titulo: "Rumo a San Giovanni Rotondo",
        paradas: ["Retirar o carro em Nápoles", "Nápoles → San Giovanni Rotondo", "Check-in"],
        nota: "Fora da rota de trem: carro alugado só neste trecho.",
      },
      { dia: 23, titulo: "Padre Pio", paradas: ["Santuário de Padre Pio", "Santa Maria delle Grazie", "Centro da cidade"] },
    ],
  },
  {
    id: "amalfi",
    titulo: "Costa Amalfitana",
    subtitulo: "Amalfi à beira-mar",
    dias: "Dia 24",
    base: "Amalfi",
    noites: 1,
    estadia: "Uma noite no centro de Amalfi, perto do mar; confirmar estacionamento ou devolver o carro antes.",
    itens: [
      {
        dia: 24,
        titulo: "Costa Amalfitana",
        paradas: ["San Giovanni Rotondo → Amalfi", "Duomo di Amalfi", "Centro", "Fim de tarde na praia"],
        nota: "Deslocamento longo; a tarde é para descansar à beira-mar.",
      },
    ],
  },
  {
    id: "retorno",
    titulo: "Retorno",
    subtitulo: "De volta ao Brasil",
    dias: "Dia 25",
    base: null,
    itens: [
      {
        dia: 25,
        titulo: "Amalfi e volta",
        paradas: ["Manhã em Amalfi", "Amalfi → Roma", "Voo de retorno"],
        nota: "Não pegar voo internacional apertado saindo de Amalfi: voo à noite, ou dormir em Roma e voar no dia seguinte.",
      },
    ],
  },
];

export const ehTrechoId = (id: string): id is TrechoId => (IDS_TRECHOS as readonly string[]).includes(id);

// Capítulos que têm grade de lugares (todos menos o retorno).
export const TRECHOS_COM_LUGARES = TRECHOS.filter((t): t is ITrecho & { id: TrechoId } => ehTrechoId(t.id));

// Capítulos com cidade-base: alimentam a tabela "Onde ficar".
export const TRECHOS_COM_BASE = TRECHOS.filter((t) => t.base !== null);

export const obterTrecho = (id: string): ITrecho | undefined => TRECHOS.find((t) => t.id === id);
