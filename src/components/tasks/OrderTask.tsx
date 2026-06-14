import { useMemo, useState } from 'react';

import ArrowDownwardOutlined from '@mui/icons-material/ArrowDownwardOutlined';
import ArrowUpwardOutlined from '@mui/icons-material/ArrowUpwardOutlined';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import { Alert, Box, Button, IconButton, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

import { mono } from '@/theme';
import type { OrderStep } from '@/types';

import { seededShuffle } from '@/lib/shuffle';

import { Prompt, TaskHeader } from './parts';

interface Props {
  step: OrderStep;
  boss?: boolean;
  completed: boolean;
  onComplete: () => void;
}

export default function OrderTask({ step, boss, completed, onComplete }: Props) {
  const shuffled = useMemo(
    () => seededShuffle(step.items, `${step.id}-ord`),
    [step.id, step.items],
  );
  const [order, setOrder] = useState<string[]>(() => (completed ? step.items.slice() : shuffled));
  const [checked, setChecked] = useState(completed);
  const [solved, setSolved] = useState(completed);

  function move(index: number, dir: -1 | 1) {
    if (solved) return;
    const target = index + dir;
    if (target < 0 || target >= order.length) return;
    setChecked(false);
    setOrder((prev) => {
      const next = prev.slice();
      const a = next[index] as string;
      const b = next[target] as string;
      next[index] = b;
      next[target] = a;
      return next;
    });
  }

  function check() {
    setChecked(true);
    if (order.every((t, i) => t === step.items[i])) {
      setSolved(true);
      onComplete();
    }
  }

  return (
    <Box>
      <TaskHeader kind={step.kind} boss={boss} />
      <Prompt>{step.prompt}</Prompt>

      <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 1, px: 0.5 }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
          ↑ {step.scaleLow}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
          {step.scaleHigh} ↓
        </Typography>
      </Stack>

      <Stack spacing={1}>
        {order.map((item, i) => {
          const isRight = checked && step.items[i] === item;
          const isWrong = checked && step.items[i] !== item;
          let borderColor = 'divider';
          if (solved || isRight) borderColor = 'success.main';
          else if (isWrong) borderColor = 'error.main';

          return (
            <Box
              key={item}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                p: 1,
                pl: 1.5,
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
              <Box
                sx={{
                  width: 22,
                  height: 22,
                  borderRadius: 1,
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'text.secondary',
                  backgroundColor: (t) => alpha(t.palette.text.primary, 0.06),
                }}
              >
                {i + 1}
              </Box>
              <Typography sx={{ flex: 1, fontFamily: mono, fontWeight: 500 }}>{item}</Typography>
              {!solved ? (
                <>
                  <IconButton size="small" disabled={i === 0} onClick={() => move(i, -1)}>
                    <ArrowUpwardOutlined fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    disabled={i === order.length - 1}
                    onClick={() => move(i, 1)}
                  >
                    <ArrowDownwardOutlined fontSize="small" />
                  </IconButton>
                </>
              ) : null}
            </Box>
          );
        })}
      </Stack>

      {checked && !solved ? (
        <Typography color="error" variant="body2" sx={{ mt: 2 }}>
          Порядок ещё не тот. Подвигай строки и проверь снова.
        </Typography>
      ) : null}

      {!solved ? (
        <Stack direction="row" sx={{ justifyContent: 'flex-end', mt: 2 }}>
          <Button variant="contained" onClick={check}>
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
