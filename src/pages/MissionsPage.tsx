import DeleteOutlineOutlined from '@mui/icons-material/DeleteOutlineOutlined';
import EditNoteOutlined from '@mui/icons-material/EditNoteOutlined';
import RadarOutlined from '@mui/icons-material/RadarOutlined';
import TaskAltOutlined from '@mui/icons-material/TaskAltOutlined';
import { Box, Button, Card, Chip, Divider, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

import { cases } from '@/data';
import { mono } from '@/theme';
import type { CatchStep, OwnPhraseStep } from '@/types';

import { useProgress } from '@/state/useProgress';

interface CatchEntry {
  caseId: string;
  caseTitle: string;
  step: CatchStep;
}
interface OwnEntry {
  caseId: string;
  caseTitle: string;
  step: OwnPhraseStep;
}

const catchEntries: CatchEntry[] = cases.flatMap((c) =>
  c.steps
    .filter((s): s is CatchStep => s.kind === 'catch')
    .map((step) => ({ caseId: c.id, caseTitle: c.title, step })),
);

const ownEntries: OwnEntry[] = cases.flatMap((c) =>
  c.steps
    .filter((s): s is OwnPhraseStep => s.kind === 'ownPhrase')
    .map((step) => ({ caseId: c.id, caseTitle: c.title, step })),
);

export default function MissionsPage() {
  const navigate = useNavigate();
  const { state, resetProgress } = useProgress();

  const myPhrases = ownEntries.filter((e) => (state.ownPhrases[e.step.id]?.length ?? 0) > 0);

  function handleReset() {
    if (window.confirm('Сбросить весь прогресс, озарения и собственные фразы? Это необратимо.')) {
      resetProgress();
    }
  }

  return (
    <Box>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 1 }}>
        <RadarOutlined sx={{ color: 'success.main', fontSize: 32 }} />
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Журнал миссий
        </Typography>
      </Stack>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Миссии в реальный мир и твои собственные фразы. Здесь язык связывается с твоей жизнью.
      </Typography>

      {/* Catch it in real life */}
      <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
        Поймай в реальности
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 2,
          mb: 5,
        }}
      >
        {catchEntries.map(({ caseId, caseTitle, step }) => {
          const done = state.caughtMissions.includes(step.id);
          return (
            <Card
              key={step.id}
              sx={{
                p: 2.25,
                borderColor: done ? alpha('#5bbf8f', 0.4) : 'divider',
                backgroundColor: done ? alpha('#5bbf8f', 0.05) : 'transparent',
                cursor: 'pointer',
              }}
              onClick={() => void navigate(`/case/${caseId}`)}
            >
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
                {done ? (
                  <TaskAltOutlined fontSize="small" sx={{ color: 'success.main' }} />
                ) : (
                  <RadarOutlined fontSize="small" sx={{ color: 'text.disabled' }} />
                )}
                <Typography
                  variant="body2"
                  color={done ? 'success.main' : 'text.secondary'}
                  sx={{ fontWeight: 700 }}
                >
                  {done ? 'В журнале' : 'Доступна'}
                </Typography>
              </Stack>
              <Typography sx={{ mb: 1.5 }}>{step.hint ?? step.prompt}</Typography>
              <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.75 }}>
                {step.targets.map((t) => (
                  <Chip key={t} label={t} size="small" sx={{ fontFamily: mono, fontWeight: 600 }} />
                ))}
              </Stack>
              <Typography
                variant="caption"
                color="text.disabled"
                sx={{ display: 'block', mt: 1.5 }}
              >
                {caseTitle}
              </Typography>
            </Card>
          );
        })}
      </Box>

      {/* My phrases */}
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
        <EditNoteOutlined sx={{ color: '#5bbf8f' }} />
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          Мои фразы
        </Typography>
      </Stack>

      {myPhrases.length === 0 ? (
        <Card sx={{ p: 3, mb: 5 }}>
          <Typography color="text.secondary">
            Пока пусто. В делах есть шаги «Своя фраза» — составь там фразы из своей жизни, и они
            появятся здесь.
          </Typography>
        </Card>
      ) : (
        <Stack spacing={2} sx={{ mb: 5 }}>
          {myPhrases.map(({ caseId, caseTitle, step }) => {
            const phrases = state.ownPhrases[step.id] ?? [];
            return (
              <Card key={step.id} sx={{ p: 2.5 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ cursor: 'pointer' }}
                  onClick={() => void navigate(`/case/${caseId}`)}
                >
                  {caseTitle}
                </Typography>
                <Chip
                  label={step.pattern}
                  size="small"
                  variant="outlined"
                  sx={{ fontFamily: mono, fontWeight: 600, ml: 1 }}
                />
                <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
                  {phrases.map((p, i) => (
                    <Chip
                      key={`${p}-${i}`}
                      label={p}
                      sx={{
                        fontFamily: mono,
                        fontWeight: 600,
                        backgroundColor: (t) => alpha(t.palette.success.main, 0.1),
                      }}
                    />
                  ))}
                </Stack>
              </Card>
            );
          })}
        </Stack>
      )}

      <Divider sx={{ my: 4 }} />
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            Сбросить прогресс
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Удалит все раскрытые дела, озарения и фразы из этого браузера.
          </Typography>
        </Box>
        <Button
          color="error"
          variant="outlined"
          startIcon={<DeleteOutlineOutlined />}
          onClick={handleReset}
        >
          Сбросить
        </Button>
      </Stack>
    </Box>
  );
}
