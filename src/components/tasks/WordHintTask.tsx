import { useState } from 'react';

import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import LightbulbOutlined from '@mui/icons-material/LightbulbOutlined';
import { Alert, Box, Button, Stack, TextField, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

import { mono } from '@/theme';
import type { WordHintStep } from '@/types';

import { useProgress } from '@/state/useProgress';

import { Prompt, TaskHeader } from './parts';

interface Props {
  step: WordHintStep;
  boss?: boolean;
  completed: boolean;
  onComplete: () => void;
}

/** Accent- and case-insensitive comparison for the recalled answer. */
function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

/** M29 — recall the word; reveal a ladder of hints one at a time. */
export default function WordHintTask({ step, boss, completed, onComplete }: Props) {
  const { logWordHint } = useProgress();
  const [value, setValue] = useState('');
  const [revealed, setRevealed] = useState(0);
  const [wrong, setWrong] = useState(false);
  const [solved, setSolved] = useState(completed);

  function submit() {
    if (!value.trim()) return;
    if (normalize(value) === normalize(step.answer)) {
      logWordHint(step.id, revealed);
      setSolved(true);
      onComplete();
    } else {
      setWrong(true);
    }
  }

  return (
    <Box>
      <TaskHeader kind={step.kind} boss={boss} />
      <Prompt>{step.prompt}</Prompt>

      {revealed > 0 ? (
        <Stack spacing={1} sx={{ mb: 2 }}>
          {step.hints.slice(0, revealed).map((h, i) => (
            <Box
              key={i}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                p: 1.25,
                borderRadius: 1.5,
                borderLeft: '3px solid',
                borderColor: 'primary.main',
                backgroundColor: (t) => alpha(t.palette.primary.main, 0.06),
              }}
            >
              <LightbulbOutlined fontSize="small" sx={{ color: 'primary.main' }} />
              <Typography sx={{ fontFamily: mono }}>{h}</Typography>
            </Box>
          ))}
        </Stack>
      ) : null}

      {!solved ? (
        <>
          <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Вспомни слово по-французски…"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setWrong(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  submit();
                }
              }}
              error={wrong}
              helperText={wrong ? 'Не то слово. Возьми подсказку или попробуй ещё.' : ' '}
              slotProps={{
                input: { sx: { fontFamily: mono } },
                htmlInput: { lang: 'fr', spellCheck: false, autoCorrect: 'off' },
              }}
            />
            <Button
              variant="contained"
              disabled={!value.trim()}
              onClick={submit}
              sx={{ flexShrink: 0 }}
            >
              Проверить
            </Button>
          </Stack>
          {revealed < step.hints.length ? (
            <Button
              size="small"
              color="inherit"
              startIcon={<LightbulbOutlined />}
              onClick={() => setRevealed((n) => n + 1)}
              sx={{ color: 'text.secondary' }}
            >
              Подсказка ({revealed}/{step.hints.length})
            </Button>
          ) : (
            <Typography variant="caption" color="text.disabled">
              Подсказки закончились.
            </Typography>
          )}
        </>
      ) : (
        <Alert
          icon={<CheckCircleOutlined fontSize="inherit" />}
          severity="success"
          variant="outlined"
          sx={{ borderRadius: 2 }}
        >
          <Box sx={{ fontFamily: mono, fontWeight: 700, mb: step.explanation ? 0.5 : 0 }}>
            {step.answer}
          </Box>
          {step.explanation}
        </Alert>
      )}
    </Box>
  );
}
