import { styled } from "@mui/material/styles";

export const CabecalhoLugares = styled("div")`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 34px 0 14px;

  h3 {
    margin: 0;
    font-family: var(--serif);
    font-weight: 500;
    font-size: 1.6rem;
  }

  .count {
    color: var(--muted);
    font-family: var(--sans);
    font-size: .9rem;
    margin-left: 8px;
  }
`;

export const Grade = styled("div")`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;

  .empty-note {
    grid-column: 1 / -1;
    color: var(--muted);
    font-size: .95rem;
    margin: 0;
  }

  @media (max-width: 520px) {
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
`;

// Fundo de azulejo com a inicial do lugar, para quem ainda não tem foto.
// Use junto com a classe global `tiles`.
export const Marcador = styled("span")`
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;

  span {
    font-family: var(--serif);
    font-style: italic;
    font-size: 4rem;
    color: var(--limone);
    text-shadow: 0 2px 20px rgba(0, 0, 0, .4);
  }

  &[data-grande] {
    position: absolute;
    inset: 0;
  }

  &[data-grande] span {
    font-size: 7rem;
  }
`;

// O cartão inteiro é um botão: dentro dele só há conteúdo de frase (spans).
export const Cartao = styled("button")`
  all: unset;
  box-sizing: border-box;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 20px;
  overflow: hidden;
  transition: transform .35s cubic-bezier(.2, .8, .2, 1), box-shadow .35s, border-color .35s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow);
    border-color: transparent;
  }

  &:focus-visible {
    outline: 3px solid var(--limone);
    outline-offset: 3px;
  }

  .media {
    display: block;
    position: relative;
    aspect-ratio: 4 / 3;
    overflow: hidden;
    background: var(--maiolica-deep);
  }

  .media img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform .8s cubic-bezier(.2, .8, .2, 1);
  }

  &:hover .media img {
    transform: scale(1.06);
  }

  .media .nimg {
    position: absolute;
    right: 10px;
    bottom: 10px;
    font-size: .75rem;
    font-weight: 600;
    background: rgba(10, 20, 50, .7);
    color: #fff;
    padding: 3px 9px;
    border-radius: 999px;
  }

  .pbody {
    padding: 14px 16px 16px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
  }

  .pbody .nome {
    margin: 4px 0 0;
    font-size: 1.08rem;
    font-weight: 700;
    line-height: 1.3;
    overflow-wrap: anywhere;
  }

  .pbody .resumo {
    margin: 0;
    font-size: .9rem;
    color: var(--muted);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .pbody .price {
    margin-top: auto;
    padding-top: 6px;
    font-weight: 600;
    font-size: .92rem;
  }

  @media (max-width: 520px) {
    .pbody {
      padding: 10px 12px 12px;
    }

    .pbody .resumo {
      display: none;
    }
  }
`;

export const BotaoAdicionar = styled("button")`
  all: unset;
  box-sizing: border-box;
  cursor: pointer;
  min-height: 220px;
  border: 2px dashed var(--line);
  border-radius: 20px;
  display: grid;
  place-items: center;
  text-align: center;
  color: var(--muted);
  padding: 20px;
  transition: border-color .25s, color .25s, background .25s;

  &:hover {
    border-color: var(--maiolica);
    color: var(--maiolica);
    background: color-mix(in srgb, var(--maiolica) 6%, transparent);
  }

  &:focus-visible {
    outline: 3px solid var(--limone);
    outline-offset: 3px;
  }

  .plus {
    font-family: var(--serif);
    font-size: 2.6rem;
    line-height: 1;
    display: block;
  }

  @media (max-width: 520px) {
    min-height: 160px;
  }
`;

/* ---------- Visualizador ---------- */

export const PainelGaleria = styled("div")`
  position: relative;
  background: var(--maiolica-deep);
  min-height: 340px;
  /* o gesto de arrastar para o lado troca a foto; rolar na vertical continua valendo */
  touch-action: pan-y;

  .slide {
    position: absolute;
    inset: 0;
    opacity: 0;
    transform: scale(1.04);
    transition: opacity .55s, transform 1.2s cubic-bezier(.2, .8, .2, 1);
  }

  .slide.active {
    opacity: 1;
    transform: none;
  }

  .slide img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .gnav {
    position: absolute;
    top: 50%;
    translate: 0 -50%;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: 0;
    background: rgba(255, 255, 255, .88);
    color: #0A1B47;
    cursor: pointer;
    display: grid;
    place-items: center;
    font-size: 1.3rem;
    transition: transform .2s;
  }

  .gnav:hover {
    transform: scale(1.08);
  }

  .gnav.prev {
    left: 14px;
  }

  .gnav.next {
    right: 14px;
  }

  .gcount {
    position: absolute;
    left: 16px;
    bottom: 14px;
    color: #fff;
    font-size: .82rem;
    font-weight: 600;
    background: rgba(6, 14, 38, .6);
    padding: 4px 10px;
    border-radius: 999px;
  }

  .dots {
    position: absolute;
    right: 16px;
    bottom: 16px;
    display: flex;
    gap: 6px;
  }

  .dots i {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: rgba(255, 255, 255, .45);
    transition: background .3s, width .3s;
  }

  .dots i.on {
    background: #fff;
    width: 20px;
    border-radius: 4px;
  }

  @media (max-width: 900px) {
    min-height: 0;
    aspect-ratio: 4 / 3;
  }
`;

