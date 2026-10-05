// Promessa controlada pelo teste: resolve ou rejeita quando o teste mandar.
// Serve para simular respostas da API que chegam fora de ordem.
export const adiada = <T>() => {
  let resolver!: (valor: T) => void;
  let rejeitar!: (motivo: unknown) => void;
  const promessa = new Promise<T>((res, rej) => {
    resolver = res;
    rejeitar = rej;
  });
  return { promessa, resolver, rejeitar };
};
