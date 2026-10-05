import { styled } from "@mui/material/styles";

// Em telas estreitas a tabela rola para o lado dentro do contorno.
export const ContornoTabela = styled("div")`
  overflow-x: auto;
  border: 1px solid var(--line);
  border-radius: 20px;
  background: var(--card);

  table {
    border-collapse: collapse;
    width: 100%;
    min-width: 560px;
  }

  th,
  td {
    text-align: left;
    padding: 16px 20px;
    border-bottom: 1px solid var(--line);
    vertical-align: top;
  }

  tr:last-child td {
    border-bottom: 0;
  }

  th {
    font-size: .85rem;
    color: var(--muted);
    font-weight: 600;
  }

  td.city {
    font-family: var(--serif);
    font-size: 1.35rem;
  }

  td.n {
    font-family: var(--serif);
    font-size: 1.6rem;
    color: var(--maiolica);
    width: 90px;
  }
`;
