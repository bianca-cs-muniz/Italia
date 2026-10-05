import { styled } from "@mui/material/styles";

export const GradeDicas = styled("div")`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;

  .tip {
    background: var(--card);
    border: 1px solid var(--line);
    border-radius: 22px;
    padding: 26px 28px;
  }

  .tip h3 {
    font-family: var(--serif);
    font-weight: 500;
    font-size: 1.7rem;
    margin: 0 0 10px;
  }

  .tip p {
    margin: 0 0 10px;
    color: var(--muted);
  }

  .tip .sub {
    font-weight: 600;
    color: var(--ink);
    margin: 14px 0 8px;
    font-size: .95rem;
  }

  /* Lista numerada com os algarismos na fonte serifada. */
  .prio {
    margin: 0;
    padding: 0;
    list-style: none;
    counter-reset: p;
  }

  .prio li {
    counter-increment: p;
    display: flex;
    gap: 14px;
    align-items: baseline;
    padding: 7px 0;
    border-bottom: 1px dashed var(--line);
  }

  .prio li:last-child {
    border-bottom: 0;
  }

  .prio li::before {
    content: counter(p);
    font-family: var(--serif);
    font-size: 1.5rem;
    color: var(--maiolica);
    min-width: 1.2em;
  }

  .tip.wide {
    grid-column: 1 / -1;
  }

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;
