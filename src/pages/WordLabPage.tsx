import { useState } from 'react';

import AutoStoriesOutlined from '@mui/icons-material/AutoStoriesOutlined';
import EventRepeatOutlined from '@mui/icons-material/EventRepeatOutlined';
import InsightsOutlined from '@mui/icons-material/InsightsOutlined';
import LockOutlined from '@mui/icons-material/LockOutlined';
import MilitaryTechOutlined from '@mui/icons-material/MilitaryTechOutlined';
import PlayArrowOutlined from '@mui/icons-material/PlayArrowOutlined';
import TranslateOutlined from '@mui/icons-material/TranslateOutlined';
import { Box, Button, Card, Chip, LinearProgress, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

import { getWord, totalWords, words } from '@/data/words';
import {
  bossCases,
  bossReadyCount,
  bossUnlocked,
  curriculumCases,
  dueWordDimensions,
  wordMasteryScore,
  wordTier,
} from '@/lib/word-lab';
import { useNow } from '@/lib/useNow';
import { mono } from '@/theme';
import type { ReviewTier } from '@/lib/review';
import type { Word } from '@/types';

const TIER_COLOR: Record<ReviewTier, string> = {
  locked: '#5a5750',
  fresh: '#e8b24a',
  learning: '#cf8a4a',
  solid: '#5bbf8f',
};

import { useProgress } from '@/state/useProgress';

import WordDossier from '@/components/words/WordDossier';

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
        minWidth: 132,
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

export default function WordLabPage() {
  const navigate = useNavigate();
  const { state } = useProgress();
  const now = useNow();
  const [dossier, setDossier] = useState<Word | null>(null);

  const introduced = Object.keys(state.wordMastery).length;
  const avg = totalWords
    ? Math.round(
        (words.reduce((sum, w) => sum + wordMasteryScore(state, w.id), 0) / totalWords) * 100,
      )
    : 0;
  const dueWords = new Set(dueWordDimensions(state, now).map((d) => d.wordId)).size;
  const trainedIds = new Set(
    curriculumCases.flatMap((c) =>
      c.steps.map((s) => s.wordId).filter((id): id is string => Boolean(id)),
    ),
  );
  const newCount = [...trainedIds].filter((id) => !state.wordMastery[id]).length;

  return (
    <Box>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 1 }}>
        <TranslateOutlined sx={{ color: 'primary.main', fontSize: 32 }} />
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Слова
        </Typography>
      </Stack>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Не зубри пары «слово — перевод». Расследуй, как слово живёт: что значит в контексте, с чем
        сочетается, чем отличается от соседей.
      </Typography>

      <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: 'wrap', mb: 4 }}>
        <StatTile
          icon={<AutoStoriesOutlined />}
          value={`${introduced}/${totalWords}`}
          label="слов в работе"
          color="#e8b24a"
        />
        <StatTile
          icon={<InsightsOutlined />}
          value={`${avg}%`}
          label="среднее владение"
          color="#5bbf8f"
        />
        <StatTile
          icon={<EventRepeatOutlined />}
          value={dueWords}
          label="к повторению"
          color="#cf8a4a"
        />
        <StatTile
          icon={<TranslateOutlined />}
          value={curriculumCases.length}
          label="дел о словах"
          color="#5b8cd6"
        />
      </Stack>

      <Stack
        direction="row"
        spacing={1.5}
        useFlexGap
        sx={{ flexWrap: 'wrap', mb: 5, alignItems: 'center' }}
      >
        <Button
          variant="contained"
          size="large"
          startIcon={<PlayArrowOutlined />}
          onClick={() => void navigate('/words/session')}
        >
          Начать сессию
        </Button>
        {newCount > 0 || dueWords > 0 ? (
          <Typography variant="body2" color="text.secondary">
            {[
              newCount > 0 ? `${newCount} новых` : null,
              dueWords > 0 ? `${dueWords} к повторению` : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </Typography>
        ) : null}
      </Stack>

      <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
        Дела о словах
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr' },
          gap: 2,
        }}
      >
        {curriculumCases.map((c) => {
          const solid = c.wordIds.filter((id) => wordTier(state, id) === 'solid').length;
          const pct = c.wordIds.length ? Math.round((solid / c.wordIds.length) * 100) : 0;
          return (
            <Card
              key={c.id}
              sx={{ p: 2.5, borderLeft: '3px solid', borderLeftColor: 'primary.main' }}
            >
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1.5 }}>
                <Chip label={c.level} size="small" variant="outlined" />
                <Typography variant="caption" color="text.secondary" sx={{ fontFamily: mono }}>
                  {c.theme}
                </Typography>
              </Stack>
              <Typography sx={{ fontWeight: 700, fontSize: 18, mb: 1.5 }}>{c.title}</Typography>
              <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.75, mb: 2 }}>
                {c.wordIds.map((id) => {
                  const w = getWord(id);
                  if (!w) return null;
                  const tier = wordTier(state, id);
                  const tc = TIER_COLOR[tier];
                  return (
                    <Chip
                      key={id}
                      label={w.lemma}
                      size="small"
                      onClick={() => setDossier(w)}
                      sx={{
                        fontFamily: mono,
                        fontWeight: 600,
                        cursor: 'pointer',
                        ...(tier !== 'locked'
                          ? { color: tc, backgroundColor: alpha(tc, 0.14) }
                          : {}),
                      }}
                    />
                  );
                })}
              </Stack>
              <LinearProgress
                variant="determinate"
                value={pct}
                color={pct === 100 ? 'success' : 'primary'}
                sx={{ mb: 0.75 }}
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontFamily: mono, display: 'block', mb: 1.5 }}
              >
                {solid}/{c.wordIds.length} слов закреплено
              </Typography>
              <Button
                size="small"
                variant="outlined"
                color="inherit"
                startIcon={<PlayArrowOutlined />}
                onClick={() => void navigate(`/words/session?case=${c.id}`)}
                sx={{ borderColor: 'divider' }}
              >
                Тренировать тему
              </Button>
            </Card>
          );
        })}
      </Box>

      {bossCases.length ? (
        <>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mt: 5, mb: 1 }}>
            <MilitaryTechOutlined sx={{ color: '#e5484d' }} />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Босс-битвы
            </Typography>
          </Stack>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Капстоун темы без подсказок: открывается, когда все её слова дойдут до уровня «в
            работе».
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 2,
            }}
          >
            {bossCases.map((c) => {
              const unlocked = bossUnlocked(state, c.wordIds);
              const ready = bossReadyCount(state, c.wordIds);
              return (
                <Card
                  key={c.id}
                  onClick={() => unlocked && void navigate(`/words/boss/${c.id}`)}
                  sx={{
                    p: 2.5,
                    borderLeft: '3px solid',
                    borderLeftColor: unlocked ? '#e5484d' : 'divider',
                    opacity: unlocked ? 1 : 0.72,
                    cursor: unlocked ? 'pointer' : 'default',
                    transition: 'border-color 140ms ease',
                    '&:hover': unlocked ? { borderLeftColor: '#ff8f8f' } : undefined,
                  }}
                >
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1.5 }}>
                    <Chip
                      label="BOSS"
                      size="small"
                      sx={{
                        backgroundColor: alpha('#e5484d', 0.16),
                        color: '#ff8f8f',
                        fontWeight: 800,
                        letterSpacing: '0.1em',
                      }}
                    />
                    <Chip label={c.level} size="small" variant="outlined" />
                    {!unlocked ? (
                      <LockOutlined fontSize="small" sx={{ color: 'text.disabled' }} />
                    ) : null}
                  </Stack>
                  <Typography sx={{ fontWeight: 700, fontSize: 18, mb: 1.5 }}>{c.title}</Typography>
                  {unlocked ? (
                    <Button
                      variant="contained"
                      startIcon={<MilitaryTechOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        void navigate(`/words/boss/${c.id}`);
                      }}
                      sx={{ backgroundColor: '#e5484d', '&:hover': { backgroundColor: '#c93b40' } }}
                    >
                      Бросить вызов
                    </Button>
                  ) : (
                    <Box>
                      <LinearProgress
                        variant="determinate"
                        value={Math.round((ready / c.wordIds.length) * 100)}
                        sx={{ mb: 0.75 }}
                      />
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontFamily: mono }}
                      >
                        {ready}/{c.wordIds.length} слов готовы
                      </Typography>
                    </Box>
                  )}
                </Card>
              );
            })}
          </Box>
        </>
      ) : null}

      <WordDossier word={dossier} onClose={() => setDossier(null)} />
    </Box>
  );
}
