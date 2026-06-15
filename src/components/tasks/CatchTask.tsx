import RadarOutlined from '@mui/icons-material/RadarOutlined';
import TaskAltOutlined from '@mui/icons-material/TaskAltOutlined';
import { Alert, Box, Button, Chip, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

import { mono } from '@/theme';
import type { CatchStep } from '@/types';

import { useProgress } from '@/state/useProgress';

import { Prompt, TaskHeader } from './parts';

interface Props {
  step: CatchStep;
  boss?: boolean;
  onComplete: () => void;
}

export default function CatchTask({ step, boss, onComplete }: Props) {
  const { state, catchMission, logMission } = useProgress();
  const accepted = state.caughtMissions.includes(step.id);
  const logged = Boolean(state.missionLog[step.id]);

  function accept() {
    catchMission(step.id);
    onComplete();
  }

  return (
    <Box>
      <TaskHeader kind={step.kind} boss={boss} />
      <Prompt>{step.prompt}</Prompt>

      <Box
        sx={{
          p: 2.5,
          borderRadius: 2,
          border: '1px solid',
          borderColor: alpha('#5bbf8f', 0.35),
          backgroundColor: alpha('#5bbf8f', 0.06),
          mb: 2,
        }}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1.5 }}>
          <RadarOutlined sx={{ color: 'success.main' }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Миссия в реальный мир
          </Typography>
        </Stack>
        {step.hint ? (
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            {step.hint}
          </Typography>
        ) : null}
        <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          Цели для радара
        </Typography>
        <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
          {step.targets.map((t) => (
            <Chip
              key={t}
              label={t}
              sx={{
                fontFamily: mono,
                fontWeight: 600,
                color: 'success.main',
                backgroundColor: alpha('#5bbf8f', 0.12),
              }}
            />
          ))}
        </Stack>
      </Box>

      {!accepted ? (
        <Button variant="contained" color="success" startIcon={<RadarOutlined />} onClick={accept}>
          Беру миссию
        </Button>
      ) : logged ? (
        <Alert
          icon={<TaskAltOutlined fontSize="inherit" />}
          severity="success"
          variant="outlined"
          sx={{ borderRadius: 2 }}
        >
          Поймано в реальности 🎯 Так язык переходит из приложения в жизнь. Добавить заметку «где
          встретил» можно в Журнале миссий.
        </Alert>
      ) : (
        <Stack spacing={1.5}>
          <Alert
            icon={<TaskAltOutlined fontSize="inherit" />}
            severity="info"
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Миссия в журнале. Поймай механизм в живой речи — а потом отметь поимку здесь или в
            Журнале миссий.
          </Alert>
          <Box>
            <Button
              variant="contained"
              color="success"
              startIcon={<TaskAltOutlined />}
              onClick={() => logMission(step.id)}
            >
              Поймал в реальности
            </Button>
          </Box>
        </Stack>
      )}
    </Box>
  );
}
