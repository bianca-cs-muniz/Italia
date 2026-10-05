import { styled } from "@mui/material/styles";

export const Progresso = styled("div")`
  display: flex;
  align-items: center;
  gap: 14px;
  color: var(--muted);

  .bar {
    width: 180px;
    height: 8px;
    border-radius: 999px;
    background: var(--paper-2);
    overflow: hidden;
  }

  .bar i {
    display: block;
    height: 100%;
    width: 0;
    background: var(--limone);
    transition: width .6s;
  }
`;

export const ListaChecklist = styled("div")`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 10px;

  .check {
    display: flex;
    gap: 14px;
    align-items: center;
    padding: 14px 16px;
    border-radius: 16px;
    background: var(--card);
    border: 1px solid var(--line);
    cursor: pointer;
    transition: background .25s, border-color .25s;
  }

  /* A caixa nativa fica invisível, mas continua recebendo foco e teclado. */
  .check input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }

  .box {
    flex: none;
    width: 26px;
    height: 26px;
    border-radius: 8px;
    border: 2px solid var(--line);
    display: grid;
    place-items: center;
    transition: background .25s, border-color .25s, transform .25s;
  }

  .box svg {
    width: 16px;
    height: 16px;
    stroke: var(--limone-ink);
    stroke-width: 3;
    fill: none;
    stroke-dasharray: 24;
    stroke-dashoffset: 24;
    transition: stroke-dashoffset .35s .05s;
  }

  .check.done {
    background: color-mix(in srgb, var(--limone) 14%, var(--card));
    border-color: color-mix(in srgb, var(--limone) 60%, var(--line));
  }

  .check.done .box {
    background: var(--limone);
    border-color: var(--limone);
    transform: scale(1.06);
  }

  .check.done .box svg {
    stroke-dashoffset: 0;
  }

  .check.done .ctext {
    color: var(--muted);
    text-decoration: line-through;
    text-decoration-color: color-mix(in srgb, var(--muted) 60%, transparent);
  }

  .check:has(input:disabled) {
    cursor: progress;
  }

  .check:has(input:focus-visible) {
    outline: 3px solid var(--limone);
    outline-offset: 2px;
  }
`;
