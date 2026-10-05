import { styled } from "@mui/material/styles";

// Primeira seção depois do hero: encosta mais no topo que as outras.
export const SecaoRoteiro = styled("section")`
  padding-top: 24px;
`;

export const ArtigoCapitulo = styled("article")`
  display: grid;
  grid-template-columns: minmax(240px, .8fr) 2fr;
  gap: 48px;
  padding: 56px 0;
  border-top: 1px solid var(--line);

  .ch-side {
    position: sticky;
    top: 96px;
    align-self: start;
  }

  .ch-days {
    display: inline-block;
    font-weight: 600;
    font-size: .88rem;
    color: var(--limone-ink);
    background: var(--limone);
    padding: 4px 12px;
    border-radius: 999px;
  }

  .ch-title {
    font-family: var(--serif);
    font-weight: 500;
    font-size: clamp(2.6rem, 5.5vw, 4.4rem);
    line-height: .95;
    margin: 14px 0 6px;
    letter-spacing: -.01em;
  }

  .ch-sub {
    font-family: var(--serif);
    font-style: italic;
    font-size: 1.2rem;
    color: var(--muted);
    margin: 0 0 18px;
  }

  .ch-base {
    font-size: .95rem;
    border-left: 3px solid var(--maiolica);
    padding: 2px 0 2px 14px;
    color: var(--muted);
  }

  .ch-base b {
    color: var(--ink);
    font-weight: 600;
  }

  .days {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 4px;
  }

  .day {
    display: grid;
    grid-template-columns: 72px 1fr;
    gap: 18px;
    padding: 18px 0;
    border-bottom: 1px dashed var(--line);
  }

  .day:last-child {
    border-bottom: 0;
  }

  .day-n {
    font-family: var(--serif);
    font-size: 2.6rem;
    line-height: .9;
    color: var(--maiolica);
    font-weight: 500;
  }

  .day-n small {
    display: block;
    font-family: var(--sans);
    font-size: .74rem;
    color: var(--muted);
    font-weight: 500;
    margin-bottom: 4px;
  }

  .day h3 {
    margin: 2px 0 8px;
    font-size: 1.15rem;
    font-weight: 700;
  }

  .day .note {
    margin: 10px 0 0;
    font-size: .92rem;
    color: var(--pino);
    font-style: italic;
  }

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    gap: 22px;
    padding: 44px 0;

    .ch-side {
      position: static;
    }
  }

  @media (max-width: 520px) {
    .day {
      grid-template-columns: 52px 1fr;
      gap: 12px;
    }

    .day-n {
      font-size: 2rem;
    }
  }
`;
