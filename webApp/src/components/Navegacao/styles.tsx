import { styled } from "@mui/material/styles";

export const Barra = styled("nav")`
  position: sticky;
  top: env(safe-area-inset-top, 0px);
  z-index: 40;
  backdrop-filter: saturate(1.4) blur(14px);
  -webkit-backdrop-filter: saturate(1.4) blur(14px);
  background: color-mix(in srgb, var(--paper) 78%, transparent);
  border-bottom: 1px solid transparent;
  transition: border-color .3s;

  &[data-rolou] {
    border-bottom-color: var(--line);
  }

  .wrap {
    display: flex;
    align-items: center;
    gap: 20px;
    height: 64px;
  }

  .brand {
    font-family: var(--serif);
    font-style: italic;
    font-size: 1.45rem;
    text-decoration: none;
    color: var(--ink);
    white-space: nowrap;
  }

  .nav-links {
    display: flex;
    gap: 4px;
    margin-left: auto;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .nav-links::-webkit-scrollbar {
    display: none;
  }

  .nav-links a {
    text-decoration: none;
    color: var(--muted);
    font-weight: 500;
    font-size: .95rem;
    padding: 8px 12px;
    border-radius: 999px;
    white-space: nowrap;
    transition: background .2s, color .2s;
  }

  .nav-links a:hover,
  .nav-links a.active {
    color: var(--ink);
    background: var(--paper-2);
  }

  @media (max-width: 520px) {
    .brand {
      font-size: 1.2rem;
    }
  }
`;
