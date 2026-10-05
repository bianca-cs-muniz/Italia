// Milhar com ponto, feito à mão: `toLocaleString` depende do ICU do ambiente e
// poderia sair diferente no servidor e no navegador (erro de hidratação).
export const formatarMilhar = (valor: number): string => String(Math.round(valor)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

// 12000 -> "R$ 12.000"
export const formatarReais = (valor: number): string => `R$ ${formatarMilhar(valor)}`;

// (12000, 18000) -> "R$ 12.000–18.000"
export const formatarFaixaReais = (minimo: number, maximo: number): string => `${formatarReais(minimo)}–${formatarMilhar(maximo)}`;
