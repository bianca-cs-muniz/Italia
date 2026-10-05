// Regras puras do roteiro, separadas dos componentes para poderem ser
// testadas sem DOM.

// "1 noite", "3 noites".
export const textoNoites = (noites: number): string => `${noites} ${noites === 1 ? "noite" : "noites"}`;
