import { useState } from 'react';

import AddOutlined from '@mui/icons-material/AddOutlined';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import EditNoteOutlined from '@mui/icons-material/EditNoteOutlined';
import LockOutlined from '@mui/icons-material/LockOutlined';
import RadarOutlined from '@mui/icons-material/RadarOutlined';
import TaskAltOutlined from '@mui/icons-material/TaskAltOutlined';
import WhatshotOutlined from '@mui/icons-material/WhatshotOutlined';
import { Box, Button, Card, Chip, Stack, TextField, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

import { cases } from '@/data';
import { useNow } from '@/lib/useNow';
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

const DAY = 24 * 60 * 60 * 1000;

/** Relative time in Russian; empty until the clock ticks (now === 0). */
function ago(now: number, at: number): string {
  if (!now) return '';
  const d = Math.max(0, now - at);
  if (d < 60_000) return 'только что';
  if (d < 60 * 60_000) return `${Math.floor(d / 60_000)} мин назад`;
  if (d < DAY) return `${Math.floor(d / (60 * 60_000))} ч назад`;
  return `${Math.floor(d / DAY)} дн назад`;
}

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

export default function MissionsPage() {
  const navigate = useNavigate();
  const { state, isCaseCompleted, logMission, unlogMission, saveOwnPhrases } = useProgress();
  const now = useNow();

  const [notes, setNotes] = useState<Record<string, string>>({});
  const [phraseDrafts, setPhraseDrafts] = useState<Record<string, string>>({});

  const myPhrases = ownEntries.filter((e) => (state.ownPhrases[e.step.id]?.length ?? 0) > 0);

  // Enrich + sort missions: actionable (case solved, not caught) first, then
  // caught, then locked (case not solved yet).
  const missions = catchEntries
    .map((e) => ({
      ...e,
      unlocked: isCaseCompleted(e.caseId),
      logged: state.missionLog[e.step.id],
    }))
    .sort((a, b) => {
      const rank = (m: typeof a) => (m.unlocked ? (m.logged ? 1 : 0) : 2);
      return rank(a) - rank(b);
    });

  const loggedCount = missions.filter((m) => m.logged).length;
  const weekCount = missions.filter((m) => m.logged && m.logged.at >= now - 7 * DAY).length;
  const phrasesCount = myPhrases.reduce(
    (sum, e) => sum + (state.ownPhrases[e.step.id]?.length ?? 0),
    0,
  );

  function catchIt(stepId: string) {
    logMission(stepId, notes[stepId]);
    setNotes((n) => ({ ...n, [stepId]: '' }));
  }

  function addPhrase(stepId: string) {
    const value = (phraseDrafts[stepId] ?? '').trim();
    if (!value) return;
    saveOwnPhrases(stepId, [...(state.ownPhrases[stepId] ?? []), value]);
    setPhraseDrafts((d) => ({ ...d, [stepId]: '' }));
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
        Здесь язык переходит из приложения в жизнь: лови механизмы в реальной речи и собирай
        собственные фразы.
      </Typography>

      <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: 'wrap', mb: 4 }}>
        <StatTile
          icon={<TaskAltOutlined />}
          value={`${loggedCount}/${missions.length}`}
          label="поймано в реальности"
          color="#5bbf8f"
        />
        <StatTile
          icon={<WhatshotOutlined />}
          value={weekCount}
          label="за последние 7 дней"
          color="#e8b24a"
        />
        <StatTile
          icon={<EditNoteOutlined />}
          value={phrasesCount}
          label="своих фраз"
          color="#5b8cd6"
        />
      </Stack>

      <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
        Поймай в реальности
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Раскрой дело, чтобы открыть его миссию. Поймал механизм в живой речи — отметь и оставь
        заметку, где встретил.
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 2,
          mb: 5,
        }}
      >
        {missions.map(({ caseId, caseTitle, step, unlocked, logged }) => {
          if (!unlocked) {
            return (
              <Card
                key={step.id}
                onClick={() => void navigate(`/case/${caseId}`)}
                sx={{ p: 2.25, cursor: 'pointer', opacity: 0.6 }}
              >
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
                  <LockOutlined fontSize="small" sx={{ color: 'text.disabled' }} />
                  <Typography variant="body2" color="text.disabled" sx={{ fontWeight: 700 }}>
                    Закрыта
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  Раскрой дело «{caseTitle}», чтобы открыть миссию.
                </Typography>
              </Card>
            );
          }
          return (
            <Card
              key={step.id}
              sx={{
                p: 2.25,
                borderColor: logged ? alpha('#5bbf8f', 0.45) : 'divider',
                backgroundColor: logged ? alpha('#5bbf8f', 0.06) : 'transparent',
              }}
            >
              <Stack
                direction="row"
                spacing={1}
                sx={{ alignItems: 'center', mb: 1, justifyContent: 'space-between' }}
              >
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  {logged ? (
                    <CheckCircleOutlined fontSize="small" sx={{ color: 'success.main' }} />
                  ) : (
                    <RadarOutlined fontSize="small" sx={{ color: 'primary.main' }} />
                  )}
                  <Typography
                    variant="body2"
                    color={logged ? 'success.main' : 'primary.main'}
                    sx={{ fontWeight: 700 }}
                  >
                    {logged ? `Поймано · ${ago(now, logged.at)}` : 'Открыта'}
                  </Typography>
                </Stack>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  onClick={() => void navigate(`/case/${caseId}`)}
                  sx={{ cursor: 'pointer', '&:hover': { color: 'text.primary' } }}
                >
                  к делу →
                </Typography>
              </Stack>

              <Typography sx={{ mb: 1.5 }}>{step.hint ?? step.prompt}</Typography>
              <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.75, mb: 1.5 }}>
                {step.targets.map((t) => (
                  <Chip
                    key={t}
                    label={t}
                    size="small"
                    sx={{
                      fontFamily: mono,
                      fontWeight: 600,
                      color: 'success.main',
                      backgroundColor: alpha('#5bbf8f', 0.12),
                    }}
                  />
                ))}
              </Stack>

              {logged ? (
                <Box>
                  {logged.note ? (
                    <Typography
                      variant="body2"
                      sx={{
                        mb: 1,
                        p: 1.25,
                        borderRadius: 1.5,
                        borderLeft: '3px solid',
                        borderColor: 'success.main',
                        backgroundColor: (t) => alpha(t.palette.success.main, 0.07),
                      }}
                    >
                      «{logged.note}»
                    </Typography>
                  ) : null}
                  <Button
                    size="small"
                    color="inherit"
                    onClick={() => unlogMission(step.id)}
                    sx={{ color: 'text.secondary' }}
                  >
                    Убрать отметку
                  </Button>
                </Box>
              ) : (
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="где услышал / что сказал — необязательно"
                    value={notes[step.id] ?? ''}
                    onChange={(e) => setNotes((n) => ({ ...n, [step.id]: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        catchIt(step.id);
                      }
                    }}
                  />
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<TaskAltOutlined />}
                    onClick={() => catchIt(step.id)}
                    sx={{ flexShrink: 0 }}
                  >
                    Поймал
                  </Button>
                </Stack>
              )}

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

      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.5 }}>
        <EditNoteOutlined sx={{ color: '#5bbf8f' }} />
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          Мои фразы
        </Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Фразы из твоей жизни — они запоминаются лучше всего. Можно дополнять прямо отсюда.
      </Typography>

      {myPhrases.length === 0 ? (
        <Card sx={{ p: 3, mb: 2 }}>
          <Typography color="text.secondary">
            Пока пусто. В делах есть шаги «Своя фраза» — составь там фразы из своей жизни, и они
            появятся здесь.
          </Typography>
        </Card>
      ) : (
        <Stack spacing={2} sx={{ mb: 2 }}>
          {myPhrases.map(({ caseId, caseTitle, step }) => {
            const phrases = state.ownPhrases[step.id] ?? [];
            return (
              <Card key={step.id} sx={{ p: 2.5 }}>
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ alignItems: 'baseline', flexWrap: 'wrap' }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ cursor: 'pointer', '&:hover': { color: 'text.primary' } }}
                    onClick={() => void navigate(`/case/${caseId}`)}
                  >
                    {caseTitle}
                  </Typography>
                  <Chip
                    label={step.pattern}
                    size="small"
                    variant="outlined"
                    sx={{ fontFamily: mono, fontWeight: 600 }}
                  />
                </Stack>
                <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1, mt: 1.5, mb: 1.5 }}>
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
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="ещё одна своя фраза…"
                    value={phraseDrafts[step.id] ?? ''}
                    onChange={(e) => setPhraseDrafts((d) => ({ ...d, [step.id]: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addPhrase(step.id);
                      }
                    }}
                    slotProps={{
                      input: { sx: { fontFamily: mono } },
                      // French input: tag language and disable spellcheck/autocorrect.
                      htmlInput: { lang: 'fr', spellCheck: false, autoCorrect: 'off' },
                    }}
                  />
                  <Button
                    color="inherit"
                    startIcon={<AddOutlined />}
                    onClick={() => addPhrase(step.id)}
                    disabled={!(phraseDrafts[step.id] ?? '').trim()}
                    sx={{ flexShrink: 0, borderColor: 'divider' }}
                    variant="outlined"
                  >
                    Добавить
                  </Button>
                </Stack>
              </Card>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}
