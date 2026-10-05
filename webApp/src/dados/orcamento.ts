export interface IFaixaOrcamento {
  rotulo: string;
  minimo: number;
  maximo: number;
}

// Faixas estimadas para os três viajantes, em reais.
export const ORCAMENTO: IFaixaOrcamento[] = [
  { rotulo: "Passagens aéreas", minimo: 12000, maximo: 18000 },
  { rotulo: "Hospedagem", minimo: 13000, maximo: 18000 },
  { rotulo: "Alimentação", minimo: 6300, maximo: 9500 },
  { rotulo: "Transporte", minimo: 4000, maximo: 5500 },
  { rotulo: "Passeios e ingressos", minimo: 3500, maximo: 5000 },
  { rotulo: "Seguro e documentos", minimo: 1000, maximo: 1500 },
  { rotulo: "Extras e emergências", minimo: 5000, maximo: 7000 },
];

// Valor que corresponde à barra cheia (100% do trilho).
export const TETO_ORCAMENTO = 20000;

export const META_ORCAMENTO = "R$ 55.000–60.000";

const limitar = (valor: number) => Math.min(100, Math.max(0, valor));

// A barra vai de zero até o máximo da faixa; a parte de zero até o mínimo fica
// esmaecida. `largura` é % do trilho e `inicioFaixa` é % da própria barra onde
// começa a parte cheia (do mínimo ao máximo).
export const calcularBarra = (minimo: number, maximo: number, teto: number = TETO_ORCAMENTO) => {
  if (teto <= 0 || maximo <= 0) return { largura: 0, inicioFaixa: 0 };
  return {
    largura: limitar((maximo / teto) * 100),
    inicioFaixa: limitar((minimo / maximo) * 100),
  };
};
