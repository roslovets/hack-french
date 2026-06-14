import { useMemo, useState } from 'react';

import BoltOutlined from '@mui/icons-material/BoltOutlined';
import EventRepeatOutlined from '@mui/icons-material/EventRepeatOutlined';
import TaskAltOutlined from '@mui/icons-material/TaskAltOutlined';
import TravelExploreOutlined from '@mui/icons-material/TravelExploreOutlined';
import WhatshotOutlined from '@mui/icons-material/WhatshotOutlined';
import { Box, Button, Card, Chip, LinearProgress, Stack, Tooltip, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

import ReviewItem from '@/components/review/ReviewItem';
import {
  buildSession,
  dueCaseIds,
  mechanismMap,
  weakestCaseIds,
  type ReviewItemData,
  type ReviewTier,
} from '@/lib/review';
import { useNow } from '@/lib/useNow';
import { mono } from '@/theme';

import { useProgress } from '@/state/useProgress';

const TIER_COLOR: Record<ReviewTier, string> = {
  locked: '#5a5750',
  fresh: '#e8b24a',
  learning: '#cf8a4a',
  solid: '#5bbf8f',
};
const TIER_RANK: Record<ReviewTier, number> = { fresh: 0, learning: 1, solid: 2, locked: 3 };
const TIER_LABEL: Record<ReviewTier, string> = {
  locked: 'не начат',
  fresh: 'свежо',
  learning: 'повторяй',
  solid: 'крепко',
};

function StatTile({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode;
  value: React.ReactNode;
  label: string;
  color: string;
}) {
  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 130,
        p: 2,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        borderTop: '2px solid',
        borderTopColor: color,
        backgroundColor: alpha(color, 0.05),
      }}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', color, mb: 0.5 }}>
        {icon}
        <Typography sx={{ fontFamily: mono, fontWeight: 700, fontSize: 24, lineHeight: 1 }}>
          {value}
        </Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    </Box>
  );
}

