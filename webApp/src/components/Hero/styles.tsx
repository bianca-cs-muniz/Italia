import { styled } from "@mui/material/styles";

export const Cabecalho = styled("header")`
  padding: 48px 0 72px;

  .wrap {
    display: grid;
    grid-template-columns: 1.05fr .95fr;
    gap: 48px;
    align-items: center;
  }

  .who {
    color: var(--muted);
    font-size: 1.05rem;
    margin: 0 0 6px;
  }

  .title {
    font-family: var(--serif);
    font-weight: 500;
    font-size: clamp(5.2rem, 15vw, 11.5rem);
    line-height: .86;
    letter-spacing: -.02em;
    margin: 0;
    color: var(--maiolica);
  }

  .title .l {
    display: inline-block;
    transform: translateY(.5em);
    opacity: 0;
    animation: rise .9s cubic-bezier(.2, .8, .2, 1) forwards;
  }

  .title-2 {
    font-family: var(--serif);
    font-style: italic;
    font-size: clamp(1.9rem, 4.2vw, 3.1rem);
    line-height: 1.1;
    margin: .2em 0 .6em;
    opacity: 0;
    animation: fade .8s .55s forwards;
  }

  .goal {
    max-width: 44ch;
    font-size: 1.1rem;
    color: var(--muted);
    margin: 0 0 28px;
    opacity: 0;
    animation: fade .8s .75s forwards;
  }

  .facts {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1px;
    background: var(--line);
    border: 1px solid var(--line);
    border-radius: 18px;
    overflow: hidden;
    opacity: 0;
    animation: fade .8s .95s forwards;
  }

  .fact {
    background: var(--card);
    padding: 14px 16px;
  }

  .fact dt {
    font-size: .82rem;
    color: var(--muted);
  }

  .fact dd {
    margin: 2px 0 0;
    font-weight: 600;
    font-size: 1.02rem;
    line-height: 1.35;
  }

  .fact.money dd {
    font-family: var(--serif);
    font-size: 1.35rem;
    font-weight: 600;
    color: var(--maiolica);
  }

  /* Cartão do mapa */
  .mapcard {
    position: relative;
    border-radius: 28px;
    color: var(--on-blue);
    padding: 22px 22px 14px;
    box-shadow: var(--shadow);
    overflow: hidden;
    opacity: 0;
    transform: translateY(20px) scale(.98);
    animation: rise 1s .2s cubic-bezier(.2, .8, .2, 1) forwards;
  }

  .mapcard::after {
    content: "";
    position: absolute;
    inset: 0;
    background: radial-gradient(120% 80% at 80% 0%, transparent 40%, rgba(5, 15, 45, .55));
    pointer-events: none;
  }

  .mapcard h2 {
    position: relative;
    z-index: 1;
    margin: 0;
    font-family: var(--serif);
    font-weight: 500;
    font-size: 1.35rem;
  }

  .mapcard p {
    position: relative;
    z-index: 1;
    margin: 2px 0 0;
    font-size: .9rem;
    opacity: .75;
  }

  .route {
    position: relative;
    z-index: 1;
    width: 100%;
    height: auto;
    display: block;
    margin-top: 6px;
  }

  /* Começa escondido (traço maior que qualquer caminho do mapa) para não
     piscar inteiro antes de a animação medir o comprimento real. */
  .route .main {
    fill: none;
    stroke: var(--limone);
    stroke-width: 3.2;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-dasharray: 3000;
    stroke-dashoffset: 3000;
  }

  .route .spur {
    fill: none;
    stroke: #fff;
    stroke-width: 1.4;
    stroke-dasharray: 3 5;
    opacity: 0;
    transition: opacity .8s;
  }

  .route.drawn .spur {
    opacity: .7;
  }

  .stop {
    cursor: pointer;
    opacity: 0;
    transform-box: fill-box;
    transform-origin: center;
    transition: opacity .4s;
  }

  .stop.on {
    opacity: 1;
  }

  .stop .ring {
    fill: var(--maiolica-deep);
    stroke: #fff;
    stroke-width: 2.2;
    transition: r .25s, fill .25s;
  }

  .stop.base .ring {
    stroke: var(--limone);
    stroke-width: 3;
  }

  .stop:hover .ring,
  .stop:focus-visible .ring {
    fill: var(--limone);
    r: 8.5;
  }

  .stop text {
    fill: #fff;
    font-family: var(--sans);
    font-size: 13px;
    font-weight: 600;
    paint-order: stroke;
    stroke: rgba(10, 27, 71, .85);
    stroke-width: 4px;
    stroke-linejoin: round;
  }

  .stop text.d {
    font-size: 10.5px;
    font-weight: 500;
    fill: var(--limone);
  }

  /* O foco aparece no próprio ponto (anel amarelo cheio), não num retângulo. */
  .stop:focus {
    outline: none;
  }

  .train {
    fill: #fff;
    filter: drop-shadow(0 0 6px var(--limone));
  }

  .legend {
    position: relative;
    z-index: 1;
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    font-size: .8rem;
    opacity: .8;
    margin-top: 4px;
  }

  .legend span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .legend i {
    display: inline-block;
    width: 22px;
    height: 0;
    border-top: 3px solid var(--limone);
  }

  .legend i.spurl {
    border-top: 1.5px dashed #fff;
  }

  @media (max-width: 900px) {
    .wrap {
      grid-template-columns: 1fr;
      gap: 36px;
    }
  }
`;
