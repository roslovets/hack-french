import { useState } from 'react';

import ArrowForwardOutlined from '@mui/icons-material/ArrowForwardOutlined';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import MenuBookOutlined from '@mui/icons-material/MenuBookOutlined';
import { Box, Button, Card, Chip, LinearProgress, Stack, Typography } from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';

import TaskRenderer from '@/components/tasks/TaskRenderer';
import { getWord, getWordCase } from '@/data/words';
import { buildWordSession } from '@/lib/word-lab';
import { mono } from '@/theme';
import type { Word } from '@/types';

import { useProgress } from '@/state/useProgress';

import SpeakButton from '@/components/words/SpeakButton';
import WordDossier from '@/components/words/WordDossier';

export default function WordSessionPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { state, gradeWordDimension } = useProgress();

  // Optional themed drill: /words/session?case=<id> restricts the session to one
  // theme's words. Without it, the daily mixed session covers all words.
  const themeCase = params.get('case') ? getWordCase(params.get('case') ?? '') : undefined;
  const sessionOpts = themeCase
    ? {
        wordIds: themeCase.wordIds,
        limit: Math.max(8, themeCase.wordIds.length * 2),
        maxNew: themeCase.wordIds.length,
      }
    : { limit: 12 };
  const makeSession = (run: number) =>
    buildWordSession(
      state,
      `wl-${themeCase?.id ?? 'all'}-${Object.keys(state.wordMastery).length}-${run}`,
      sessionOpts,
    );

  // Session is rebuilt on "Ещё раз" with a fresh seed so the order varies; the
  // seed also shifts as more words are introduced.
  const [runId, setRunId] = useState(0);
  const [session, setSession] = useState(() => makeSession(0));
  const [index, setIndex] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const [dossier, setDossier] = useState<Word | null>(null);

  if (session.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Пока нет слов для сессии
        </Typography>
        <Button variant="contained" onClick={() => void navigate('/words')}>
          К словам
        </Button>
      </Box>
    );
  }

  if (done) {
    return (
      <Box sx={{ maxWidth: 560, mx: 'auto' }}>
        <Card sx={{ p: { xs: 3, md: 5 }, textAlign: 'center' }}>
          <CheckCircleOutlined sx={{ fontSize: 52, color: 'success.main', mb: 1 }} />
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
            Сессия пройдена
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            {correct} из {session.length} верно · затронуто слов:{' '}
            {new Set(session.map((s) => s.wordId)).size}. Владение подросло; слова со сбоем вернутся
            раньше.
          </Typography>
          <Stack
            direction="row"
            spacing={1.5}
            sx={{ justifyContent: 'center', flexWrap: 'wrap' }}
            useFlexGap
          >
            <Button variant="contained" onClick={() => void navigate('/words')}>
              К словам
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              sx={{ borderColor: 'divider' }}
              onClick={() => {
                const nextRun = runId + 1;
                setRunId(nextRun);
                setSession(makeSession(nextRun));
                setIndex(0);
                setAnswered(false);
                setCorrect(0);
                setDone(false);
                window.scrollTo({ top: 0 });
              }}
            >
              Ещё раз
            </Button>
          </Stack>
        </Card>
      </Box>
    );
  }

  const item = session[index];
  if (!item) return null;
  const word = getWord(item.wordId);

  function handleComplete() {
    if (answered) return;
    if (item && item.step.wordId && item.step.dimension) {
      gradeWordDimension(item.step.wordId, item.step.dimension, true);
    }
    setCorrect((n) => n + 1);
    setAnswered(true);
  }

  function next() {
    if (index >= session.length - 1) {
      setDone(true);
    } else {
      setIndex((i) => i + 1);
      setAnswered(false);
    }
    window.scrollTo({ top: 0 });
  }

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
        {themeCase ? (
          <Chip
            label={`Тема: ${themeCase.title}`}
            size="small"
            variant="outlined"
            sx={{ fontWeight: 600 }}
          />
        ) : null}
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
            value={Math.round(((index + 1) / session.length) * 100)}
          />
        </Box>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontFamily: mono, fontWeight: 700 }}
        >
          {index + 1}/{session.length}
        </Typography>
      </Stack>

      <Card sx={{ p: { xs: 2.5, md: 3.5 } }}>
        <TaskRenderer
          key={item.step.id}
          step={item.step}
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
            endIcon={
              index >= session.length - 1 ? <CheckCircleOutlined /> : <ArrowForwardOutlined />
            }
            disabled={!answered}
            onClick={next}
          >
            {index >= session.length - 1 ? 'Завершить' : 'Далее'}
          </Button>
        </Stack>
      </Card>

      <WordDossier word={dossier} onClose={() => setDossier(null)} />
    </Box>
  );
}
