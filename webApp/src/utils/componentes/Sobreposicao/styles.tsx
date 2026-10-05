import { styled } from "@mui/material/styles";

// O próprio <dialog> ocupa a tela inteira e faz o papel do fundo escurecido
// (assim o escurecimento também tem transição); a folha é o cartão no centro.
export const Dialogo = styled("dialog")`
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  max-width: none;
  max-height: none;
  margin: 0;
  padding: 24px;
  border: 0;
  overflow: hidden;
  place-items: center;
  background: rgba(6, 14, 38, 0);
  color: var(--ink);
  transition: background .35s;

  &[open] {
    display: grid;
  }

  &::backdrop {
    background: transparent;
  }

  &[data-aberta] {
    background: rgba(6, 14, 38, .62);
  }

  &:focus-visible {
    outline: none;
  }

  &[data-aberta] > div:first-of-type {
    opacity: 1;
    transform: none;
  }

  @media (max-width: 900px) {
    padding: 12px;
    align-items: end;
  }
`;

export const Folha = styled("div")`
  position: relative;
  width: min(1040px, 100%);
  max-height: min(88vh, 860px);
  background: var(--card);
  border-radius: 28px;
  overflow: hidden;
  display: grid;
  grid-template-columns: 1.25fr 1fr;
  /* a linha fica presa à altura máxima da folha: quem rola é o conteúdo de dentro */
  grid-template-rows: minmax(0, 1fr);
  box-shadow: 0 40px 120px -30px rgba(0, 0, 0, .6);
  opacity: 0;
  transform: scale(.88) translateY(20px);
  transition: opacity .35s, transform .5s cubic-bezier(.2, .9, .2, 1);

  &[data-estreita] {
    grid-template-columns: 1fr;
    width: min(680px, 100%);
  }

  .x {
    position: absolute;
    top: 14px;
    right: 14px;
    z-index: 3;
    width: 42px;
    height: 42px;
    border-radius: 50%;
    border: 0;
    background: rgba(255, 255, 255, .9);
    color: #0A1B47;
    cursor: pointer;
    font-size: 1.4rem;
    line-height: 1;
    display: grid;
    place-items: center;
    transition: transform .25s;
  }

  .x:hover {
    transform: rotate(90deg);
  }

  .x[aria-disabled="true"] {
    opacity: .5;
    cursor: wait;
    transform: none;
  }

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    /* no celular a própria folha rola; linhas automáticas para não esmagar a galeria */
    grid-template-rows: none;
    max-height: 92vh;
    overflow-y: auto;
  }
`;
