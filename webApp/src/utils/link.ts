// O que a pessoa digitou no campo "Link" -> o que vai para a API: vazio
// continua vazio; sem protocolo ganha "https://".
export const normalizarLink = (texto: string): string => {
  const link = texto.trim();
  if (!link) return "";
  return /^https?:\/\//i.test(link) ? link : `https://${link}`;
};

// Só http(s) vira href clicável. Qualquer outra coisa (javascript:, data:,
// texto solto) devolve null e o botão "Abrir link" não aparece.
export const linkSeguro = (link: string | null | undefined): string | null => {
  if (!link) return null;
  try {
    const url = new URL(link);
    return url.protocol === "http:" || url.protocol === "https:" ? link : null;
  } catch {
    return null;
  }
};