export default function ReviewPage() {
  const navigate = useNavigate();
  const { state, gradeReview } = useProgress();

  const [mode, setMode] = useState<'overview' | 'session' | 'done'>('overview');
  const [session, setSession] = useState<ReviewItemData[]>([]);
  const [sIndex, setSIndex] = useState(0);
  const [sCorrect, setSCorrect] = useState(0);

  const now = useNow();
  const due = useMemo(() => dueCaseIds(state, now), [state, now]);
  const mechMap = useMemo(
    () =>
      mechanismMap(state)
        .filter((m) => m.solved > 0 || m.total > 0)
        .sort((a, b) => TIER_RANK[a.tier] - TIER_RANK[b.tier] || a.avgStrength - b.avgStrength),
    [state],
  );
  const solvedTotal = state.completedCases.length;

  function start(ids: string[]) {
    if (ids.length === 0) return;
    const seed = `${Date.now()}-${ids[0] ?? ''}`;
    setSession(buildSession(ids, seed, 10));
    setSIndex(0);
    setSCorrect(0);
    setMode('session');
    window.scrollTo({ top: 0 });
  }

  function handleGrade(correct: boolean) {
    const current = session[sIndex];
    if (current) gradeReview(current.caseId, correct);
    if (correct) setSCorrect((n) => n + 1);
  }

  function handleNext() {
    if (sIndex >= session.length - 1) {
      setMode('done');
    } else {
      setSIndex((i) => i + 1);
    }
    window.scrollTo({ top: 0 });
  }

  // --- Session ---
  if (mode === 'session') {
    const item = session[sIndex];
    if (!item) return null;
    return (
      <Box sx={{ maxWidth: 720, mx: 'auto' }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 2 }}>
          <Button
            color="inherit"
            onClick={() => setMode('overview')}
            sx={{ color: 'text.secondary' }}
          >
            ← Выйти
          </Button>
          <Box sx={{ flex: 1 }} />
          <Chip
            icon={<WhatshotOutlined sx={{ fontSize: 16 }} />}
            label={`серия ${state.reviewStreak}`}
            size="small"
            sx={{
              fontWeight: 700,
              color: state.reviewStreak > 0 ? '#e8b24a' : 'text.disabled',
              backgroundColor: (t) =>
                alpha(t.palette.primary.main, state.reviewStreak > 0 ? 0.12 : 0),
            }}
          />
        </Stack>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 3 }}>
          <Box sx={{ flex: 1 }}>
            <LinearProgress
              variant="determinate"
              value={Math.round(((sIndex + 1) / session.length) * 100)}
            />
          </Box>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontFamily: mono, fontWeight: 700 }}
          >
            {sIndex + 1}/{session.length}
          </Typography>
        </Stack>
        <Card sx={{ p: { xs: 2.5, md: 3.5 } }}>
          <ReviewItem
            key={sIndex}
            item={item}
            index={sIndex}
            total={session.length}
            onGrade={handleGrade}
            onNext={handleNext}
          />
        </Card>
      </Box>
    );
  }

  // --- Session summary ---
  if (mode === 'done') {
    return (
      <Box sx={{ maxWidth: 560, mx: 'auto' }}>
        <Card sx={{ p: { xs: 3, md: 5 }, textAlign: 'center' }}>
          <EventRepeatOutlined sx={{ fontSize: 52, color: 'primary.main', mb: 1 }} />
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
            Летучка пройдена
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            {sCorrect} из {session.length} — держится. Дела со сбоем вернутся на доследование
            раньше.
          </Typography>
          <Stack direction="row" spacing={2} sx={{ justifyContent: 'center', mb: 3 }}>
            <StatTile
              icon={<TaskAltOutlined />}
              value={`${sCorrect}/${session.length}`}
              label="верно"
              color="#5bbf8f"
            />
            <StatTile
              icon={<WhatshotOutlined />}
              value={state.reviewBest}
              label="лучшая серия"
              color="#e8b24a"
            />
          </Stack>
          <Stack
            direction="row"
            spacing={1.5}
            sx={{ justifyContent: 'center', flexWrap: 'wrap' }}
            useFlexGap
          >
            <Button variant="contained" onClick={() => setMode('overview')}>
              К повторению
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              onClick={() => void navigate('/')}
              sx={{ borderColor: 'divider' }}
            >
              К делам
            </Button>
          </Stack>
        </Card>
      </Box>
    );
  }

  // --- Overview ---
  return (
    <Box>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 1 }}>
        <EventRepeatOutlined sx={{ color: 'primary.main', fontSize: 32 }} />
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Повторение
        </Typography>
      </Stack>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Раскрытые дела со временем «остывают». Холодная перепроверка возвращает их по графику —
        чтобы механизм держался, а не забывался.
      </Typography>

      {solvedTotal === 0 ? (
        <Card sx={{ p: 5, textAlign: 'center' }}>
          <EventRepeatOutlined sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
          <Typography variant="h6" sx={{ mb: 1 }}>
            Пока нечего повторять
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Раскрой первые дела — и они появятся здесь на закрепление.
          </Typography>
          <Button variant="contained" onClick={() => void navigate('/')}>
            К делам
          </Button>
        </Card>
      ) : (
        <>
          <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: 'wrap', mb: 3 }}>
            <StatTile
              icon={<EventRepeatOutlined />}
              value={due.length}
              label="к повторению"
              color="#e8b24a"
            />
            <StatTile
              icon={<WhatshotOutlined />}
              value={state.reviewBest}
              label="лучшая серия"
              color="#cf8a4a"
            />
            <StatTile
              icon={<TravelExploreOutlined />}
              value={solvedTotal}
              label="дел раскрыто"
              color="#5bbf8f"
            />
          </Stack>

          <Stack direction="row" spacing={1.5} useFlexGap sx={{ flexWrap: 'wrap', mb: 5 }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<EventRepeatOutlined />}
              disabled={due.length === 0}
              onClick={() => start(due)}
            >
              {due.length > 0 ? `Начать летучку (${Math.min(due.length, 10)})` : 'Всё свежо'}
            </Button>
            <Button
              variant="outlined"
              size="large"
              color="inherit"
              startIcon={<BoltOutlined />}
              onClick={() => start(weakestCaseIds(state, 10))}
              sx={{ borderColor: 'divider' }}
            >
              Повторить слабые
            </Button>
          </Stack>

          {/* Mechanism map */}
          <Stack
            direction="row"
            spacing={1.5}
            sx={{ alignItems: 'baseline', mb: 1.5, flexWrap: 'wrap' }}
          >
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Карта механизмов
            </Typography>
            <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap' }}>
              {(['fresh', 'learning', 'solid', 'locked'] as ReviewTier[]).map((t) => (
                <Stack key={t} direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: 0.5,
                      backgroundColor: TIER_COLOR[t],
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {TIER_LABEL[t]}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Stack>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {mechMap.map((m) => {
              const c = TIER_COLOR[m.tier];
              return (
                <Tooltip
                  key={m.id}
                  title={`${m.name} · ${TIER_LABEL[m.tier]} (${m.solved}/${m.total} дел)`}
                  arrow
                >
                  <Box
                    sx={{
                      fontFamily: mono,
                      fontSize: 12.5,
                      fontWeight: 600,
                      px: 1.25,
                      py: 0.6,
                      borderRadius: 1.5,
                      border: '1px solid',
                      borderColor: alpha(c, m.tier === 'locked' ? 0.3 : 0.5),
                      color: m.tier === 'locked' ? 'text.disabled' : c,
                      backgroundColor: alpha(c, m.tier === 'locked' ? 0.04 : 0.1),
                    }}
                  >
                    {m.token}
                  </Box>
                </Tooltip>
              );
            })}
          </Box>
        </>
      )}
    </Box>
  );
}
