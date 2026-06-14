import { useState } from 'react';

import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import { Alert, Box, Button, Chip, Stack } from '@mui/material';
import { alpha } from '@mui/material/styles';

import { mono } from '@/theme';
import type { FindMechanismsStep } from '@/types';

import { FrPhrase, Prompt, TaskHeader } from './parts';

interface Props {
  step: FindMechanismsStep;
  boss?: boolean;
  completed: boolean;
  onComplete: () => void;
}

export default function FindMechanismsTask({ step, boss, completed, onComplete }: Props) {
  const [selected, setSelected] = useState<Set<number>>(() =>
    completed
      ? new Set(step.options.map((o, i) => (o.present ? i : -1)).filter((i) => i >= 0))
      : new Set(),
  );
  const [checked, setChecked] = useState(completed);
  const [solved, setSolved] = useState(completed);

  function toggle(i: number) {
    if (solved) return;
    setChecked(false);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  function check() {
    setChecked(true);
    const ok = step.options.every((o, i) => o.present === selected.has(i));
    if (ok) {
      setSolved(true);
      onComplete();
    }
  }

  return (
    <Box>
      <TaskHeader kind={step.kind} boss={boss} />
      <Prompt>{step.prompt}</Prompt>

      <FrPhrase text={step.phrase} size="lg" sx={{ mb: 2.5 }} />

      <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1, mb: 2 }}>
        {step.options.map((opt, i) => {
          const isSel = selected.has(i);
          const reveal = checked || solved;
          const falsePos = reveal && isSel && !opt.present;
          const missed = reveal && !isSel && opt.present;
          const hit = reveal && isSel && opt.present;

          let color = isSel ? '#e8b24a' : '#9a9488';
          if (hit) color = '#5bbf8f';
          else if (falsePos) color = '#e5484d';
          else if (missed) color = '#e5484d';

          return (
            <Chip
              key={opt.label}
              label={missed ? `${opt.label} ←` : opt.label}
              onClick={() => toggle(i)}
              variant={isSel || hit ? 'filled' : 'outlined'}
              sx={{
                fontFamily: mono,
                fontWeight: 600,
                cursor: solved ? 'default' : 'pointer',
                color,
                borderColor: alpha(color, 0.5),
                backgroundColor: isSel || hit ? alpha(color, 0.14) : 'transparent',
                borderStyle: missed ? 'dashed' : 'solid',
              }}
            />
          );
        })}
      </Stack>

      {checked && !solved ? (
        <Box sx={{ color: 'error.main', fontSize: 14, mb: 1 }}>
          Не всё точно: красным помечены лишние, пунктиром со стрелкой — пропущенные.
        </Box>
      ) : null}

      {!solved ? (
        <Stack direction="row" sx={{ justifyContent: 'flex-end' }}>
          <Button variant="contained" disabled={selected.size === 0} onClick={check}>
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
