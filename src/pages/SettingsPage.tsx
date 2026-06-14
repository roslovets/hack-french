import { useRef, useState } from 'react';

import DownloadOutlined from '@mui/icons-material/DownloadOutlined';
import RestartAltOutlined from '@mui/icons-material/RestartAltOutlined';
import SettingsOutlined from '@mui/icons-material/SettingsOutlined';
import UploadFileOutlined from '@mui/icons-material/UploadFileOutlined';
import WarningAmberOutlined from '@mui/icons-material/WarningAmberOutlined';
import {
  Alert,
  Box,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';

import { exportSave, importSave, SaveParseError, type ImportResult } from '@/lib/save-transfer';
import { mono } from '@/theme';

import { useProgress } from '@/state/useProgress';

function fileStamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  // Local time, without colons (not allowed in Windows file names).
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}-${p(
    d.getMinutes(),
  )}-${p(d.getSeconds())}`;
}

export default function SettingsPage() {
  const { state, importProgress, resetProgress } = useProgress();
  const fileRef = useRef<HTMLInputElement>(null);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState<ImportResult | null>(null);
  const [resetOpen, setResetOpen] = useState(false);

  const completed = state.completedCases.length;

  function handleExport() {
    setError(null);
    setSuccess(null);
    const json = exportSave(state);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hack-french-save-${fileStamp()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setSuccess(`Файл сейва скачан (${completed} дел, ${state.xp} XP).`);
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    setSuccess(null);
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file
    if (!file) return;
    const reader = new FileReader();
    reader.onerror = () => setError('Не удалось прочитать файл.');
    reader.onload = () => {
      try {
        const text = typeof reader.result === 'string' ? reader.result : '';
        setPending(importSave(text));
      } catch (err) {
        setError(err instanceof SaveParseError ? err.message : 'Не удалось разобрать файл сейва.');
      }
    };
    reader.readAsText(file);
  }

  function confirmImport() {
    if (!pending) return;
    importProgress(pending.state);
    const { cases, dropped } = pending.summary;
    setSuccess(
      `Прогресс импортирован: ${cases} дел${dropped ? `, пропущено неизвестных: ${dropped}` : ''}.`,
    );
    setPending(null);
  }

  function confirmReset() {
    resetProgress();
    setResetOpen(false);
    setSuccess('Прогресс сброшен.');
    setError(null);
  }

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto' }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 1 }}>
        <SettingsOutlined sx={{ color: 'primary.main', fontSize: 32 }} />
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Настройки
        </Typography>
      </Stack>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Прогресс хранится только в этом браузере. Перенести его на другое устройство можно файлом
        сейва — без аккаунта и сервера.
      </Typography>

      {error ? (
        <Alert severity="error" variant="outlined" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      ) : null}
      {success ? (
        <Alert severity="success" variant="outlined" sx={{ mb: 3, borderRadius: 2 }}>
          {success}
        </Alert>
      ) : null}

      <Card sx={{ p: { xs: 2.5, md: 3.5 }, mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
          Перенос прогресса
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          Скачай файл на одном устройстве и загрузи на другом. Импорт{' '}
          <Box component="span" sx={{ fontFamily: mono, color: 'text.primary' }}>
            заменяет
          </Box>{' '}
          прогресс на этом устройстве.
        </Typography>

        <Stack direction="row" spacing={1.5} useFlexGap sx={{ flexWrap: 'wrap' }}>
          <Button variant="contained" startIcon={<DownloadOutlined />} onClick={handleExport}>
            Скачать сейв (.json)
          </Button>
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<UploadFileOutlined />}
            onClick={() => fileRef.current?.click()}
            sx={{ borderColor: 'divider' }}
          >
            Загрузить сейв
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={handleFile}
          />
        </Stack>

        <Box
          sx={{
            mt: 2.5,
            pt: 2,
            borderTop: '1px dashed',
            borderColor: 'divider',
            display: 'flex',
            gap: 3,
            flexWrap: 'wrap',
          }}
        >
          <Box>
            <Typography sx={{ fontFamily: mono, fontWeight: 700, fontSize: 20, lineHeight: 1 }}>
              {completed}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              раскрыто дел
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ fontFamily: mono, fontWeight: 700, fontSize: 20, lineHeight: 1 }}>
              {state.xp}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              XP
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ fontFamily: mono, fontWeight: 700, fontSize: 20, lineHeight: 1 }}>
              {state.insights.length}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              озарений
            </Typography>
          </Box>
        </Box>
      </Card>

      <Card
        sx={{
          p: { xs: 2.5, md: 3.5 },
          borderColor: (t) => alpha(t.palette.error.main, 0.35),
          backgroundColor: (t) => alpha(t.palette.error.main, 0.04),
        }}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.5 }}>
          <WarningAmberOutlined sx={{ color: 'error.main', fontSize: 20 }} />
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Опасная зона
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          Полный сброс удалит раскрытые дела, озарения, XP и расписание повторения. Отменить нельзя
          — сначала сделай экспорт, если жалко.
        </Typography>
        <Button
          variant="outlined"
          color="error"
          startIcon={<RestartAltOutlined />}
          onClick={() => setResetOpen(true)}
        >
          Сбросить весь прогресс
        </Button>
      </Card>

      {/* Import confirmation */}
      <Dialog open={pending !== null} onClose={() => setPending(null)}>
        <DialogTitle sx={{ fontWeight: 800 }}>Заменить прогресс?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            На этом устройстве сейчас {completed} дел и {state.xp} XP. Импорт перезапишет их данными
            из файла: {pending?.summary.cases ?? 0} дел
            {pending?.summary.dropped ? `, ${pending.summary.dropped} неизвестных пропущено` : ''}.
            Это действие нельзя отменить.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" onClick={() => setPending(null)}>
            Отмена
          </Button>
          <Button variant="contained" onClick={confirmImport}>
            Заменить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reset confirmation */}
      <Dialog open={resetOpen} onClose={() => setResetOpen(false)}>
        <DialogTitle sx={{ fontWeight: 800 }}>Сбросить весь прогресс?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Будут удалены все {completed} раскрытых дел, озарения и {state.xp} XP. Отменить будет
            нельзя.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" onClick={() => setResetOpen(false)}>
            Отмена
          </Button>
          <Button variant="contained" color="error" onClick={confirmReset}>
            Сбросить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
