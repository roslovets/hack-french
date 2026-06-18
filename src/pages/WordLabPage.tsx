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

import { getWord, totalWords, wordCategories, words } from '@/data/words';
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
import type { ProgressState } from '@/state/progress-context';
import type { Word, WordCase } from '@/types';

import { useProgress } from '@/state/useProgress';

import WordDossier from '@/components/words/WordDossier';

const TIER_COLOR: Record<ReviewTier, string> = {
  locked: '#5a5750',
  fresh: '#e8b24a',
  learning: '#cf8a4a',
  solid: '#5bbf8f',
};
const BOSS_RED = '#e5484d';

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

/** One curriculum theme: its words + a focused-drill entry. */
function ThemeCard({
  c,
  state,
  onOpenWord,
  onTrain,
}: {
  c: WordCase;
  state: ProgressState;
  onOpenWord: (w: Word) => void;
  onTrain: (caseId: string) => void;
}) {
  const solid = c.wordIds.filter((id) => wordTier(state, id) === 'solid').length;
  // Average mastery moves with every correct answer (unlike the "solid" milestone),
  // so a single drill visibly advances the bar.
  const avg = c.wordIds.length
    ? Math.round(
        (c.wordIds.reduce((s, id) => s + wordMasteryScore(state, id), 0) / c.wordIds.length) * 100,
      )
    : 0;
  return (
    <Card sx={{ p: 2.5, borderLeft: '3px solid', borderLeftColor: 'primary.main' }}>
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
              onClick={() => onOpenWord(w)}
              sx={{
                fontFamily: mono,
                fontWeight: 600,
                cursor: 'pointer',
                ...(tier !== 'locked' ? { color: tc, backgroundColor: alpha(tc, 0.14) } : {}),
              }}
            />
          );
        })}
      </Stack>
      <LinearProgress
        variant="determinate"
        value={avg}
        color={avg === 100 ? 'success' : 'primary'}
        sx={{ mb: 0.75 }}
      />
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontFamily: mono, display: 'block', mb: 1.5 }}
      >
        {avg}% владения · {solid}/{c.wordIds.length} закреплено
      </Typography>
      <Button
        size="small"
        variant="outlined"
        color="inherit"
        startIcon={<PlayArrowOutlined />}
        onClick={() => onTrain(c.id)}
        sx={{ borderColor: 'divider' }}
      >
        Тренировать тему
      </Button>
    </Card>
  );
}

/** The domain boss for a category — gated capstone. */
function BossCard({
  c,
  state,
  onChallenge,
}: {
  c: WordCase;
  state: ProgressState;
  onChallenge: (bossId: string) => void;
}) {
  const unlocked = bossUnlocked(state, c.wordIds);
  const ready = bossReadyCount(state, c.wordIds);
  return (
    <Card
      onClick={() => unlocked && onChallenge(c.id)}
      sx={{
        p: 2.5,
        borderLeft: '3px solid',
        borderLeftColor: unlocked ? BOSS_RED : 'divider',
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
            backgroundColor: alpha(BOSS_RED, 0.16),
            color: '#ff8f8f',
            fontWeight: 800,
            letterSpacing: '0.1em',
          }}
        />
        <Chip label={c.level} size="small" variant="outlined" />
        {!unlocked ? <LockOutlined fontSize="small" sx={{ color: 'text.disabled' }} /> : null}
      </Stack>
      <Typography sx={{ fontWeight: 700, fontSize: 18, mb: 1.5 }}>{c.title}</Typography>
      {unlocked ? (
        <Button
          variant="contained"
          startIcon={<MilitaryTechOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            onChallenge(c.id);
          }}
          sx={{ backgroundColor: BOSS_RED, '&:hover': { backgroundColor: '#c93b40' } }}
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
          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: mono }}>
            {ready}/{c.wordIds.length} слов готовы
          </Typography>
        </Box>
      )}
    </Card>
  );
}

const GRID_SX = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr' },
  gap: 2,
} as const;

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

  // Group themes into categories; anything unmapped falls into "Остальное".
  const categorized = new Set(wordCategories.flatMap((cat) => cat.themes));
  const leftover = curriculumCases.filter((c) => !categorized.has(c.theme));
  const sections = [
    ...wordCategories.map((cat) => ({
      key: cat.id,
      title: cat.title,
      cases: curriculumCases.filter((c) => cat.themes.includes(c.theme)),
      boss: bossCases.find((b) => b.id === cat.bossId),
    })),
    ...(leftover.length
      ? [{ key: '_other', title: 'Остальное', cases: leftover, boss: undefined }]
      : []),
  ].filter((s) => s.cases.length > 0);

  const openWord = (w: Word) => setDossier(w);
  const train = (caseId: string) => void navigate(`/words/session?case=${caseId}`);
  const challenge = (bossId: string) => void navigate(`/words/boss/${bossId}`);

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

      {sections.map((section) => {
        const allIds = section.cases.flatMap((c) => c.wordIds);
        const solid = allIds.filter((id) => wordTier(state, id) === 'solid').length;
        const avg = allIds.length
          ? Math.round(
              (allIds.reduce((s, id) => s + wordMasteryScore(state, id), 0) / allIds.length) * 100,
            )
          : 0;
        return (
          <Box key={section.key} sx={{ mb: 5 }}>
            <Stack
              direction="row"
              spacing={1.5}
              sx={{ alignItems: 'baseline', flexWrap: 'wrap', mb: 2 }}
            >
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                {section.title}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontFamily: mono }}>
                {avg}% · {solid}/{allIds.length} закреплено
              </Typography>
            </Stack>
            <Box sx={GRID_SX}>
              {section.cases.map((c) => (
                <ThemeCard key={c.id} c={c} state={state} onOpenWord={openWord} onTrain={train} />
              ))}
            </Box>
            {section.boss ? (
              <Box sx={{ mt: 2, maxWidth: { sm: 440 } }}>
                <BossCard c={section.boss} state={state} onChallenge={challenge} />
              </Box>
            ) : null}
          </Box>
        );
      })}

      <WordDossier word={dossier} onClose={() => setDossier(null)} />
    </Box>
  );
}
