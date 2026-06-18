import { useState } from 'react';

import ArrowForwardOutlined from '@mui/icons-material/ArrowForwardOutlined';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import LockOutlined from '@mui/icons-material/LockOutlined';
import MenuBookOutlined from '@mui/icons-material/MenuBookOutlined';
import MilitaryTechOutlined from '@mui/icons-material/MilitaryTechOutlined';
import ReplayOutlined from '@mui/icons-material/ReplayOutlined';
import { Box, Button, Card, Chip, LinearProgress, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useNavigate, useParams } from 'react-router-dom';

import TaskRenderer from '@/components/tasks/TaskRenderer';
import SpeakButton from '@/components/words/SpeakButton';
import WordDossier from '@/components/words/WordDossier';
import { getWord, getWordCase } from '@/data/words';
import { bossReadyCount, bossUnlocked, wordMasteryScore, wordTier } from '@/lib/word-lab';
import { display, mono } from '@/theme';
import type { ReviewTier } from '@/lib/review';
import type { Word } from '@/types';

import { useProgress } from '@/state/useProgress';

const BOSS_RED = '#e5484d';

/** Word chip whose colour reflects its mastery tier. */
function WordChip({
  word,
  tier,
  onOpen,
}: {
  word: Word;
  tier: ReviewTier;
  onOpen: (w: Word) => void;
}) {
  const solid = tier === 'solid';
  const learning = tier === 'learning';
  const color = solid ? '#5bbf8f' : learning ? '#cf8a4a' : '#e8b24a';
  return (
    <Chip
      label={word.lemma}
      size="small"
      onClick={() => onOpen(word)}
      sx={{
        fontFamily: mono,
        fontWeight: 600,
        cursor: 'pointer',
        color,
        backgroundColor: alpha(color, 0.14),
      }}
    />
  );
}

