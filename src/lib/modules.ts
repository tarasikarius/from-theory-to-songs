/** One colour per course module (1–10). The introduction (0) and appendices (11) use the neutral soft fill. */
const COLORS = ['', '#ff8a7a', '#ffb14a', '#ffd84a', '#b9e24a', '#5fdda0', '#4fd6d6', '#7dbbff', '#a9a8ff', '#cf9bff', '#ff96d5'];

/** Inline style that sets --mod for a module's dot and accents. */
export const modStyle = (module: number): string | undefined => (COLORS[module] ? `--mod: ${COLORS[module]}` : undefined);

/** Module number as shown in a dot: 1–10, or nothing for the introduction and appendices. */
export const modLabel = (module: number): string => (module >= 1 && module <= 10 ? String(module) : '');
