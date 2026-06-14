import { useState } from 'react';

import ArrowBackOutlined from '@mui/icons-material/ArrowBackOutlined';
import ArrowForwardOutlined from '@mui/icons-material/ArrowForwardOutlined';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import LightbulbOutlined from '@mui/icons-material/LightbulbOutlined';
import LockOutlined from '@mui/icons-material/LockOutlined';
import RadioButtonUncheckedOutlined from '@mui/icons-material/RadioButtonUncheckedOutlined';
import RestartAltOutlined from '@mui/icons-material/RestartAltOutlined';
import { Box, Button, Card, Chip, LinearProgress, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useNavigate, useParams } from 'react-router-dom';

import TaskRenderer from '@/components/tasks/TaskRenderer';
import { taskMeta } from '@/components/tasks/taskMeta';
import { cases, getCase, getMechanism } from '@/data';
import { mono } from '@/theme';

import { useProgress } from '@/state/useProgress';

function StepRail({
  steps,
  current,
  allowedMax,
  isDone,
  onPick,
}: {
  steps: { id: string; kind: keyof typeof taskMeta }[];
  current: number;
  allowedMax: number;
  isDone: (id: string) => boolean;
  onPick: (i: number) => void;
}) {
  return (
    <Stack spacing={0.5}>
      {steps.map((s, i) => {
        const meta = taskMeta[s.kind];
        const done = isDone(s.id);
        const locked = i > allowedMax;
        const active = i === current;
        return (
          <Box
            key={s.id}
            role="button"
            tabIndex={locked ? -1 : 0}
            onClick={() => !locked && onPick(i)}
            onKeyDown={(e) => {
              if ((e.key === 'Enter' || e.key === ' ') && !locked) {
                e.preventDefault();
                onPick(i);
              }
            }}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              px: 1.25,
              py: 0.85,
              borderRadius: 2,
              cursor: locked ? 'default' : 'pointer',
              border: '1px solid',
              borderColor: active ? 'primary.main' : 'transparent',
              backgroundColor: (t) =>
                active ? alpha(t.palette.primary.main, 0.08) : 'transparent',
              opacity: locked ? 0.4 : 1,
              '&:hover': locked
                ? undefined
                : { backgroundColor: (t) => alpha(t.palette.text.primary, 0.04) },
            }}
          >
            {done ? (
              <CheckCircleOutlined fontSize="small" sx={{ color: 'success.main' }} />
            ) : locked ? (
              <LockOutlined fontSize="small" sx={{ color: 'text.disabled' }} />
            ) : (
              <RadioButtonUncheckedOutlined fontSize="small" sx={{ color: 'text.disabled' }} />
            )}
            <Typography
              variant="body2"
              sx={{
                fontWeight: active ? 700 : 500,
                color: active ? 'text.primary' : 'text.secondary',
              }}
            >
              {i + 1}. {meta.label}
            </Typography>
          </Box>
        );
      })}
    </Stack>
  );
}

function CaseComplete({
  insight,
  mechanismName,
  onNext,
  hasNext,
  onReplay,
}: {
  insight: string;
  mechanismName: string;
  onNext: () => void;
  hasNext: boolean;
  onReplay: () => void;
}) {
  const navigate = useNavigate();
  return (
    <Card sx={{ p: { xs: 3, md: 5 }, textAlign: 'center', borderColor: alpha('#5bbf8f', 0.4) }}>
      <CheckCircleOutlined sx={{ fontSize: 56, color: 'success.main', mb: 1 }} />
      <Typography variant="h4" sx={{ mb: 1, fontWeight: 800 }}>
        Дело раскрыто
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Механизм «{mechanismName}» взломан. Озарение отправилось в твою коллекцию.
      </Typography>

      <Box
        sx={{
          maxWidth: 520,
          mx: 'auto',
          p: 3,
          mb: 3,
          borderRadius: 3,
          border: '1px solid',
          borderColor: alpha('#f1c75b', 0.4),
          backgroundColor: alpha('#f1c75b', 0.08),
        }}
      >
        <Stack
          direction="row"
          spacing={1}
          sx={{ mb: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <LightbulbOutlined sx={{ color: '#f1c75b' }} />
          <Typography variant="overline" sx={{ color: '#f1c75b' }}>
            Озарение
          </Typography>
        </Stack>
        <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.4 }}>
          {insight}
        </Typography>
      </Box>

      <Stack
        direction="row"
        spacing={1.5}
        useFlexGap
        sx={{ justifyContent: 'center', flexWrap: 'wrap' }}
      >
        {hasNext ? (
          <Button variant="contained" endIcon={<ArrowForwardOutlined />} onClick={onNext}>
            Следующее дело
          </Button>
        ) : null}
        <Button
          variant="outlined"
          color="inherit"
          startIcon={<RestartAltOutlined />}
          onClick={onReplay}
          sx={{ borderColor: 'divider' }}
        >
          Пройти заново
        </Button>
        <Button variant="text" color="inherit" onClick={() => void navigate('/')}>
          Ко всем делам
        </Button>
      </Stack>
    </Card>
  );
}

