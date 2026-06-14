import { useMemo, useState } from 'react';

import CancelOutlined from '@mui/icons-material/CancelOutlined';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

import { mono } from '@/theme';
import type { ChoiceStep, TaskKind } from '@/types';

import { seededShuffle } from '@/lib/shuffle';

import { FrPhrase, Prompt, TaskHeader } from './parts';

const FRENCH_OPTION_KINDS = new Set<TaskKind>([
  'collapse',
  'cloze',
  'fixCalque',
  'scene',
  'mutation',
  'oddOneOut',
  'expand',
  'trap',
  'simpler',
]);

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

interface Props {
  step: ChoiceStep;
  boss?: boolean;
  completed: boolean;
  onComplete: () => void;
}

export default function ChoiceTask({ step, boss, completed, onComplete }: Props) {
  const options = useMemo(
    () =>
      seededShuffle(
        step.options.map((text, originalIndex) => ({ text, originalIndex })),
        step.id,
      ),
    [step.id, step.options],
  );

  const [selected, setSelected] = useState<number | null>(null);
  const [wrong, setWrong] = useState<Set<number>>(new Set());
  const [solved, setSolved] = useState(completed);

  const frenchOptions = FRENCH_OPTION_KINDS.has(step.kind);

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

  const correctShuffledIndex = options.findIndex((o) => o.originalIndex === step.correctIndex);

  return (
    <Box>
      <TaskHeader kind={step.kind} boss={boss} />
      <Prompt>{step.prompt}</Prompt>

      {step.situation ? (
        <Box
          sx={{
            mb: 2,
            p: 2,
            borderRadius: 2,
            border: '1px dashed',
            borderColor: 'divider',
            backgroundColor: (t) => alpha(t.palette.warning?.main ?? '#cf8a4a', 0.06),
          }}
        >
          <Typography variant="overline" color="text.secondary">
            Сцена
          </Typography>
          <Typography sx={{ mt: 0.5 }}>{step.situation}</Typography>
        </Box>
      ) : null}

      {step.clues ? (
        <Box sx={{ mb: 2 }}>
          <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            Улики
          </Typography>
          <Stack spacing={1}>
            {step.clues.map((clue) => (
              <FrPhrase key={clue} text={clue} size="sm" />
            ))}
          </Stack>
        </Box>
      ) : null}

      {step.phrases ? (
        <Stack spacing={1} sx={{ mb: 2 }}>
          {step.phrases.map((p) => (
            <FrPhrase key={p} text={p} size="md" />
          ))}
        </Stack>
      ) : null}

      {step.phrase ? <FrPhrase text={step.phrase} sx={{ mb: 2 }} size="md" /> : null}

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
              <Typography
                sx={{
                  flex: 1,
                  fontFamily: frenchOptions ? mono : undefined,
                  fontSize: frenchOptions ? 15 : 15.5,
                  fontWeight: 500,
                }}
              >
                {opt.text}
              </Typography>
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
          {step.result ? (
            <Box sx={{ mt: 1.25, fontFamily: mono, fontWeight: 600, color: 'success.main' }}>
              → {step.result}
            </Box>
          ) : null}
        </Alert>
      )}
    </Box>
  );
}
