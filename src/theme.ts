import { createTheme, alpha } from '@mui/material/styles';

/**
 * "Dossier forensique" aesthetic: a French detective's case file meets an
 * engineer's terminal. The dominant note is an amber "evidence marker" on warm
 * ink, sharp red for bugs, a refined serif in headings against monospace
 * "evidence". The mood is film grain and a faint graph-paper grid.
 */

// Fonts
export const display = "'Playfair Display', Georgia, 'Times New Roman', serif";
const body = "'Manrope', system-ui, -apple-system, Segoe UI, sans-serif";
export const mono = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

// Palette
const amber = '#e8b24a'; // dominant accent — "evidence marker / phosphor"
const rouge = '#e5484d'; // sharp — bugs, anti-calques, errors
const sage = '#5bbf8f'; // functional — "solved"
const cobalt = '#5b8cd6'; // rare cold spark (tricolore)
const ink = '#0c0d11'; // warm ink
const paper = '#16171d';
const paperHi = '#1d1f28';
const border = '#2a2c38';
const textMain = '#ece7dc'; // warm paper
const textDim = '#9a9488';

const gridLine = alpha(textMain, 0.022);

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: amber, contrastText: '#1a1407' },
    secondary: { main: rouge },
    success: { main: sage },
    error: { main: rouge },
    info: { main: cobalt },
    warning: { main: '#cf8a4a' },
    background: { default: ink, paper },
    divider: border,
    text: { primary: textMain, secondary: textDim },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: body,
    h1: { fontFamily: display, fontWeight: 900, letterSpacing: '-0.02em' },
    h2: { fontFamily: display, fontWeight: 800, letterSpacing: '-0.015em' },
    h3: { fontFamily: display, fontWeight: 800, letterSpacing: '-0.01em' },
    h4: { fontFamily: display, fontWeight: 800, letterSpacing: '-0.01em' },
    h5: { fontFamily: display, fontWeight: 700 },
    h6: { fontFamily: body, fontWeight: 700, letterSpacing: '-0.01em' },
    button: { fontFamily: body, fontWeight: 700, textTransform: 'none' },
    overline: { fontFamily: mono, letterSpacing: '0.2em', fontWeight: 600, fontSize: 11 },
    caption: { letterSpacing: '0.01em' },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: ink,
          backgroundImage: `radial-gradient(820px 460px at 100% -6%, ${alpha(amber, 0.1)}, transparent 62%), radial-gradient(680px 420px at -8% 4%, ${alpha(rouge, 0.05)}, transparent 58%), linear-gradient(${gridLine} 1px, transparent 1px), linear-gradient(90deg, ${gridLine} 1px, transparent 1px)`,
          backgroundSize: 'auto, auto, 36px 36px, 36px 36px',
          backgroundRepeat: 'no-repeat, no-repeat, repeat, repeat',
        },
        '::selection': { background: alpha(amber, 0.32), color: textMain },
        '@media (prefers-reduced-motion: reduce)': {
          '*': { animationDuration: '0.001ms !important', animationDelay: '0ms !important' },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
        outlined: { borderColor: border },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0, variant: 'outlined' },
      styleOverrides: {
        root: {
          backgroundColor: paper,
          borderColor: border,
          transition: 'border-color 180ms ease, transform 180ms ease, box-shadow 180ms ease',
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 10, paddingInline: 20, paddingBlock: 8 },
      },
      variants: [
        {
          props: { variant: 'contained', color: 'primary' },
          style: {
            color: '#1a1407',
            boxShadow: `0 6px 22px ${alpha(amber, 0.28)}`,
            '&:hover': { boxShadow: `0 8px 26px ${alpha(amber, 0.4)}` },
          },
        },
      ],
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, borderRadius: 7 },
        outlined: { borderColor: border },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 999, backgroundColor: paperHi, height: 7 },
        bar: { borderRadius: 999 },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { backgroundColor: paperHi, border: `1px solid ${border}`, fontSize: 12 },
      },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0, color: 'transparent' },
    },
  },
});

export default theme;