export const Informacoes = styled("div")`
  padding: 30px 30px 26px;
  /* sem isto o item do grid cresce com o conteúdo e a rolagem nunca aparece */
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;

  .where {
    color: var(--muted);
    font-size: .9rem;
    margin: 0;
  }

  h2 {
    font-family: var(--serif);
    font-weight: 500;
    font-size: clamp(1.9rem, 3.4vw, 2.6rem);
    line-height: 1.05;
    margin: 0;
    overflow-wrap: anywhere;
  }

  .summary {
    font-family: var(--serif);
    font-style: italic;
    font-size: 1.15rem;
    margin: 0;
    color: var(--ink);
  }

  .pricebox {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    background: var(--paper-2);
    border-radius: 14px;
    padding: 12px 16px;
  }

  .pricebox b {
    font-size: 1.15rem;
  }

  .desc p {
    margin: 0 0 10px;
    color: var(--muted);
    font-size: .97rem;
    overflow-wrap: anywhere;
  }

  .dl {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin-top: auto;
    padding-top: 10px;
  }

  @media (max-width: 900px) {
    overflow: visible;
  }
`;

/* ---------- Formulário ---------- */

export const Formulario = styled("form")`
  padding: 30px;
  /* sem isto o item do grid cresce com o conteúdo e a rolagem nunca aparece */
  min-height: 0;
  overflow-y: auto;
  display: grid;
  gap: 16px;

  h2 {
    font-family: var(--serif);
    font-weight: 500;
    font-size: 2rem;
    margin: 0;
  }

  .row2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }

  .f {
    display: grid;
    gap: 6px;
    font-weight: 600;
    font-size: .9rem;
  }

  .f small {
    font-weight: 400;
    color: var(--muted);
  }

  .f input,
  .f select,
  .f textarea {
    font: inherit;
    font-weight: 400;
    font-size: 1rem;
    color: var(--ink);
    background: var(--paper);
    border: 1px solid var(--line);
    border-radius: 12px;
    padding: 11px 13px;
    width: 100%;
  }

  /* Aviso curto logo abaixo de um campo. */
  .aviso {
    margin: 6px 0 0;
    font-size: .85rem;
    color: var(--muted);
  }

  .f textarea {
    resize: vertical;
    min-height: 90px;
  }

  .f input:focus,
  .f select:focus,
  .f textarea:focus {
    outline: 2px solid var(--maiolica);
    outline-offset: 1px;
  }

  .form-actions {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    flex-wrap: wrap;
  }

  .form-actions .principais {
    display: flex;
    gap: 10px;
  }

  @media (max-width: 900px) {
    .row2 {
      grid-template-columns: 1fr;
    }
  }
`;

export const AreaFotos = styled("div")`
  display: grid;
  gap: 8px;

  .rotulo {
    font-weight: 600;
    font-size: .9rem;
  }

  .drop {
    border: 2px dashed var(--line);
    border-radius: 16px;
    padding: 18px;
    text-align: center;
    color: var(--muted);
    cursor: pointer;
    transition: border-color .2s, background .2s;
  }

  .drop.over,
  .drop:hover {
    border-color: var(--maiolica);
    background: color-mix(in srgb, var(--maiolica) 6%, transparent);
  }

  .drop[aria-disabled="true"] {
    opacity: .6;
    cursor: not-allowed;
  }

  .thumbs {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .thumb {
    position: relative;
    width: 96px;
    height: 72px;
    border-radius: 10px;
    overflow: hidden;
    background: var(--paper-2);
  }

  .thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .thumb button {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 22px;
    height: 22px;
    padding: 0;
    border-radius: 50%;
    border: 0;
    background: rgba(6, 14, 38, .75);
    color: #fff;
    cursor: pointer;
    font-size: .8rem;
    line-height: 1;
  }
`;
