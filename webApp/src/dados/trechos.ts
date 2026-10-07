// Trechos da viagem que aceitam lugares salvos (os mesmos ids que a API valida).
export const IDS_TRECHOS = ["roma", "napoles", "amalfi", "sangiovanni", "umbria", "toscana", "cinque", "norte"] as const;
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
    estadia: "Prati, perto do Vaticano; Monti como alternativa.",
    itens: [
      {
        dia: 1,
        titulo: "Chegada",
        paradas: ["Brasil → Roma", "Check-in", "Descanso", "Jantar no bairro"],
        nota: "Sem atrações importantes no primeiro dia.",
      },
      {
        dia: 2,
        titulo: "Roma Antiga",
        paradas: ["Coliseu", "Fórum Romano", "Palatino", "Fontana di Trevi à noite"],
        nota: "Praticamente o dia inteiro.",
      },
      {
        dia: 3,
        titulo: "Vaticano",
        paradas: ["Basílica de São Pedro", "Museus Vaticanos", "Capela Sistina", "Noite livre"],
        nota: "Um dos dias mais importantes da peregrinação; com a criança, visita objetiva.",
      },
      { dia: 4, titulo: "Centro histórico", paradas: ["Panteão", "Piazza Navona", "Piazza di Spagna", "Via del Corso", "Noite livre"] },
      {
        dia: 5,
        titulo: "São Paulo Fora dos Muros e Castel Sant'Angelo",
        paradas: ["Basílica de São Paulo Fora dos Muros", "Castel Sant'Angelo", "Caminhada pelo Tibre", "Noite em Prati"],
        nota: "Segunda grande parada religiosa de Roma.",
      },
    ],
  },
  {
    id: "napoles",
    titulo: "Nápoles",
    subtitulo: "Nápoles e Pompeia",
    dias: "Dias 6–7",
    base: "Nápoles",
    noites: 2,
    estadia: "Chiaia ou Via Toledo.",
    itens: [
      {
        dia: 6,
        titulo: "Roma → Nápoles",
        paradas: ["Trem rápido Roma → Nápoles", "Check-in", "Centro histórico", "Spaccanapoli", "Pizza napolitana"],
        nota: "Cerca de 1h10–1h20 de trem.",
      },
      { dia: 7, titulo: "Pompeia e a orla", paradas: ["Pompeia em visita curta", "Orla de Nápoles", "Noite livre"] },
    ],
  },
  {
    id: "amalfi",
    titulo: "Costa Amalfitana",
    subtitulo: "Amalfi à beira-mar",
    dias: "Dias 8–9",
    base: "Amalfi",
    noites: 2,
    estadia: "Centro, perto do porto; Atrani fica a 10 min a pé.",
    itens: [
      {
        dia: 8,
        titulo: "Nápoles → Amalfi",
        paradas: ["Barco Nápoles → Amalfi", "Check-in", "Duomo de Amalfi", "Centro", "Noite livre"],
        nota: "1h30–2h de barco; conferir se o barco direto opera na data. Com mar agitado, trem até Salerno e ônibus ou transfer.",
      },
      { dia: 9, titulo: "Positano ou Ravello", paradas: ["Positano de barco ou Ravello", "Praia", "Noite livre"] },
    ],
  },
  {
    id: "sangiovanni",
    titulo: "San Giovanni Rotondo",
    subtitulo: "Santuário de Padre Pio",
    dias: "Dias 10–11",
    base: "San Giovanni Rotondo",
    noites: 2,
    estadia: "Perto do santuário, com estacionamento.",
    itens: [
      {
        dia: 10,
        titulo: "Rumo a San Giovanni Rotondo",
        paradas: ["Barco Amalfi → Salerno", "Retirar o carro em Salerno", "Estrada até San Giovanni Rotondo", "Primeira visita ao santuário"],
        nota: "Barco de ~35 min e 2h30–3h de estrada; começa aqui o trecho de carro.",
      },
      { dia: 11, titulo: "Padre Pio", paradas: ["Santuário de Padre Pio", "Monte Sant'Angelo (opcional)", "Noite livre"] },
    ],
  },
  {
    id: "umbria",
    titulo: "Assis",
    subtitulo: "São Francisco, Santa Clara e a Porciúncula",
    dias: "Dias 12–14",
    base: "Assis",
    noites: 3,
    estadia:
      "Centro histórico, entre a Basílica de São Francisco e a Piazza del Comune; Santa Maria degli Angeli como alternativa plana e com estacionamento.",
    itens: [
      {
        dia: 12,
        titulo: "San Giovanni Rotondo → Assis",
        paradas: ["Saída cedo", "Estrada para Assis", "Check-in", "Passeio leve"],
        nota: "4h30–5h de estrada; o centro de Assis é ZTL, estacionar fora das muralhas.",
      },
      { dia: 13, titulo: "São Francisco com calma", paradas: ["Basílica de São Francisco", "Centro medieval", "Piazza del Comune", "Noite livre"] },
      {
        dia: 14,
        titulo: "Santa Clara e a Porciúncula",
        paradas: ["Basílica de Santa Clara", "San Damiano", "Santa Maria degli Angeli (Porciúncula)", "Devolver o carro", "Trem de volta a Assis", "Noite livre"],
        nota: "Devolução em Perugia ou Foligno, a confirmar com a locadora (conferir o horário de fechamento); volta a Assis de trem; fim do trecho de carro.",
      },
    ],
  },
  {
    id: "toscana",
    titulo: "Florença",
    subtitulo: "Florença e Toscana",
    dias: "Dias 15–18",
    base: "Florença",
    noites: 4,
    estadia: "Santa Maria Novella, perto da estação.",
    itens: [
      {
        dia: 15,
        titulo: "Assis → Florença",
        paradas: ["Trem regional Assis → Florença", "Check-in", "Ponte Vecchio", "Noite livre"],
        nota: "Cerca de 2h30 de trem.",
      },
      {
        dia: 16,
        titulo: "Duomo e centro histórico",
        paradas: ["Duomo", "Batistério", "Piazza della Signoria", "Palazzo Vecchio", "Jantar em osteria"],
        nota: "A subida à Cúpula precisa de reserva antecipada.",
      },
      {
        dia: 17,
        titulo: "Uffizi, Santa Croce e pôr do sol",
        paradas: ["Galeria Uffizi", "Basílica de Santa Croce", "Piazzale Michelangelo", "Jantar em Oltrarno"],
        nota: "Uffizi cedo e com reserva.",
      },
      {
        dia: 18,
        titulo: "David e Chianti",
        paradas: ["Galeria da Academia", "Chianti", "Vinícola", "Degustação (adultos)", "Noite livre"],
        nota: "Experiência pensada para o grupo, com a criança de 11 anos.",
      },
    ],
  },
  {
    id: "cinque",
    titulo: "Cinque Terre",
    subtitulo: "Pisa e cinco vilas sobre o mar",
    dias: "Dias 19–21",
    base: "La Spezia",
    noites: 3,
    estadia: "Perto da estação La Spezia Centrale.",
    itens: [
      {
        dia: 19,
        titulo: "Pisa a caminho",
        paradas: ["Florença → Pisa", "Torre inclinada", "Pisa → La Spezia", "Noite livre"],
        nota: "Deixar as malas no guarda-volumes da estação de Pisa; cerca de 1h até Pisa e 1h–1h15 até La Spezia.",
      },
      { dia: 20, titulo: "Riomaggiore e Manarola", paradas: ["Trem a partir de La Spezia", "Riomaggiore", "Manarola", "Noite livre"] },
      { dia: 21, titulo: "Vernazza e Monterosso", paradas: ["Vernazza", "Monterosso", "Praia em Monterosso", "Noite livre"] },
    ],
  },
  {
    id: "norte",
    titulo: "Milão",
    subtitulo: "Milão e Lago di Como",
    dias: "Dias 22–24",
    base: "Milão",
    noites: 3,
    estadia: "Perto da Estação Central, de onde saem os trens para Como e Malpensa.",
    itens: [
      {
        dia: 22,
        titulo: "La Spezia → Milão",
        paradas: ["Intercity La Spezia → Milão", "Duomo", "Galleria Vittorio Emanuele II", "Noite livre"],
        nota: "3h–3h20 de trem.",
      },
      { dia: 23, titulo: "Milão", paradas: ["Castelo Sforzesco", "Brera", "Noite livre"] },
      { dia: 24, titulo: "Lago di Como", paradas: ["Bate-volta ao Lago di Como", "Retorno a Milão", "Compras", "Arrumar as malas"] },
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
        titulo: "Volta para casa",
        paradas: ["Trem a Malpensa", "Voo para o Brasil"],
        nota: "Cerca de 50 min até Malpensa; sair com folga.",
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
