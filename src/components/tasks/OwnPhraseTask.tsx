import { useState } from 'react';

import AddOutlined from '@mui/icons-material/AddOutlined';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import { Alert, Box, Button, Chip, Stack, TextField, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

import { mono } from '@/theme';
import type { OwnPhraseStep } from '@/types';

import { useProgress } from '@/state/useProgress';

import { Prompt, TaskHeader } from './parts';

interface Props {
  step: OwnPhraseStep;
  boss?: boolean;
  onComplete: () => void;
}

export default function OwnPhraseTask({ step, boss, onComplete }: Props) {
  const { state, saveOwnPhrases } = useProgress();
  const [phrases, setPhrases] = useState<string[]>(() => state.ownPhrases[step.id] ?? []);
  const [draft, setDraft] = useState('');

  const done = phrases.length >= step.minCount;

  function commit(list: string[]) {
    setPhrases(list);
    saveOwnPhrases(step.id, list);
    if (list.length >= step.minCount) onComplete();
  }

  function add() {
    const value = draft.trim();
    if (!value) return;
    commit([...phrases, value]);
    setDraft('');
  }

  function remove(index: number) {
    commit(phrases.filter((_, i) => i !== index));
  }

  return (
    <Box>
      <TaskHeader kind={step.kind} boss={boss} />
      <Prompt>{step.prompt}</Prompt>

      <Chip
        label={step.pattern}
        variant="outlined"
        sx={{ mb: 2, fontFamily: mono, fontWeight: 600 }}
      />

      <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        Для вдохновения
      </Typography>
      <Stack direction="row" sx={{ mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
        {step.examples.map((ex) => (
          <Chip
            key={ex}
            label={ex}
            size="small"
            onClick={() => setDraft(ex)}
            sx={{
              fontFamily: mono,
              cursor: 'pointer',
              color: 'text.secondary',
              '&:hover': { color: 'text.primary' },
            }}
          />
        ))}
      </Stack>

      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Твоя фраза…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          slotProps={{
            input: { sx: { fontFamily: mono } },
            // This field holds French. Tag its language and turn off the browser's
            // spellcheck/autocorrect so correct French isn't underlined or "fixed"
            // against the Russian UI dictionary.
            htmlInput: { lang: 'fr', spellCheck: false, autoCorrect: 'off' },
          }}
        />
        <Button
          variant="contained"
          startIcon={<AddOutlined />}
          onClick={add}
          disabled={!draft.trim()}
        >
          Добавить
        </Button>
      </Stack>

      {phrases.length > 0 ? (
        <Stack spacing={1} sx={{ mb: 2 }}>
          {phrases.map((p, i) => (
            <Box
              key={`${p}-${i}`}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 1.5,
                py: 1,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                backgroundColor: (t) => alpha(t.palette.success.main, 0.05),
              }}
            >
              <CheckCircleOutlined fontSize="small" sx={{ color: 'success.main' }} />
              <Typography sx={{ flex: 1, fontFamily: mono }}>{p}</Typography>
              <Button size="small" color="inherit" onClick={() => remove(i)} sx={{ minWidth: 0 }}>
                ✕
              </Button>
            </Box>
          ))}
        </Stack>
      ) : null}

      <Box sx={{ mt: 1 }}>
        {done ? (
          <Alert severity="success" variant="outlined" sx={{ borderRadius: 2 }}>
            Отлично — {phrases.length} {phrases.length === 1 ? 'фраза' : 'фраз'} в твоей коллекции.
            Эти фразы из твоей жизни, поэтому запомнятся лучше всего.
          </Alert>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Добавь ещё {step.minCount - phrases.length}, чтобы раскрыть шаг ({phrases.length}/
            {step.minCount}).
          </Typography>
        )}
      </Box>
    </Box>
  );
}
