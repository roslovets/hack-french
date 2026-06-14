import { useState } from 'react';

import ArrowRightAltOutlined from '@mui/icons-material/ArrowRightAltOutlined';
import LockOpenOutlined from '@mui/icons-material/LockOpenOutlined';
import { Alert, Box, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

import { mono } from '@/theme';
import type { CodeStep } from '@/types';

import { FrPhrase, Prompt, TaskHeader } from './parts';

interface Props {
  step: CodeStep;
  boss?: boolean;
  completed: boolean;
  onComplete: () => void;
}

export default function CodeBreakdownTask({ step, boss, completed, onComplete }: Props) {
  const [revealed, setRevealed] = useState<Set<number>>(
    () => new Set(completed ? step.tokens.map((_, i) => i) : []),
  );

  const allRevealed = revealed.size === step.tokens.length;

  // onComplete is called from the click handler (not from a state updater),
  // so we don't update the parent during render.
  function reveal(index: number) {
    if (revealed.has(index)) return;
    const next = new Set(revealed).add(index);
    setRevealed(next);
    if (next.size === step.tokens.length) onComplete();
  }

  return (
    <Box>
      <TaskHeader kind={step.kind} boss={boss} />
      <Prompt>{step.prompt ?? 'Вскрытие: разбери фразу как код.'}</Prompt>

      <FrPhrase text={step.phrase} size="lg" sx={{ mb: 2.5 }} />

      {!allRevealed ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Нажми на каждый блок, чтобы декодировать его.
        </Typography>
      ) : null}

      <Stack spacing={1.25}>
        {step.tokens.map((token, i) => {
          const isOpen = revealed.has(i);
          return (
            <Box
              key={i}
              role="button"
              tabIndex={isOpen ? -1 : 0}
              onClick={() => reveal(i)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  reveal(i);
                }
              }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                p: 1.5,
                borderRadius: 2,
                border: '1px solid',
                borderColor: isOpen ? alpha('#e8b24a', 0.4) : 'divider',
                backgroundColor: isOpen ? alpha('#e8b24a', 0.06) : 'transparent',
                cursor: isOpen ? 'default' : 'pointer',
                transition: 'all 140ms ease',
                '&:hover': isOpen ? undefined : { borderColor: 'primary.main' },
              }}
            >
              <Typography
                sx={{ fontFamily: mono, fontWeight: 700, minWidth: 96, color: 'primary.main' }}
              >
                {token.fr}
              </Typography>
              <ArrowRightAltOutlined sx={{ color: 'text.disabled' }} fontSize="small" />
              {isOpen ? (
                <Box sx={{ flex: 1 }}>
                  <Typography component="span" sx={{ fontWeight: 600 }}>
                    {token.ru}
                  </Typography>
                  {token.role ? (
                    <Typography component="span" variant="body2" color="text.secondary">
                      {'  ·  '}
                      {token.role}
                    </Typography>
                  ) : null}
                </Box>
              ) : (
                <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', flex: 1 }}>
                  <LockOpenOutlined sx={{ fontSize: 16, color: 'text.disabled' }} />
                  <Typography variant="body2" color="text.disabled">
                    декодировать
                  </Typography>
                </Stack>
              )}
            </Box>
          );
        })}
      </Stack>

      {allRevealed && step.note ? (
        <Alert severity="info" variant="outlined" sx={{ mt: 2.5, borderRadius: 2 }}>
          {step.note}
        </Alert>
      ) : null}
    </Box>
  );
}
