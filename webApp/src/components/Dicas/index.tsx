"use client";

import React from "react";
import { EVITAR_COM_CRIANCA, PRIORIDADES, PRIORIZAR_COM_CRIANCA } from "@/dados/dicas";
import { classeRevelar, useRevelar } from "@/shared/components/useRevelar";
import { GradeDicas } from "./styles";

// Cada cartão entra em cena por conta própria ao rolar.
const Dica = ({ titulo, children }: { titulo: string; children: React.ReactNode }) => {
  const { ref, visivel } = useRevelar<HTMLDivElement>();
  return (
    <div ref={ref} className={classeRevelar(visivel, "tip")}>
      <h3>{titulo}</h3>
      {children}
    </div>
  );
};

const Etiquetas = ({ itens }: { itens: string[] }) => (
  <div className="chips">
    {itens.map((item) => (
      <span key={item} className="chip">
        {item}
      </span>
    ))}
  </div>
);

export const Dicas = () => {
  const { ref: refCabecalho, visivel: cabecalhoVisivel } = useRevelar<HTMLDivElement>();

  return (
    <section id="dicas">
      <div className="wrap">
        <div ref={refCabecalho} className={classeRevelar(cabecalhoVisivel, "sec-head")}>
          <h2>Para lembrar</h2>
        </div>
        <GradeDicas>
          <Dica titulo="Pensando na criança">
            <p className="sub">Priorizar</p>
            <Etiquetas itens={PRIORIZAR_COM_CRIANCA} />
            <p className="sub">Evitar</p>
            <Etiquetas itens={EVITAR_COM_CRIANCA} />
          </Dica>
          <Dica titulo="Prioridades">
            <ol className="prio">
              {PRIORIDADES.map((prioridade) => (
                <li key={prioridade}>{prioridade}</li>
              ))}
            </ol>
          </Dica>
          <Dica titulo="Transporte">
            <p>
              Trem entre as grandes cidades e em Cinque Terre. Barco de Nápoles a Amalfi e de Amalfi a Salerno. Carro alugado só de
              Salerno a Assis, passando por San Giovanni Rotondo: retirar em Salerno no dia 10 e devolver perto de Assis (Perugia ou
              Foligno) no dia 14.
            </p>
            <p>
              Conte com pedágios; o centro de Assis é ZTL, estacione fora das muralhas. Voo multi-city: chegada por Roma, volta por
              Milão (Malpensa). Não vale alugar carro ou moto para a viagem inteira.
            </p>
          </Dica>
          <Dica titulo="Comida">
            <p>Meta prática de R$ 300–450 por dia para os três. Almoço mais simples, alguns jantares especiais.</p>
            <p>
              Confira o <em>coperto</em> no cardápio antes de sentar. Gorjeta não funciona como nos EUA: os 15–20% não são obrigatórios.
            </p>
          </Dica>
        </GradeDicas>
      </div>
    </section>
  );
};
