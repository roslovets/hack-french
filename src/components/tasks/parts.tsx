import { Box, Chip, Stack, Typography, type SxProps, type Theme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import type { SystemStyleObject } from '@mui/system';

import { mono } from '@/theme';
import type { TaskKind } from '@/types';

import { taskMeta, toneColor } from './taskMeta';

/** Mechanic badge: icon + label. */
export function TaskHeader({ kind, boss }: { kind: TaskKind; boss?: boolean }) {
  const meta = taskMeta[kind];
  const color = toneColor[meta.tone];
  const Icon = meta.icon;
  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{ mb: 2, flexWrap: 'wrap', gap: 1, alignItems: 'center' }}
    >
      <Chip
        icon={<Icon sx={{ fontSize: 18, color: `${color} !important` }} />}
        label={meta.label}
        size="small"
        variant="outlined"
        sx={{
          color,
          borderColor: alpha(color, 0.4),
          backgroundColor: alpha(color, 0.1),
          fontWeight: 700,
          letterSpacing: '0.02em',
        }}
      />
      {boss ? (
        <Chip
          label="BOSS"
          size="small"
          sx={{
            backgroundColor: alpha('#e5484d', 0.16),
            color: '#ff8f8f',
            fontWeight: 800,
            letterSpacing: '0.12em',
          }}
        />
      ) : null}
    </Stack>
  );
}

/** A French phrase in monospace (clue / breakdown). */
export function FrPhrase({
  text,
  size = 'md',
  dim = false,
  sx,
}: {
  text: string;
  size?: 'sm' | 'md' | 'lg';
  dim?: boolean;
  sx?: SxProps<Theme>;
}) {
  const fontSize = size === 'lg' ? 22 : size === 'sm' ? 14 : 17;
  const parts = text.split('___');
  return (
    <Box
      sx={[
        {
          fontFamily: mono,
          fontSize,
          fontWeight: 500,
          lineHeight: 1.5,
          color: dim ? 'text.secondary' : 'text.primary',
          px: 2,
          py: 1.25,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          borderLeft: '3px solid',
          borderLeftColor: 'primary.main',
          backgroundColor: (t) => alpha(t.palette.primary.main, 0.05),
          overflowWrap: 'anywhere',
        },
        ...((Array.isArray(sx) ? sx : sx ? [sx] : []) as SystemStyleObject<Theme>[]),
      ]}
    >
      {parts.map((part, i) => (
        <Box component="span" key={i}>
          {part}
          {i < parts.length - 1 ? (
            <Box
              component="span"
              sx={{
                display: 'inline-block',
                minWidth: 44,
                textAlign: 'center',
                mx: 0.5,
                px: 1,
                borderRadius: 1,
                color: 'secondary.main',
                backgroundColor: (t) => alpha(t.palette.secondary.main, 0.14),
                borderBottom: '2px solid',
                borderColor: 'secondary.main',
              }}
            >
              ___
            </Box>
          ) : null}
        </Box>
      ))}
    </Box>
  );
}

/** Instruction caption above the options. */
export function Prompt({ children }: { children: React.ReactNode }) {
  return (
    <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, lineHeight: 1.35 }}>
      {children}
    </Typography>
  );
}
