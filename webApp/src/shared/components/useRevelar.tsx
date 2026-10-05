"use client";

import { useEffect, useRef, useState } from "react";

// Fração do elemento que precisa estar na tela para ele entrar em cena.
const FRACAO_VISIVEL = 0.12;
// Fração usada no lugar da de cima quando o elemento é alto demais para alcançá-la.
const FRACAO_MINIMA = 0.02;

// Classe do elemento que entra em cena ao rolar (estilos em globals.css).
export const classeRevelar = (visivel: boolean, outras = "") => `${outras} reveal${visivel ? " in" : ""}`.trim();

// Regra de entrada, separada para poder ser testada: 12% do elemento visível.
// Um bloco tão alto que 12% dele não cabem na tela (um trecho com muitos
// lugares) nunca chegaria lá; para ele bastam 2%.
export const deveRevelar = (fracaoVisivel: number, alturaElemento: number, alturaTela: number): boolean => {
  if (fracaoVisivel >= FRACAO_VISIVEL) return true;
  const altoDemais = alturaElemento * FRACAO_VISIVEL > alturaTela;
  return altoDemais && fracaoVisivel >= FRACAO_MINIMA;
};

// Marca o elemento como visível na primeira vez que ele entra na tela e para
// de observar. Uso: `const { ref, visivel } = useRevelar<HTMLDivElement>()`.
export const useRevelar = <T extends Element>() => {
  const ref = useRef<T>(null);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const elemento = ref.current;
    if (!elemento) return;

    const observador = new IntersectionObserver(
      (entradas) => {
        const entrou = entradas.some((entrada) => {
          if (!entrada.isIntersecting) return false;
          const alturaTela = entrada.rootBounds?.height ?? window.innerHeight;
          return deveRevelar(entrada.intersectionRatio, entrada.boundingClientRect.height, alturaTela);
        });
        if (!entrou) return;
        setVisivel(true);
        observador.disconnect();
      },
      { threshold: [FRACAO_MINIMA, FRACAO_VISIVEL], rootMargin: "0px 0px -40px 0px" },
    );
    observador.observe(elemento);
    return () => observador.disconnect();
  }, []);

  return { ref, visivel };
};
