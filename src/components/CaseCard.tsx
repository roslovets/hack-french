import ArrowForwardOutlined from '@mui/icons-material/ArrowForwardOutlined';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import LocalFireDepartmentOutlined from '@mui/icons-material/LocalFireDepartmentOutlined';
import { Box, Card, CardActionArea, Chip, LinearProgress, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

import { getMechanism, getScene } from '@/data';
import { display, mono } from '@/theme';
import type { Case } from '@/types';

import { useProgress } from '@/state/useProgress';

const difficultyMeta: Record<Case['difficulty'], { label: string; color: string }> = {
  easy: { label: 'Лёгкое', color: '#5bbf8f' },
  medium: { label: 'Среднее', color: '#cf8a4a' },
  hard: { label: 'Сложное', color: '#e5484d' },
};

export default function CaseCard({ caseItem }: { caseItem: Case }) {
  const navigate = useNavigate();
  const { isCaseCompleted, completedStepCount } = useProgress();

  const completed = isCaseCompleted(caseItem.id);
  const doneSteps = completedStepCount(caseItem.id);
  const total = caseItem.steps.length;
  const pct = Math.round((Math.min(doneSteps, total) / total) * 100);
  const started = doneSteps > 0 && !completed;
  const diff = difficultyMeta[caseItem.difficulty];
  const mechanismToken = getMechanism(caseItem.mechanism)?.token ?? '';

  const spine = completed ? '#5bbf8f' : caseItem.isBoss ? '#e5484d' : '#e8b24a';

  return (
    <Card
      sx={{
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        borderColor: completed
          ? alpha('#5bbf8f', 0.4)
          : caseItem.isBoss
            ? alpha('#e5484d', 0.4)
            : 'divider',
        borderLeft: '3px solid',
        borderLeftColor: spine,
        transition: 'border-color 160ms ease, background-color 160ms ease',
        '&:hover': {
          borderColor: 'primary.main',
          borderLeftColor: spine,
          backgroundColor: (t) => alpha(t.palette.primary.main, 0.05),
        },
      }}
    >
      {/* "SOLVED" stamp */}
      {completed ? (
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            top: 18,
            right: -28,
            transform: 'rotate(12deg)',
            fontFamily: mono,
            fontWeight: 700,
            fontSize: 11,
            letterSpacing: '0.18em',
            color: alpha('#5bbf8f', 0.85),
            border: '2px solid',
            borderColor: alpha('#5bbf8f', 0.5),
            borderRadius: 1,
            px: 3,
            py: 0.25,
            pointerEvents: 'none',
            opacity: 0.9,
          }}
        >
          РАСКРЫТО
        </Box>
      ) : null}

      <CardActionArea
        onClick={() => void navigate(`/case/${caseItem.id}`)}
        sx={{ height: '100%', p: 2.5, alignItems: 'stretch' }}
      >
        <Stack sx={{ height: '100%' }}>
          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}
          >
            {caseItem.isBoss ? (
              <Chip
                icon={<LocalFireDepartmentOutlined sx={{ fontSize: 16 }} />}
                label="БОСС"
                size="small"
                sx={{
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  color: '#e5484d',
                  backgroundColor: alpha('#e5484d', 0.14),
                }}
              />
            ) : (
              <Chip
                label={mechanismToken}
                size="small"
                variant="outlined"
                sx={{
                  fontFamily: mono,
                  fontWeight: 700,
                  color: 'primary.main',
                  borderColor: (t) => alpha(t.palette.primary.main, 0.4),
                }}
              />
            )}
            <Typography
              sx={{ fontFamily: mono, fontSize: 11, color: diff.color, fontWeight: 700, ml: 0.5 }}
            >
              {diff.label}
            </Typography>
            <Box sx={{ flex: 1 }} />
          </Stack>

          <Typography
            sx={{
              fontFamily: display,
              fontWeight: 700,
              fontSize: 19,
              lineHeight: 1.25,
              mb: 1.5,
              pr: completed ? 4 : 0,
            }}
          >
            {caseItem.title}
          </Typography>

          <Box
            sx={{
              fontFamily: mono,
              fontSize: 12.5,
              color: 'text.secondary',
              px: 1.25,
              py: 0.85,
              borderRadius: 1,
              backgroundColor: (t) => alpha(t.palette.text.primary, 0.035),
              border: '1px dashed',
              borderColor: 'divider',
              mb: 2,
              overflowWrap: 'anywhere',
            }}
          >
            <Box component="span" sx={{ color: 'primary.main', mr: 0.75 }}>
              ›
            </Box>
            {caseItem.strangeness}
          </Box>

          <Box sx={{ flex: 1 }} />

          <Stack direction="row" spacing={0.5} sx={{ mb: 1.5 }}>
            {caseItem.scenes.slice(0, 4).map((sceneId) => {
              const scene = getScene(sceneId);
              return scene ? (
                <Typography key={sceneId} sx={{ fontSize: 18 }} title={scene.name}>
                  {scene.emoji}
                </Typography>
              ) : null;
            })}
          </Stack>

          {completed ? (
            <Stack
              direction="row"
              spacing={0.75}
              sx={{ alignItems: 'center', color: 'success.main' }}
            >
              <CheckCircleOutlined fontSize="small" />
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                Дело раскрыто
              </Typography>
            </Stack>
          ) : started ? (
            <Box>
              <LinearProgress variant="determinate" value={pct} sx={{ mb: 0.75 }} />
              <Typography variant="caption" sx={{ fontFamily: mono }} color="text.secondary">
                {doneSteps}/{total} шагов
              </Typography>
            </Box>
          ) : (
            <Stack
              direction="row"
              spacing={0.5}
              sx={{ alignItems: 'center', color: 'primary.main' }}
            >
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                Расследовать
              </Typography>
              <ArrowForwardOutlined fontSize="small" />
            </Stack>
          )}
        </Stack>
      </CardActionArea>
    </Card>
  );
}
