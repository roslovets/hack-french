import { useMemo, useState } from 'react';

import CancelOutlined from '@mui/icons-material/CancelOutlined';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import VolumeUpOutlined from '@mui/icons-material/VolumeUpOutlined';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

import { speak, speechAvailable } from '@/lib/speech';
import { mono } from '@/theme';
import type { SoundTwinStep } from '@/types';

import { seededShuffle } from '@/lib/shuffle';

import { Prompt, TaskHeader } from './parts';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

interface Props {
  step: SoundTwinStep;
  boss?: boolean;
  completed: boolean;
  onComplete: () => void;
}

/** M10 — hear a word and pick which similar-sounding spelling was said. */
export default function SoundTwinTask({ step, boss, completed, onComplete }: Props) {
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

  const correctShuffledIndex = options.findIndex((o) => o.originalIndex === step.correctIndex);
  const canPlay = Boolean(step.audioSrc) || speechAvailable();

  function play(rate?: number) {
    if (step.audioSrc) {
      const audio = new Audio(import.meta.env.BASE_URL + step.audioSrc);
      audio.play().catch(() => speak(step.audioText, { rate }));
    } else {
      speak(step.audioText, { rate });
    }
  }

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

      {canPlay ? (
        <Stack direction="row" spacing={1} sx={{ mb: 2.5 }}>
          <Button variant="contained" startIcon={<VolumeUpOutlined />} onClick={() => play()}>
            Прослушать
          </Button>
          <Button color="inherit" onClick={() => play(0.6)} sx={{ color: 'text.secondary' }}>
            Медленно
          </Button>
        </Stack>
      ) : (
        <Alert severity="info" variant="outlined" sx={{ mb: 2.5, borderRadius: 2 }}>
          Аудио недоступно в этом браузере — выбери по догадке, разбор покажем после.
        </Alert>
      )}

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
              <Typography sx={{ flex: 1, fontFamily: mono, fontWeight: 500 }}>
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
          <Box sx={{ fontFamily: mono, fontWeight: 700, mb: step.explanation ? 0.5 : 0 }}>
            {step.audioText}
          </Box>
          {step.explanation}
        </Alert>
      )}
    </Box>
  );
}
