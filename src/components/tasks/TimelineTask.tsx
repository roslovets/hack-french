import { useState } from 'react';

import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

import { mono } from '@/theme';
import type { TimelineStep } from '@/types';

import { Prompt, TaskHeader } from './parts';

type Role = 'fond' | 'event';
const ROLE_COLOR: Record<Role, string> = { fond: '#5b8cd6', event: '#e8b24a' };
const ROLE_LABEL: Record<Role, string> = {
  fond: 'фон · imparfait',
  event: 'щелчок · passé composé',
};

interface Props {
  step: TimelineStep;
  boss?: boolean;
  completed: boolean;
  onComplete: () => void;
}

export default function TimelineTask({ step, boss, completed, onComplete }: Props) {
  const [roles, setRoles] = useState<Record<number, Role>>(() =>
    completed ? Object.fromEntries(step.segments.map((s, i) => [i, s.role])) : {},
  );
  const [checked, setChecked] = useState(completed);
  const [solved, setSolved] = useState(completed);

  const allSet = step.segments.every((_, i) => roles[i] !== undefined);

  function cycle(i: number) {
    if (solved) return;
    setChecked(false);
    setRoles((prev) => ({ ...prev, [i]: prev[i] === 'fond' ? 'event' : 'fond' }));
  }

  function check() {
    setChecked(true);
    if (step.segments.every((s, i) => roles[i] === s.role)) {
      setSolved(true);
      onComplete();
    }
  }

  return (
    <Box>
      <TaskHeader kind={step.kind} boss={boss} />
      <Prompt>{step.prompt}</Prompt>

      <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
        {(['fond', 'event'] as Role[]).map((r) => (
          <Stack key={r} direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
            <Box
              sx={{ width: 12, height: 12, borderRadius: 0.5, backgroundColor: ROLE_COLOR[r] }}
            />
            <Typography variant="caption" color="text.secondary">
              {ROLE_LABEL[r]}
            </Typography>
          </Stack>
        ))}
      </Stack>

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1,
          p: 2,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          backgroundColor: (t) => alpha(t.palette.text.primary, 0.02),
          mb: 2,
        }}
      >
        {step.segments.map((seg, i) => {
          const role = roles[i];
          const wrong = checked && role !== undefined && role !== seg.role;
          const color = role ? ROLE_COLOR[role] : undefined;
          return (
            <Box
              key={i}
              role="button"
              tabIndex={solved ? -1 : 0}
              onClick={() => cycle(i)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  cycle(i);
                }
              }}
              sx={{
                px: 1.25,
                py: 0.75,
                borderRadius: 1.5,
                cursor: solved ? 'default' : 'pointer',
                fontFamily: mono,
                fontWeight: 600,
                fontSize: 15,
                border: '1.5px solid',
                borderColor: wrong ? 'error.main' : color ? alpha(color, 0.6) : 'divider',
                color: color ?? 'text.primary',
                backgroundColor: color ? alpha(color, 0.12) : 'transparent',
                transition: 'all 120ms ease',
              }}
            >
              {seg.text}
            </Box>
          );
        })}
      </Box>

      {checked && !solved ? (
        <Typography color="error" variant="body2" sx={{ mb: 1 }}>
          Не всё размечено верно. Кликай по словам, чтобы переключить фон ↔ щелчок.
        </Typography>
      ) : null}

      {!solved ? (
        <Stack direction="row" sx={{ justifyContent: 'flex-end' }}>
          <Button variant="contained" disabled={!allSet} onClick={check}>
            Проверить
          </Button>
        </Stack>
      ) : (
        <Alert
          icon={<CheckCircleOutlined fontSize="inherit" />}
          severity="success"
          variant="outlined"
          sx={{ borderRadius: 2 }}
        >
          {step.explanation}
        </Alert>
      )}
    </Box>
  );
}
