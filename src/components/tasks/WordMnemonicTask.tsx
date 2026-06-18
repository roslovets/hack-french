import { useState } from 'react';

import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import { Alert, Box, Button, Chip, Stack, TextField, Typography } from '@mui/material';

import { mono } from '@/theme';
import type { WordMnemonicStep } from '@/types';

import { useProgress } from '@/state/useProgress';

import { Prompt, TaskHeader } from './parts';

interface Props {
  step: WordMnemonicStep;
  boss?: boolean;
  onComplete: () => void;
}

/** M09 — capture a personal mnemonic for the word. Always "passes" (no wrong answer). */
export default function WordMnemonicTask({ step, boss, onComplete }: Props) {
  const { state, saveWordMnemonic } = useProgress();
  const wordId = step.wordId;
  const existing = wordId ? (state.wordMastery[wordId]?.mnemonic ?? '') : '';

  const [value, setValue] = useState(existing);
  const [saved, setSaved] = useState(Boolean(existing));

  function save() {
    if (!wordId || !value.trim()) return;
    saveWordMnemonic(wordId, value);
    setSaved(true);
    onComplete();
  }

  return (
    <Box>
      <TaskHeader kind={step.kind} boss={boss} />
      <Prompt>{step.prompt}</Prompt>

      {step.examples?.length ? (
        <>
          <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            Для вдохновения
          </Typography>
          <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1, mb: 2.5 }}>
            {step.examples.map((ex) => (
              <Chip
                key={ex}
                label={ex}
                size="small"
                onClick={() => {
                  setValue(ex);
                  setSaved(false);
                }}
                sx={{
                  cursor: 'pointer',
                  color: 'text.secondary',
                  '&:hover': { color: 'text.primary' },
                }}
              />
            ))}
          </Stack>
        </>
      ) : null}

      <TextField
        fullWidth
        multiline
        minRows={2}
        placeholder="Твоя ассоциация — чем нелепее, тем лучше запомнится…"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setSaved(false);
        }}
        sx={{ mb: 1.5 }}
        slotProps={{ input: { sx: { fontFamily: mono, fontSize: 15 } } }}
      />

      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
        <Button variant="contained" disabled={!value.trim()} onClick={save}>
          Сохранить
        </Button>
        <Typography variant="caption" color="text.disabled">
          Это мнемоника, а не происхождение слова.
        </Typography>
      </Stack>

      {saved ? (
        <Alert
          icon={<CheckCircleOutlined fontSize="inherit" />}
          severity="success"
          variant="outlined"
          sx={{ mt: 2, borderRadius: 2 }}
        >
          Ассоциация сохранена в досье слова — она вернётся вместе со словом.
        </Alert>
      ) : null}
    </Box>
  );
}