export default function WordBossPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, gradeWordDimension } = useProgress();
  const boss = id ? getWordCase(id) : undefined;

  const [phase, setPhase] = useState<'intro' | 'playing' | 'done'>('intro');
  const [index, setIndex] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [dossier, setDossier] = useState<Word | null>(null);
  // Snapshot mastery the moment the battle starts, so the result map can show
  // what the boss actually moved (state mutates as we grade each step).
  const [before] = useState(() =>
    boss ? Object.fromEntries(boss.wordIds.map((w) => [w, wordMasteryScore(state, w)])) : {},
  );

  if (!boss || !boss.isBoss) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Босс не найден
        </Typography>
        <Button variant="contained" onClick={() => void navigate('/words')}>
          К словам
        </Button>
      </Box>
    );
  }

  const unlocked = bossUnlocked(state, boss.wordIds);
  const steps = boss.steps;

  // ── Intro / locked gate ────────────────────────────────────────────────
  if (phase === 'intro') {
    const ready = bossReadyCount(state, boss.wordIds);
    return (
      <Box sx={{ maxWidth: 640, mx: 'auto' }}>
        <Button
          color="inherit"
          onClick={() => void navigate('/words')}
          sx={{ color: 'text.secondary', mb: 2 }}
        >
          ← К словам
        </Button>
        <Card sx={{ p: { xs: 3, md: 4 }, borderTop: '3px solid', borderTopColor: BOSS_RED }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 1 }}>
            <MilitaryTechOutlined sx={{ color: BOSS_RED, fontSize: 30 }} />
            <Chip
              label="BOSS"
              size="small"
              sx={{
                backgroundColor: alpha(BOSS_RED, 0.16),
                color: '#ff8f8f',
                fontWeight: 800,
                letterSpacing: '0.12em',
              }}
            />
          </Stack>
          <Typography sx={{ fontFamily: display, fontWeight: 800, fontSize: 28, mb: 1 }}>
            {boss.title}
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2.5 }}>
            Финальная проверка темы: ни одной подсказки про конкретное слово — только живые сцены,
            где надо узнать слово на слух, не спутать с соседом и собрать естественную фразу.
          </Typography>

          <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            Слова на проверке ({boss.wordIds.length})
          </Typography>
          <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.75, mb: 3 }}>
            {boss.wordIds.map((wid) => {
              const w = getWord(wid);
              if (!w) return null;
              return (
                <WordChip key={wid} word={w} tier={wordTier(state, wid)} onOpen={setDossier} />
              );
            })}
          </Stack>

          {unlocked ? (
            <Button
              variant="contained"
              size="large"
              startIcon={<MilitaryTechOutlined />}
              onClick={() => {
                setPhase('playing');
                window.scrollTo({ top: 0 });
              }}
              sx={{
                backgroundColor: BOSS_RED,
                '&:hover': { backgroundColor: '#c93b40' },
              }}
            >
              Бросить вызов
            </Button>
          ) : (
            <Box>
              <Stack
                direction="row"
                spacing={1}
                sx={{ alignItems: 'center', color: 'text.secondary', mb: 1 }}
              >
                <LockOutlined fontSize="small" />
                <Typography variant="body2">
                  Открывается, когда все слова темы дойдут до уровня «в работе».
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={Math.round((ready / boss.wordIds.length) * 100)}
                sx={{ mb: 0.75 }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ fontFamily: mono }}>
                {ready}/{boss.wordIds.length} слов готовы
              </Typography>
            </Box>
          )}
        </Card>
        <WordDossier word={dossier} onClose={() => setDossier(null)} />
      </Box>
    );
  }

  // ── Result map ─────────────────────────────────────────────────────────
  if (phase === 'done') {
    const rows = boss.wordIds
      .map((wid) => ({
        word: getWord(wid),
        wid,
        tier: wordTier(state, wid),
        after: wordMasteryScore(state, wid),
        delta: wordMasteryScore(state, wid) - (before[wid] ?? 0),
      }))
      .filter((r): r is typeof r & { word: Word } => Boolean(r.word));
    const mastered = rows.filter((r) => r.tier === 'solid');
    const review = rows.filter((r) => r.tier !== 'solid');

    return (
      <Box sx={{ maxWidth: 640, mx: 'auto' }}>
        <Card sx={{ p: { xs: 3, md: 4 }, textAlign: 'center' }}>
          <MilitaryTechOutlined sx={{ fontSize: 52, color: BOSS_RED, mb: 1 }} />
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
            Босс пройден
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            {correct} из {steps.length} верно. Вот что показала проверка.
          </Typography>
        </Card>

        {mastered.length ? (
          <Box sx={{ mt: 3 }}>
            <Typography variant="overline" sx={{ color: '#5bbf8f', display: 'block', mb: 1 }}>
              Готовы к активному использованию ({mastered.length})
            </Typography>
            <Stack spacing={1}>
              {mastered.map((r) => (
                <ResultRow key={r.wid} row={r} onOpen={setDossier} />
              ))}
            </Stack>
          </Box>
        ) : null}

        {review.length ? (
          <Box sx={{ mt: 3 }}>
            <Typography variant="overline" sx={{ color: '#cf8a4a', display: 'block', mb: 1 }}>
              Ещё стоит повторить ({review.length})
            </Typography>
            <Stack spacing={1}>
              {review.map((r) => (
                <ResultRow key={r.wid} row={r} onOpen={setDossier} />
              ))}
            </Stack>
          </Box>
        ) : null}

        <Stack
          direction="row"
          spacing={1.5}
          sx={{ justifyContent: 'center', flexWrap: 'wrap', mt: 4 }}
          useFlexGap
        >
          <Button variant="contained" onClick={() => void navigate('/words')}>
            К словам
          </Button>
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<ReplayOutlined />}
            sx={{ borderColor: 'divider' }}
            onClick={() => {
              setPhase('playing');
              setIndex(0);
              setAnswered(false);
              setCorrect(0);
              window.scrollTo({ top: 0 });
            }}
          >
            Ещё раз
          </Button>
        </Stack>
        <WordDossier word={dossier} onClose={() => setDossier(null)} />
      </Box>
    );
  }

  // ── Playing ────────────────────────────────────────────────────────────
  const item = steps[index];
  if (!item) return null;
  const word = item.wordId ? getWord(item.wordId) : undefined;

  const handleComplete = () => {
    if (answered) return;
    if (item.wordId && item.dimension) {
      gradeWordDimension(item.wordId, item.dimension, true);
    }
    setCorrect((n) => n + 1);
    setAnswered(true);
  };

  const next = () => {
    if (index >= steps.length - 1) {
      setPhase('done');
    } else {
      setIndex((i) => i + 1);
      setAnswered(false);
    }
    window.scrollTo({ top: 0 });
  };

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto' }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 2 }}>
        <Button
          color="inherit"
          onClick={() => void navigate('/words')}
          sx={{ color: 'text.secondary' }}
        >
          ← Выйти
        </Button>
        <Box sx={{ flex: 1 }} />
        {word ? (
          <>
            <SpeakButton text={word.lemma} src={word.audio?.isolated} />
            <Button
              size="small"
              color="inherit"
              startIcon={<MenuBookOutlined />}
              onClick={() => setDossier(word)}
              sx={{ color: 'text.secondary' }}
            >
              слово:{' '}
              <Box component="span" sx={{ fontFamily: mono, fontWeight: 700, ml: 0.5 }}>
                {word.lemma}
              </Box>
            </Button>
          </>
        ) : null}
      </Stack>

      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 3 }}>
        <Box sx={{ flex: 1 }}>
          <LinearProgress
            variant="determinate"
            value={Math.round(((index + 1) / steps.length) * 100)}
            sx={{
              '& .MuiLinearProgress-bar': { backgroundColor: BOSS_RED },
            }}
          />
        </Box>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontFamily: mono, fontWeight: 700 }}
        >
          {index + 1}/{steps.length}
        </Typography>
      </Stack>

      <Card sx={{ p: { xs: 2.5, md: 3.5 }, borderTop: '2px solid', borderTopColor: BOSS_RED }}>
        <TaskRenderer
          key={item.id}
          step={item}
          boss
          completed={false}
          onComplete={handleComplete}
        />

        <Stack
          direction="row"
          sx={{
            mt: 3,
            pt: 2.5,
            borderTop: '1px solid',
            borderColor: 'divider',
            justifyContent: 'flex-end',
          }}
        >
          <Button
            variant="contained"
            endIcon={index >= steps.length - 1 ? <CheckCircleOutlined /> : <ArrowForwardOutlined />}
            disabled={!answered}
            onClick={next}
          >
            {index >= steps.length - 1 ? 'Завершить' : 'Далее'}
          </Button>
        </Stack>
      </Card>

      <WordDossier word={dossier} onClose={() => setDossier(null)} />
    </Box>
  );
}

