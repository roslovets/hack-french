import { useState } from 'react';

import AutoStoriesOutlined from '@mui/icons-material/AutoStoriesOutlined';
import EventRepeatOutlined from '@mui/icons-material/EventRepeatOutlined';
import InsightsOutlined from '@mui/icons-material/InsightsOutlined';
import PlayArrowOutlined from '@mui/icons-material/PlayArrowOutlined';
import TranslateOutlined from '@mui/icons-material/TranslateOutlined';
import { Box, Button, Card, Chip, LinearProgress, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

import { getWord, totalWords, wordCases, words } from '@/data/words';
import { dueWordDimensions, wordMasteryScore, wordTier } from '@/lib/word-lab';
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
          value={wordCases.length}
          label="дел о словах"
          color="#5b8cd6"
        />
      </Stack>

      <Stack direction="row" spacing={1.5} useFlexGap sx={{ flexWrap: 'wrap', mb: 5 }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<PlayArrowOutlined />}
          onClick={() => void navigate('/words/session')}
        >
          Начать сессию
        </Button>
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
        {wordCases.map((c) => {
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
              <Typography variant="caption" color="text.secondary" sx={{ fontFamily: mono }}>
                {solid}/{c.wordIds.length} слов закреплено
              </Typography>
            </Card>
          );
        })}
      </Box>

      <WordDossier word={dossier} onClose={() => setDossier(null)} />
    </Box>
  );
}
