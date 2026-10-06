import { styled } from "@mui/material/styles";

export const Barras = styled("div")`
  display: grid;
  gap: 14px;

  .brow {
    display: grid;
    grid-template-columns: 200px 1fr 170px;
    gap: 18px;
    align-items: center;
  }

  .brow .lbl {
    font-weight: 600;
  }

  .brow .val {
    text-align: right;
    font-variant-numeric: tabular-nums;
    color: var(--muted);
  }

  .track {
    position: relative;
    height: 14px;
    border-radius: 999px;
    background: var(--paper-2);
    overflow: hidden;
  }

  .fill {
    position: absolute;
    top: 0;
    bottom: 0;
    border-radius: 999px;
    background: linear-gradient(90deg, var(--maiolica) 0%, var(--maiolica) 60%, color-mix(in srgb, var(--maiolica) 45%, transparent) 100%);
    width: 0;
    transition: width 1.2s cubic-bezier(.2, .8, .2, 1), left 1.2s cubic-bezier(.2, .8, .2, 1);
  }

  /* O texto de apoio vem logo depois do total, fora desta grade. */
  @media (max-width: 900px) {
    .brow {
      grid-template-columns: 1fr auto;
      gap: 6px 12px;
    }

    .brow .track {
      grid-column: 1 / -1;
      grid-row: 2;
    }
  }
`;

export const Total = styled("div")`
  margin-top: 28px;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  padding: 26px 28px;
  border-radius: 24px;
  color: var(--on-blue);

  .t1 {
    font-family: var(--serif);
    font-size: 1.4rem;
    font-style: italic;
  }

  .t2 {
    font-family: var(--serif);
    font-size: clamp(2rem, 5vw, 3.2rem);
    color: var(--limone);
    font-weight: 600;
    line-height: 1;
  }

  & + .fine {
    color: var(--muted);
    font-size: .9rem;
    margin-top: 14px;
    max-width: 70ch;
  }
`;

/* Estimativa de um trecho do roteiro: bloco à parte, sem o cartão de total. */
export const Trecho = styled("div")`
  margin-top: 44px;
  padding-top: 32px;
  border-top: 1px solid var(--line);

  h3 {
    font-family: var(--serif);
    font-weight: 500;
    font-size: 1.4rem;
    line-height: 1.2;
    margin: 0;
  }

  .apoio {
    color: var(--muted);
    margin: 6px 0 22px;
    max-width: 70ch;
  }

  .total-trecho {
    margin: 18px 0 0;
    text-align: right;
    color: var(--muted);
    font-variant-numeric: tabular-nums;
  }

  .total-trecho b {
    font-weight: 600;
    margin-left: 8px;
  }

  .nota {
    color: var(--muted);
    font-size: .9rem;
    margin: 10px 0 0;
    max-width: 70ch;
  }
`;
