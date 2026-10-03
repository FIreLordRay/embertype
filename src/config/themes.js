/**
 * Theme registry. JavaScript only needs the ids and labels: the colours, fonts and effects
 * live in src/index.css as CSS variables, so there's one source of truth for how a theme looks.
 */
export const THEMES = [
  { id: 'ember', label: 'ember' },
  { id: 'dark', label: 'dark' },
  { id: 'cyberpunk', label: 'cyberpunk' },
  { id: 'vintage', label: 'vintage' },
]

export const THEME_IDS = THEMES.map((theme) => theme.id)
