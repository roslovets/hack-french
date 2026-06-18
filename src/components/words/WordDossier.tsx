import { useState } from 'react';

import CloseOutlined from '@mui/icons-material/CloseOutlined';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  Divider,
  IconButton,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';

import { wordMasteryScore } from '@/lib/word-lab';
import { display, mono } from '@/theme';
import type { Word, WordDimension } from '@/types';

import { useProgress } from '@/state/useProgress';

const DIMENSION_LABEL: Record<WordDimension, string> = {
  visualRecognition: 'Узнавание',
  contextualUnderstanding: 'В контексте',
  listeningRecognition: 'На слух',
  contrastiveUnderstanding: 'Отличие',
  collocationKnowledge: 'Сочетания',
  activeRecall: 'Вспоминание',
  personalUsage: 'Своя речь',
};
const DIMENSION_ORDER = Object.keys(DIMENSION_LABEL) as WordDimension[];
const STRENGTH_CAP = 4;

/** Inner body — mounted only with a real word, so per-word state resets cleanly. */
function DossierBody({ word, onClose }: { word: Word; onClose: () => void }) {
  const { state, saveWordMnemonic } = useProgress();
  const wm = state.wordMastery[word.id];
  const score = Math.round(wordMasteryScore(state, word.id) * 100);
  const [mnemo, setMnemo] = useState(wm?.mnemonic ?? '');

  return (
    <DialogContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
      <Stack
        direction="row"
        sx={{ justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}
      >
        <Box>
          <Typography sx={{ fontFamily: display, fontWeight: 800, fontSize: 30, lineHeight: 1.1 }}>
            {word.displayForm ?? word.lemma}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 0.75, flexWrap: 'wrap', gap: 0.75 }}>
            <Chip label={word.pos} size="small" variant="outlined" />
            {word.gender ? (
              <Chip label={word.gender === 'm' ? 'm' : 'f'} size="small" variant="outlined" />
            ) : null}
            <Chip label={word.level} size="small" variant="outlined" />
            {word.ipa ? (
              <Typography sx={{ fontFamily: mono, color: 'text.disabled', alignSelf: 'center' }}>
                {word.ipa}
              </Typography>
            ) : null}
          </Stack>
        </Box>
        <IconButton onClick={onClose} size="small" aria-label="Закрыть">
          <CloseOutlined />
        </IconButton>
      </Stack>

      <Box
        sx={{
          my: 2,
          p: 1.75,
          borderRadius: 2,
          borderLeft: '3px solid',
          borderColor: 'primary.main',
          backgroundColor: (t) => alpha(t.palette.primary.main, 0.06),
        }}
      >
        <Typography variant="overline" color="text.secondary">
          Смысловое ядро
        </Typography>
        <Typography sx={{ mt: 0.25 }}>{word.semanticCore}</Typography>
      </Box>

      <Stack direction="row" spacing={3} sx={{ flexWrap: 'wrap', mb: 2 }}>
        <Box>
          <Typography variant="overline" color="text.secondary">
            По-русски
          </Typography>
          <Typography sx={{ fontWeight: 600 }}>{word.translationsRu.join(', ')}</Typography>
        </Box>
        {word.translationsEn.length ? (
          <Box>
            <Typography variant="overline" color="text.secondary">
              English
            </Typography>
            <Typography sx={{ fontWeight: 600 }}>{word.translationsEn.join(', ')}</Typography>
          </Box>
        ) : null}
      </Stack>

      {word.collocations.length ? (
        <Box sx={{ mb: 2 }}>
          <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
            Сочетания
          </Typography>
          <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.75 }}>
            {word.collocations.map((c) => (
              <Chip
                key={c.fr}
                label={c.fr}
                title={c.ru}
                size="small"
                sx={{ fontFamily: mono, fontWeight: 600 }}
              />
            ))}
          </Stack>
        </Box>
      ) : null}

      {word.contrastPairs.length ? (
        <Box sx={{ mb: 2 }}>
          <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
            Не путай
          </Typography>
          <Stack spacing={0.75}>
            {word.contrastPairs.map((p) => (
              <Box
                key={p.with}
                sx={{
                  p: 1.25,
                  borderRadius: 1.5,
                  borderLeft: '3px solid',
                  borderColor: 'secondary.main',
                  backgroundColor: (t) => alpha(t.palette.secondary.main, 0.06),
                }}
              >
                <Typography variant="body2">
                  <Box component="span" sx={{ fontFamily: mono, fontWeight: 700 }}>
                    {p.with}
                  </Box>{' '}
                  — {p.note}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>
      ) : null}

      <Box sx={{ mb: 2 }}>
        <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
          Твоя ассоциация
        </Typography>
        <TextField
          fullWidth
          multiline
          minRows={2}
          placeholder="Своя мнемоника — чем нелепее, тем лучше запомнится…"
          value={mnemo}
          onChange={(e) => setMnemo(e.target.value)}
          sx={{ mb: 1 }}
          slotProps={{ input: { sx: { fontFamily: mono, fontSize: 14 } } }}
        />
        <Button
          size="small"
          variant="outlined"
          color="inherit"
          disabled={mnemo.trim() === (wm?.mnemonic ?? '')}
          onClick={() => saveWordMnemonic(word.id, mnemo)}
          sx={{ borderColor: 'divider' }}
        >
          Сохранить ассоциацию
        </Button>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline', mb: 1 }}>
        <Typography variant="overline" color="text.secondary">
          Владение
        </Typography>
        <Typography sx={{ fontFamily: mono, fontWeight: 700, color: 'primary.main' }}>
          {score}%
        </Typography>
      </Stack>
      <Stack spacing={0.85}>
        {DIMENSION_ORDER.map((dim) => {
          const deferred = dim === 'listeningRecognition';
          const strength = wm?.dims[dim]?.strength ?? 0;
          const value = Math.min(100, (strength / STRENGTH_CAP) * 100);
          return (
            <Box key={dim} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography
                variant="caption"
                sx={{ width: 104, color: deferred ? 'text.disabled' : 'text.secondary' }}
              >
                {DIMENSION_LABEL[dim]}
              </Typography>
              <Box sx={{ flex: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={deferred ? 0 : value}
                  color="success"
                  sx={{ opacity: deferred ? 0.35 : 1 }}
                />
              </Box>
              {deferred ? (
                <Typography variant="caption" color="text.disabled" sx={{ width: 40 }}>
                  скоро
                </Typography>
              ) : (
                <Box sx={{ width: 40 }} />
              )}
            </Box>
          );
        })}
      </Stack>
    </DialogContent>
  );
}

/** Multi-layer word card (Word Lab spec §8) with an editable personal mnemonic. */
export default function WordDossier({ word, onClose }: { word: Word | null; onClose: () => void }) {
  return (
    <Dialog open={Boolean(word)} onClose={onClose} maxWidth="sm" fullWidth>
      {word ? <DossierBody word={word} onClose={onClose} /> : null}
    </Dialog>
  );
}
