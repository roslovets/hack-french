import { useMemo, useState } from 'react';

import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import { Alert, Box, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

import { getScene } from '@/data';
import { mono } from '@/theme';
import type { DialogueStep } from '@/types';

import { seededShuffle } from '@/lib/shuffle';

import { Prompt, TaskHeader } from './parts';

interface Props {
  step: DialogueStep;
  boss?: boolean;
  completed: boolean;
  onComplete: () => void;
}

export default function DialogueTask({ step, boss, completed, onComplete }: Props) {
  const scene = step.scene ? getScene(step.scene) : undefined;
  const emoji = scene?.emoji ?? '💬';

  const [turn, setTurn] = useState(completed ? step.turns.length : 0);
  const [answers, setAnswers] = useState<number[]>(
    completed ? step.turns.map((t) => t.correctIndex) : [],
  );
  const [wrong, setWrong] = useState<Set<number>>(new Set());

  const done = turn >= step.turns.length;
  const current = done ? undefined : step.turns[turn];

  const options = useMemo(() => {
    if (!current) return [];
    return seededShuffle(
      current.options.map((text, originalIndex) => ({ text, originalIndex })),
      `${step.id}-${turn}`,
    );
  }, [current, step.id, turn]);

  function answer(originalIndex: number) {
    if (!current) return;
    if (originalIndex === current.correctIndex) {
      setAnswers((a) => [...a, originalIndex]);
      setWrong(new Set());
      const next = turn + 1;
      setTurn(next);
      if (next >= step.turns.length) onComplete();
    } else {
      setWrong((prev) => new Set(prev).add(originalIndex));
    }
  }

  return (
    <Box>
      <TaskHeader kind={step.kind} boss={boss} />
      <Prompt>{step.prompt}</Prompt>

      {step.intro ? (
        <Box
          sx={{
            mb: 2,
            p: 1.5,
            borderRadius: 2,
            border: '1px dashed',
            borderColor: 'divider',
            backgroundColor: (t) => alpha(t.palette.warning?.main ?? '#cf8a4a', 0.05),
          }}
        >
          <Typography variant="overline" color="text.secondary">
            {scene ? `${emoji} ${scene.name}` : 'Сцена'}
          </Typography>
          <Typography sx={{ mt: 0.5 }}>{step.intro}</Typography>
        </Box>
      ) : null}

      <Stack spacing={1.5}>
        {step.turns.map((t, i) => {
          if (i > turn) return null;
          const answered = i < turn;
          return (
            <Box key={i}>
              {/* NPC turn */}
              <Stack
                direction="row"
                spacing={1}
                sx={{ alignItems: 'flex-start', mb: answered || i === turn ? 1 : 0 }}
              >
                <Box sx={{ fontSize: 22, lineHeight: 1.2 }}>{emoji}</Box>
                <Box
                  sx={{
                    maxWidth: '80%',
                    px: 1.75,
                    py: 1,
                    borderRadius: '2px 14px 14px 14px',
                    border: '1px solid',
                    borderColor: 'divider',
                    backgroundColor: 'background.paper',
                  }}
                >
                  <Typography sx={{ fontFamily: mono, fontWeight: 500 }}>{t.npc}</Typography>
                  {t.npcRu ? (
                    <Typography variant="caption" color="text.secondary">
                      {t.npcRu}
                    </Typography>
                  ) : null}
                </Box>
              </Stack>

              {/* Player's answer (if already answered) */}
              {answered ? (
                <Stack direction="row" sx={{ justifyContent: 'flex-end' }}>
                  <Box
                    sx={{
                      maxWidth: '80%',
                      px: 1.75,
                      py: 1,
                      borderRadius: '14px 2px 14px 14px',
                      backgroundColor: (th) => alpha(th.palette.primary.main, 0.14),
                      border: '1px solid',
                      borderColor: (th) => alpha(th.palette.primary.main, 0.4),
                    }}
                  >
                    <Typography sx={{ fontFamily: mono, fontWeight: 600, color: 'primary.main' }}>
                      {t.options[answers[i] ?? t.correctIndex]}
                    </Typography>
                  </Box>
                </Stack>
              ) : null}
            </Box>
          );
        })}
      </Stack>

      {/* Answer options for the current turn */}
      {current ? (
        <Stack spacing={1} sx={{ mt: 2 }}>
          <Typography variant="overline" color="text.secondary">
            Твой ответ
          </Typography>
          {options.map((opt) => {
            const isWrong = wrong.has(opt.originalIndex);
            return (
              <Box
                key={opt.originalIndex}
                role="button"
                tabIndex={0}
                onClick={() => !isWrong && answer(opt.originalIndex)}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && !isWrong) {
                    e.preventDefault();
                    answer(opt.originalIndex);
                  }
                }}
                sx={{
                  px: 1.5,
                  py: 1.25,
                  borderRadius: 2,
                  cursor: isWrong ? 'default' : 'pointer',
                  fontFamily: mono,
                  fontWeight: 500,
                  border: '1.5px solid',
                  borderColor: isWrong ? 'error.main' : 'divider',
                  backgroundColor: (t) =>
                    isWrong ? alpha(t.palette.error.main, 0.07) : 'transparent',
                  opacity: isWrong ? 0.6 : 1,
                  transition: 'all 120ms ease',
                  '&:hover': isWrong ? undefined : { borderColor: 'primary.main' },
                }}
              >
                {opt.text}
              </Box>
            );
          })}
        </Stack>
      ) : (
        <Alert
          icon={<CheckCircleOutlined fontSize="inherit" />}
          severity="success"
          variant="outlined"
          sx={{ mt: 2, borderRadius: 2 }}
        >
          {step.explanation ?? 'Диалог пройден — ты провёл живую сцену целиком.'}
        </Alert>
      )}
    </Box>
  );
}
