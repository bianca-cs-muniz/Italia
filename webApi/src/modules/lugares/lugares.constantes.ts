// Trechos da viagem e tipos de lugar aceitos. O front usa exatamente os
// mesmos valores (os nomes exibidos de cada trecho ficam lá); aqui eles só
// servem para validar a entrada (ver dtos/salvar.dto.ts).
export const TRECHOS = ["roma", "napoles", "amalfi", "sangiovanni", "umbria", "toscana", "cinque", "norte"] as const;

export const TIPOS_DE_LUGAR = ["Hospedagem", "Atração", "Restaurante", "Experiência", "Outro"] as const;
