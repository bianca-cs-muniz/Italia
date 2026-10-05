import { styled } from "@mui/material/styles";

export const AvisoToast = styled("div")`
  position: fixed;
  left: 50%;
  bottom: calc(24px + env(safe-area-inset-bottom, 0px));
  translate: -50% 20px;
  z-index: 200;
  max-width: calc(100% - 32px);
  padding: 12px 20px;
  border-radius: 999px;
  background: var(--ink);
  color: var(--paper);
  font-weight: 500;
  font-size: .95rem;
  opacity: 0;
  pointer-events: none;
  transition: opacity .3s, translate .3s;

  &[data-visivel] {
    opacity: 1;
    translate: -50% 0;
  }
`;
