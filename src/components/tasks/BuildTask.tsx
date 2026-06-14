import { useMemo, useState } from 'react';

import BackspaceOutlined from '@mui/icons-material/BackspaceOutlined';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import FlagOutlined from '@mui/icons-material/FlagOutlined';
import { Alert, Box, Button, Chip, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

import { mono } from '@/theme';
import type { BuildStep } from '@/types';

import { seededShuffle } from '@/lib/shuffle';

import { Prompt, TaskHeader } from './parts';

interface Props {
  step: BuildStep;
  boss?: boolean;
  completed: boolean;
  onComplete: () => void;
}

function answerToIds(answer: string[], blocks: string[]): number[] {
  const used = new Set<number>();
  return answer.map((tok) => {
    const idx = blocks.findIndex((b, i) => b === tok && !used.has(i));
    used.add(idx);
    return idx;
  });
}

export default function BuildTask({ step, boss, completed, onComplete }: Props) {
  const bank = useMemo(
    () =>
      seededShuffle(
        step.blocks.map((token, id) => ({ token, id })),
        step.id,
      ),
    [step.id, step.blocks],
  );

  const [placed, setPlaced] = useState<number[]>(() =>
    completed ? answerToIds(step.answer, step.blocks) : [],
  );
  const [error, setError] = useState(false);
  const [solved, setSolved] = useState(completed);

  const placedSet = new Set(placed);

  function add(id: number) {
    if (solved) return;
    setError(false);
    setPlaced((p) => [...p, id]);
  }
  function removeAt(pos: number) {
    if (solved) return;
    setError(false);
    setPlaced((p) => p.filter((_, i) => i !== pos));
  }
  function check() {
    const built = placed.map((id) => step.blocks[id]);
    if (built.length === step.answer.length && built.every((t, i) => t === step.answer[i])) {
      setSolved(true);
      onComplete();
    } else {
      setError(true);
    }
  }

  return (
    <Box>
      <TaskHeader kind={step.kind} boss={boss} />
      <Prompt>{step.prompt}</Prompt>

      {step.translation ? (
        <Chip
          icon={<FlagOutlined sx={{ fontSize: 16 }} />}
          label={`Цель: ${step.translation}`}
          variant="outlined"
          sx={{ mb: 2 }}
        />
      ) : null}

      {/* Assembly line */}
      <Box
        sx={{
          minHeight: 60,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 1,
          p: 1.5,
          mb: 2,
          borderRadius: 2,
          border: '1.5px solid',
          borderColor: solved ? 'success.main' : error ? 'error.main' : 'divider',
          backgroundColor: (t) =>
            solved
              ? alpha(t.palette.success.main, 0.08)
              : error
                ? alpha(t.palette.error.main, 0.06)
                : alpha(t.palette.primary.main, 0.04),
          transition: 'all 160ms ease',
        }}
      >
        {placed.length === 0 ? (
          <Typography variant="body2" color="text.disabled" sx={{ px: 1 }}>
            Нажимай на блоки, чтобы собрать фразу…
          </Typography>
        ) : (
          placed.map((id, pos) => (
            <Chip
              key={`${id}-${pos}`}
              label={step.blocks[id]}
              onDelete={solved ? undefined : () => removeAt(pos)}
              deleteIcon={<BackspaceOutlined />}
              sx={{ fontFamily: mono, fontWeight: 600, fontSize: 15, py: 2 }}
              color={solved ? 'success' : 'primary'}
              variant={solved ? 'filled' : 'outlined'}
            />
          ))
        )}
      </Box>

      {/* Block bank */}
      {!solved ? (
        <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1, mb: 1 }}>
          {bank.map(({ token, id }) => {
            const used = placedSet.has(id);
            return (
              <Button
                key={id}
                variant="outlined"
                color="inherit"
                disabled={used}
                onClick={() => add(id)}
                sx={{
                  fontFamily: mono,
                  fontWeight: 600,
                  fontSize: 15,
                  borderColor: 'divider',
                  opacity: used ? 0.3 : 1,
                }}
              >
                {token}
              </Button>
            );
          })}
        </Stack>
      ) : null}

      {error ? (
        <Typography color="error" variant="body2" sx={{ mt: 1 }}>
          Не тот порядок. Попробуй переставить блоки.
        </Typography>
      ) : null}

      {!solved ? (
        <Stack direction="row" sx={{ justifyContent: 'flex-end', mt: 2 }}>
          <Button variant="contained" disabled={placed.length === 0} onClick={check}>
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
          <Box sx={{ fontFamily: mono, fontWeight: 600, mb: step.explanation ? 0.75 : 0 }}>
            {step.answer.join(' ')}
          </Box>
          {step.explanation}
        </Alert>
      )}
    </Box>
  );
}
