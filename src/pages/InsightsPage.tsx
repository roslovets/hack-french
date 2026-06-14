import ArrowForwardOutlined from '@mui/icons-material/ArrowForwardOutlined';
import LightbulbOutlined from '@mui/icons-material/LightbulbOutlined';
import { Box, Button, Card, Chip, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

import { getCase, getMechanism } from '@/data';
import { mono } from '@/theme';

import { useProgress } from '@/state/useProgress';

export default function InsightsPage() {
  const navigate = useNavigate();
  const { state } = useProgress();

  const insights = state.insights.slice().reverse();

  return (
    <Box>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 1 }}>
        <LightbulbOutlined sx={{ color: '#f1c75b', fontSize: 32 }} />
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Коллекция озарений
        </Typography>
      </Stack>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Короткие правила человеческим языком, которые остаются в голове после каждого раскрытого
        дела.
      </Typography>

      {insights.length === 0 ? (
        <Card sx={{ p: 5, textAlign: 'center' }}>
          <LightbulbOutlined sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
          <Typography variant="h6" sx={{ mb: 1 }}>
            Пока пусто
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Раскрой первое дело — и сюда упадёт твоё первое озарение.
          </Typography>
          <Button variant="contained" onClick={() => void navigate('/')}>
            К делам
          </Button>
        </Card>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 2,
          }}
        >
          {insights.map((ins) => {
            const mech = getMechanism(ins.mechanism);
            const caseItem = getCase(ins.caseId);
            return (
              <Card
                key={`${ins.caseId}-${ins.at}`}
                sx={{
                  p: 2.5,
                  borderColor: alpha('#f1c75b', 0.35),
                  backgroundColor: alpha('#f1c75b', 0.05),
                }}
              >
                <Stack sx={{ height: '100%' }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1.5 }}>
                    <LightbulbOutlined sx={{ color: '#f1c75b', fontSize: 20 }} />
                    {mech ? (
                      <Chip
                        label={mech.token}
                        size="small"
                        variant="outlined"
                        sx={{
                          fontFamily: mono,
                          fontWeight: 700,
                          color: '#f1c75b',
                          borderColor: alpha('#f1c75b', 0.4),
                        }}
                      />
                    ) : null}
                  </Stack>
                  <Typography sx={{ fontWeight: 600, lineHeight: 1.45, mb: 2 }}>
                    {ins.text}
                  </Typography>
                  <Box sx={{ flex: 1 }} />
                  {caseItem ? (
                    <Button
                      size="small"
                      color="inherit"
                      endIcon={<ArrowForwardOutlined />}
                      onClick={() => void navigate(`/case/${caseItem.id}`)}
                      sx={{ alignSelf: 'flex-start', color: 'text.secondary', px: 0 }}
                    >
                      {caseItem.title}
                    </Button>
                  ) : null}
                </Stack>
              </Card>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