/** One word row in the result map: lemma + tier-coloured mastery + delta. */
function ResultRow({
  row,
  onOpen,
}: {
  row: { word: Word; tier: ReviewTier; after: number; delta: number };
  onOpen: (w: Word) => void;
}) {
  const pct = Math.round(row.after * 100);
  const delta = Math.round(row.delta * 100);
  const solid = row.tier === 'solid';
  const color = solid ? '#5bbf8f' : '#cf8a4a';
  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={() => onOpen(row.word)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(row.word);
        }
      }}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        p: 1.25,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        borderLeft: '3px solid',
        borderLeftColor: color,
        cursor: 'pointer',
        '&:hover': { borderColor: color },
      }}
    >
      <Typography sx={{ fontFamily: mono, fontWeight: 700, minWidth: 120 }}>
        {row.word.lemma}
      </Typography>
      <Box sx={{ flex: 1 }}>
        <LinearProgress
          variant="determinate"
          value={pct}
          sx={{ '& .MuiLinearProgress-bar': { backgroundColor: color } }}
        />
      </Box>
      <Typography
        variant="caption"
        sx={{ fontFamily: mono, color, minWidth: 64, textAlign: 'right' }}
      >
        {pct}%{delta > 0 ? ` +${delta}` : ''}
      </Typography>
    </Box>
  );
}
