import { useMemo, useState } from 'react';

import CancelOutlined from '@mui/icons-material/CancelOutlined';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import CompareArrowsOutlined from '@mui/icons-material/CompareArrowsOutlined';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

import { mono } from '@/theme';
import type { WordBridgeStep } from '@/types';

import { seededShuffle } from '@/lib/shuffle';

import { Prompt, TaskHeader } from './parts';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

interface Props {
  step: WordBridgeStep;
  boss?: boolean;
  completed: boolean;
  onComplete: () => void;
  shuffleKey?: string;
}

/** M06 — lean on an English cognate to pin down the French word. */
export default function WordBridgeTask({ step, boss, completed, onComplete, shuffleKey }: Props) {
  const options = useMemo(
    () =>
      seededShuffle(
        step.options.map((text, originalIndex) => ({ text, originalIndex })),
        shuffleKey ?? step.id,
      ),
    [shuffleKey, step.id, step.options],
  );

  const [selected, setSelected] = useState<number | null>(null);
  const [wrong, setWrong] = useState<Set<number>>(new Set());
  const [solved, setSolved] = useState(completed);

  const correctShuffledIndex = options.findIndex((o) => o.originalIndex === step.correctIndex);

  function check() {
    if (selected === null) return;
    const opt = options[selected];
    if (opt && opt.originalIndex === step.correctIndex) {
      setSolved(true);
      onComplete();
    } else {
      setWrong((prev) => new Set(prev).add(selected));
    }
  }

  return (
    <Box>
      <TaskHeader kind={step.kind} boss={boss} />
      <Prompt>{step.prompt}</Prompt>

      <Box
        sx={{
          mb: 2.5,
          p: 1.75,
          borderRadius: 2,
          border: '1px solid',
          borderColor: (t) => alpha(t.palette.success.main, 0.35),
          backgroundColor: (t) => alpha(t.palette.success.main, 0.06),
          display: 'flex',
          alignItems: 'center',
          gap: 1.25,
        }}
      >
        <CompareArrowsOutlined sx={{ color: 'success.main' }} />
        <Typography sx={{ fontFamily: mono, fontWeight: 600 }}>{step.bridge}</Typography>
      </Box>

      <Stack spacing={1.25}>
        {options.map((opt, i) => {
          const isCorrect = i === correctShuffledIndex;
          const isWrong = wrong.has(i);
          const isSelected = selected === i;
          const showCorrect = solved && isCorrect;
          const showWrong = isWrong && !solved;

          let borderColor = 'divider';
          let bg = 'transparent';
          if (showCorrect) borderColor = 'success.main';
          else if (showWrong) borderColor = 'error.main';
          else if (isSelected) borderColor = 'primary.main';

          if (showCorrect) bg = alpha('#5bbf8f', 0.1);
          else if (showWrong) bg = alpha('#e5484d', 0.08);
          else if (isSelected) bg = alpha('#e8b24a', 0.08);

          return (
            <Box
              key={opt.originalIndex}
              role="button"
              tabIndex={solved ? -1 : 0}
              onClick={() => {
                if (!solved && !isWrong) setSelected(i);
              }}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && !solved && !isWrong) {
                  e.preventDefault();
                  setSelected(i);
                }
              }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                p: 1.5,
                borderRadius: 2,
                border: '1.5px solid',
                borderColor,
                backgroundColor: bg,
                cursor: solved || isWrong ? 'default' : 'pointer',
                opacity: showWrong ? 0.65 : 1,
                transition: 'all 140ms ease',
                '&:hover': solved || isWrong ? undefined : { borderColor: 'primary.main' },
              }}
            >
              <Box
                sx={{
                  flexShrink: 0,
                  width: 26,
                  height: 26,
                  borderRadius: 1,
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'text.secondary',
                  backgroundColor: (t) => alpha(t.palette.text.primary, 0.06),
                }}
              >
                {LETTERS[i] ?? i + 1}
              </Box>
              <Typography sx={{ flex: 1, fontSize: 15.5, fontWeight: 500 }}>{opt.text}</Typography>
              {showCorrect ? <CheckCircleOutlined color="success" fontSize="small" /> : null}
              {showWrong ? <CancelOutlined color="error" fontSize="small" /> : null}
            </Box>
          );
        })}
      </Stack>

      {!solved ? (
        <Stack direction="row" sx={{ justifyContent: 'flex-end', mt: 2.5 }}>
          <Button variant="contained" disabled={selected === null} onClick={check}>
            Проверить
          </Button>
        </Stack>
      ) : (
        <Alert
          icon={<CheckCircleOutlined fontSize="inherit" />}
          severity="success"
          variant="outlined"
          sx={{ mt: 2.5, borderRadius: 2 }}
        >
          {step.explanation}
        </Alert>
      )}
    </Box>
  );
}
