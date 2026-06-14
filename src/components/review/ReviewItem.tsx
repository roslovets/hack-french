import { useState } from 'react';

import CancelOutlined from '@mui/icons-material/CancelOutlined';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

import { FrPhrase, TaskHeader } from '@/components/tasks/parts';
import type { ReviewItemData } from '@/lib/review';
import { mono } from '@/theme';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

interface Props {
  item: ReviewItemData;
  index: number;
  total: number;
  onGrade: (correct: boolean) => void;
  onNext: () => void;
}

export default function ReviewItem({ item, index, total, onGrade, onNext }: Props) {
  const [picked, setPicked] = useState<number | null>(null);
  const graded = picked !== null;
  const pickedCorrect = graded && (item.options[picked]?.correct ?? false);
  const isLast = index === total - 1;

  function pick(i: number) {
    if (graded) return;
    setPicked(i);
    onGrade(item.options[i]?.correct ?? false);
  }

  return (
    <Box>
      <TaskHeader kind={item.stepKind ?? 'insight'} />
      <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.35, mb: 2 }}>
        {item.prompt}
      </Typography>

      {item.situation ? (
        <Box
          sx={{
            mb: 2,
            px: 1.5,
            py: 1,
            borderRadius: 1.5,
            border: '1px dashed',
            borderColor: 'divider',
            fontFamily: item.kind === 'insight' ? mono : undefined,
            fontSize: 13.5,
            color: 'text.secondary',
          }}
        >
          {item.kind === 'insight' ? '› ' : ''}
          {item.situation}
        </Box>
      ) : null}

      {item.clues ? (
        <Stack spacing={1} sx={{ mb: 2 }}>
          {item.clues.map((c) => (
            <FrPhrase key={c} text={c} size="sm" />
          ))}
        </Stack>
      ) : null}

      {item.phrases ? (
        <Stack spacing={1} sx={{ mb: 2 }}>
          {item.phrases.map((p) => (
            <FrPhrase key={p} text={p} size="md" />
          ))}
        </Stack>
      ) : null}

      {item.phrase ? <FrPhrase text={item.phrase} sx={{ mb: 2 }} /> : null}

      <Stack spacing={1.25}>
        {item.options.map((opt, i) => {
          const showCorrect = graded && opt.correct;
          const showWrong = graded && i === picked && !opt.correct;
          let borderColor = 'divider';
          if (showCorrect) borderColor = 'success.main';
          else if (showWrong) borderColor = 'error.main';

          return (
            <Box
              key={i}
              role="button"
              tabIndex={graded ? -1 : 0}
              onClick={() => pick(i)}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && !graded) {
                  e.preventDefault();
                  pick(i);
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
                    : 'transparent',
                cursor: graded ? 'default' : 'pointer',
                opacity: graded && !showCorrect && !showWrong ? 0.55 : 1,
                transition: 'all 140ms ease',
                '&:hover': graded ? undefined : { borderColor: 'primary.main' },
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
                sx={{ flex: 1, fontFamily: item.frenchOptions ? mono : undefined, fontWeight: 500 }}
              >
                {opt.text}
              </Typography>
              {showCorrect ? <CheckCircleOutlined color="success" fontSize="small" /> : null}
              {showWrong ? <CancelOutlined color="error" fontSize="small" /> : null}
            </Box>
          );
        })}
      </Stack>

      {graded ? (
        <Box sx={{ mt: 2.5 }}>
          <Alert
            severity={pickedCorrect ? 'success' : 'error'}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            {pickedCorrect ? 'Держится! ' : 'Сбой памяти — дело уйдёт на доследование. '}
            {item.explanation}
          </Alert>
          <Stack direction="row" sx={{ justifyContent: 'flex-end', mt: 2 }}>
            <Button variant="contained" onClick={onNext}>
              {isLast ? 'Завершить летучку' : 'Дальше'}
            </Button>
          </Stack>
        </Box>
      ) : null}
    </Box>
  );
}
