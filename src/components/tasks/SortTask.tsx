import { useMemo, useState } from 'react';

import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import {
  Alert,
  Box,
  Button,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';

import { mono } from '@/theme';
import type { SortStep } from '@/types';

import { seededShuffle } from '@/lib/shuffle';

import { Prompt, TaskHeader } from './parts';

interface Props {
  step: SortStep;
  boss?: boolean;
  completed: boolean;
  onComplete: () => void;
  shuffleKey?: string;
}

export default function SortTask({ step, boss, completed, onComplete, shuffleKey }: Props) {
  const items = useMemo(
    () => seededShuffle(step.items, `${shuffleKey ?? step.id}-items`),
    [shuffleKey, step.id, step.items],
  );

  const [assign, setAssign] = useState<Record<number, string>>(() =>
    completed ? Object.fromEntries(items.map((it, i) => [i, it.basket])) : {},
  );
  const [checked, setChecked] = useState(completed);
  const [solved, setSolved] = useState(completed);

  const allAssigned = items.every((_, i) => assign[i] !== undefined);

  function check() {
    setChecked(true);
    if (items.every((it, i) => assign[i] === it.basket)) {
      setSolved(true);
      onComplete();
    }
  }

  return (
    <Box>
      <TaskHeader kind={step.kind} boss={boss} />
      <Prompt>{step.prompt}</Prompt>

      <Stack spacing={1.25}>
        {items.map((item, i) => {
          const value = assign[i];
          const isWrong = checked && value !== undefined && value !== item.basket;
          const isRight = checked && value === item.basket;
          let borderColor = 'divider';
          if (isRight) borderColor = 'success.main';
          else if (isWrong) borderColor = 'error.main';

          return (
            <Box
              key={item.text}
              sx={{
                p: 1.5,
                borderRadius: 2,
                border: '1.5px solid',
                borderColor,
                backgroundColor: (t) =>
                  isRight
                    ? alpha(t.palette.success.main, 0.06)
                    : isWrong
                      ? alpha(t.palette.error.main, 0.05)
                      : 'transparent',
              }}
            >
              <Typography sx={{ fontFamily: mono, fontWeight: 500, mb: 1.25 }}>
                {item.text}
              </Typography>
              <ToggleButtonGroup
                exclusive
                size="small"
                value={value ?? null}
                onChange={(_, v: string | null) => {
                  if (solved || v === null) return;
                  setAssign((prev) => ({ ...prev, [i]: v }));
                }}
                sx={{ flexWrap: 'wrap', gap: 1 }}
              >
                {step.baskets.map((b) => (
                  <ToggleButton
                    key={b.id}
                    value={b.id}
                    sx={{
                      textTransform: 'none',
                      borderRadius: '999px !important',
                      border: '1px solid',
                      borderColor: 'divider',
                      px: 1.75,
                    }}
                  >
                    {b.label}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>
          );
        })}
      </Stack>

      {checked && !solved ? (
        <Typography color="error" variant="body2" sx={{ mt: 2 }}>
          Не всё разложено верно. Исправь красные и проверь снова.
        </Typography>
      ) : null}

      {!solved ? (
        <Stack direction="row" sx={{ mt: 2, justifyContent: 'flex-end' }}>
          <Button variant="contained" disabled={!allAssigned} onClick={check}>
            Проверить
          </Button>
        </Stack>
      ) : (
        <Alert
          icon={<CheckCircleOutlined fontSize="inherit" />}
          severity="success"
          variant="outlined"
          sx={{ mt: 2, borderRadius: 2 }}
        >
          {step.explanation}
        </Alert>
      )}
    </Box>
  );
}
