import { useMemo, useState } from 'react';

import CancelOutlined from '@mui/icons-material/CancelOutlined';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

import { mono } from '@/theme';
import type { DebugStep } from '@/types';

import { seededShuffle } from '@/lib/shuffle';

import { Prompt, TaskHeader } from './parts';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

interface Props {
  step: DebugStep;
  boss?: boolean;
  completed: boolean;
  onComplete: () => void;
}

export default function DebugTask({ step, boss, completed, onComplete }: Props) {
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

      {/* Terminal with the bug */}
      <Box
        sx={{
          borderRadius: 2,
          border: '1px solid',
          borderColor: alpha('#e5484d', 0.35),
          overflow: 'hidden',
          mb: 2.5,
          backgroundColor: '#0b0e13',
        }}
      >
        <Stack
          direction="row"
          spacing={0.75}
          sx={{
            alignItems: 'center',
            px: 1.5,
            py: 1,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box sx={{ width: 11, height: 11, borderRadius: '50%', backgroundColor: '#e5484d' }} />
          <Box sx={{ width: 11, height: 11, borderRadius: '50%', backgroundColor: '#cf8a4a' }} />
          <Box sx={{ width: 11, height: 11, borderRadius: '50%', backgroundColor: '#5bbf8f' }} />
          <Typography variant="caption" sx={{ pl: 1, color: 'text.disabled', fontFamily: mono }}>
            french-debug
          </Typography>
        </Stack>
        <Box sx={{ p: 2, fontFamily: mono }}>
          <Typography
            sx={{
              fontFamily: mono,
              fontSize: 17,
              fontWeight: 600,
              textDecoration: 'line-through',
              textDecorationColor: alpha('#e5484d', 0.7),
              color: 'text.primary',
              mb: 1,
            }}
          >
            {step.buggy}
          </Typography>
          <Typography sx={{ fontFamily: mono, fontSize: 13.5, color: '#ff8f8f' }}>
            ✗ Bug: {step.bugReport}
          </Typography>
          {solved ? (
            <Typography sx={{ fontFamily: mono, fontSize: 13.5, color: '#5bbf8f', mt: 0.5 }}>
              ✓ Fix: {step.fixNote}
            </Typography>
          ) : null}
        </Box>
      </Box>

      <Stack spacing={1.25}>
        {options.map((opt, i) => {
          const isCorrect = i === correctShuffledIndex;
          const isWrong = wrong.has(i);
          const isSelected = selected === i;
          const showCorrect = solved && isCorrect;
          const showWrong = isWrong && !solved;

          let borderColor = 'divider';
          if (showCorrect) borderColor = 'success.main';
          else if (showWrong) borderColor = 'error.main';
          else if (isSelected) borderColor = 'primary.main';

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
                backgroundColor: showCorrect
                  ? alpha('#5bbf8f', 0.1)
                  : showWrong
                    ? alpha('#e5484d', 0.08)
                    : isSelected
                      ? alpha('#e8b24a', 0.08)
                      : 'transparent',
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
            Применить патч
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
