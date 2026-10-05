export interface IItemChecklist {
  // Id estável: é o que a API guarda e valida (não mude sem mudar a API).
  id: string;
  texto: string;
}

export const ITENS_CHECKLIST: IItemChecklist[] = [
  { id: "passaportes", texto: "Passaportes válidos para os 3" },
  { id: "regras-schengen", texto: "Verificar regras de entrada na Europa/Schengen perto da viagem" },
  { id: "etias", texto: "Verificar ETIAS quando a viagem estiver próxima" },
  { id: "seguro-viagem", texto: "Seguro viagem para os 3" },
  { id: "passagens", texto: "Passagens internacionais — preferir multi-city/open jaw" },
  { id: "hoteis", texto: "Reservar hotéis com quarto triplo e boa localização" },
  { id: "trens", texto: "Comprar trens com antecedência quando abrir a venda" },
  { id: "ingressos", texto: "Reservar Vaticano, Coliseu, Pompeia e atrações concorridas" },
  { id: "vendemmia", texto: "Reservar experiência na Toscana/vendemmia" },
  { id: "transporte-cinque-terre", texto: "Planejar transporte de Cinque Terre" },
  { id: "barco-amalfi", texto: "Reservar passeio de barco na Costa Amalfitana" },
  { id: "reserva-emergencia", texto: "Separar dinheiro/cartão para emergências" },
  { id: "esim", texto: "eSIM/chip internacional" },
  { id: "adaptador", texto: "Adaptador de tomada" },
  { id: "bagagem", texto: "Conferir política de bagagem das companhias aéreas" },
];

// Progresso "N de 15". Só contam ids que existem na lista (um id antigo ou
// repetido vindo do servidor não infla a conta).
export const calcularProgresso = (marcados: readonly string[], itens: readonly IItemChecklist[] = ITENS_CHECKLIST) => {
  const conjunto = new Set(marcados);
  const feitos = itens.filter((item) => conjunto.has(item.id)).length;
  const total = itens.length;
  return { feitos, total, percentual: total === 0 ? 0 : (feitos / total) * 100 };
};