export default function CasePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { completeStep, completeCase, resetCase, isStepCompleted, completedStepCount } =
    useProgress();

  const caseItem = id ? getCase(id) : undefined;

  const [index, setIndex] = useState(() => {
    if (!caseItem) return 0;
    const done = completedStepCount(caseItem.id);
    return Math.min(done, caseItem.steps.length - 1);
  });
  const [finished, setFinished] = useState(false);
  const [replayKey, setReplayKey] = useState(0);

  if (!caseItem) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Дело не найдено
        </Typography>
        <Button variant="contained" onClick={() => void navigate('/')}>
          Ко всем делам
        </Button>
      </Box>
    );
  }

  const steps = caseItem.steps;
  const step = steps[index];
  const total = steps.length;
  const doneCount = steps.filter((s) => isStepCompleted(caseItem.id, s.id)).length;
  const allowedMax = Math.max(index, completedStepCount(caseItem.id));
  const mechanism = getMechanism(caseItem.mechanism);
  const isLast = index === total - 1;

  if (!step) return null;

  const stepDone = isStepCompleted(caseItem.id, step.id);

  const currentCaseOrder = cases.findIndex((c) => c.id === caseItem.id);
  const nextCase = cases[currentCaseOrder + 1];

  function handleComplete() {
    if (!caseItem) return;
    completeStep(caseItem.id, step!.id);
  }

  function goNext() {
    if (!caseItem) return;
    if (isLast) {
      completeCase(caseItem.id, caseItem.mechanism, caseItem.insight, caseItem.isBoss);
      setFinished(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setIndex((i) => i + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function goToNextCase() {
    if (nextCase) void navigate(`/case/${nextCase.id}`);
    else void navigate('/');
  }

  function replayCase() {
    if (!caseItem) return;
    resetCase(caseItem.id);
    setIndex(0);
    setFinished(false);
    setReplayKey((k) => k + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function confirmReplay() {
    if (
      window.confirm(
        'Сбросить это дело и пройти заново? Прогресс, озарение и твои фразы по этому делу будут удалены.',
      )
    ) {
      replayCase();
    }
  }

  return (
    <Box>
      {/* Case header */}
      <Stack direction="row" spacing={1} sx={{ mb: 2, alignItems: 'center' }}>
        <Button
          startIcon={<ArrowBackOutlined />}
          color="inherit"
          onClick={() => void navigate('/')}
          sx={{ color: 'text.secondary' }}
        >
          Дела
        </Button>
        <Box sx={{ flex: 1 }} />
        {doneCount > 0 || finished ? (
          <Button
            size="small"
            color="inherit"
            startIcon={<RestartAltOutlined />}
            onClick={confirmReplay}
            sx={{ color: 'text.secondary' }}
          >
            Сбросить
          </Button>
        ) : null}
        {mechanism ? (
          <Chip
            label={mechanism.token}
            size="small"
            variant="outlined"
            sx={{
              fontFamily: mono,
              fontWeight: 700,
              color: 'primary.main',
              borderColor: alpha('#e8b24a', 0.4),
            }}
          />
        ) : null}
        {caseItem.isBoss ? (
          <Chip
            label="BOSS"
            size="small"
            sx={{ fontWeight: 800, color: '#ff8f8f', backgroundColor: alpha('#e5484d', 0.14) }}
          />
        ) : null}
      </Stack>

      <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5, lineHeight: 1.2 }}>
        {caseItem.title}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2.5 }}>
        {caseItem.question}
      </Typography>

      <Stack direction="row" spacing={1.5} sx={{ mb: 3, alignItems: 'center' }}>
        <Box sx={{ flex: 1 }}>
          <LinearProgress
            variant="determinate"
            value={Math.round((doneCount / total) * 100)}
            color={finished ? 'success' : 'primary'}
          />
        </Box>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontWeight: 700, fontFamily: mono }}
        >
          {doneCount}/{total}
        </Typography>
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 240px' },
          gap: 3,
          alignItems: 'start',
        }}
      >
        <Box>
          {finished ? (
            <CaseComplete
              insight={caseItem.insight}
              mechanismName={mechanism?.name ?? caseItem.title}
              onNext={goToNextCase}
              hasNext={Boolean(nextCase)}
              onReplay={confirmReplay}
            />
          ) : (
            <Card sx={{ p: { xs: 2.5, md: 3.5 } }}>
              <TaskRenderer
                key={`${step.id}-${replayKey}`}
                step={step}
                boss={caseItem.isBoss}
                completed={stepDone}
                onComplete={handleComplete}
              />

              <Stack
                direction="row"
                spacing={1.5}
                sx={{ mt: 3, pt: 2.5, borderTop: '1px solid', borderColor: 'divider' }}
              >
                <Button
                  color="inherit"
                  startIcon={<ArrowBackOutlined />}
                  disabled={index === 0}
                  onClick={() => setIndex((i) => Math.max(0, i - 1))}
                  sx={{ color: 'text.secondary' }}
                >
                  Назад
                </Button>
                <Box sx={{ flex: 1 }} />
                <Button
                  variant="contained"
                  endIcon={isLast ? <CheckCircleOutlined /> : <ArrowForwardOutlined />}
                  disabled={!stepDone}
                  onClick={goNext}
                >
                  {isLast ? 'Раскрыть дело' : 'Далее'}
                </Button>
              </Stack>
            </Card>
          )}
        </Box>

        {/* Side navigation through the steps */}
        <Box sx={{ display: { xs: 'none', md: 'block' }, position: 'sticky', top: 88 }}>
          <Typography variant="overline" color="text.secondary" sx={{ px: 1.25 }}>
            Шаги дела
          </Typography>
          <StepRail
            steps={steps.map((s) => ({ id: s.id, kind: s.kind }))}
            current={index}
            allowedMax={finished ? total - 1 : allowedMax}
            isDone={(sid) => isStepCompleted(caseItem.id, sid)}
            onPick={(i) => {
              setFinished(false);
              setIndex(i);
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}
