import { Suspense } from 'react';

import BoltOutlined from '@mui/icons-material/BoltOutlined';
import EventRepeatOutlined from '@mui/icons-material/EventRepeatOutlined';
import LightbulbOutlined from '@mui/icons-material/LightbulbOutlined';
import RadarOutlined from '@mui/icons-material/RadarOutlined';
import SettingsOutlined from '@mui/icons-material/SettingsOutlined';
import TravelExploreOutlined from '@mui/icons-material/TravelExploreOutlined';
import {
  AppBar,
  Badge,
  Box,
  Chip,
  CircularProgress,
  Container,
  IconButton,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { NavLink, Outlet } from 'react-router-dom';

import { dueCaseIds } from '@/lib/review';
import { useNow } from '@/lib/useNow';
import { display, mono } from '@/theme';

import { useProgress } from '@/state/useProgress';

import { BrandMark } from './BrandMark';

const navItems = [
  { to: '/', label: 'Дела', icon: TravelExploreOutlined, end: true },
  { to: '/review', label: 'Повторение', icon: EventRepeatOutlined, end: false },
  { to: '/insights', label: 'Озарения', icon: LightbulbOutlined, end: false },
  { to: '/missions', label: 'Миссии', icon: RadarOutlined, end: false },
];

function NavItem({
  to,
  label,
  icon: Icon,
  end,
  badge = 0,
}: {
  to: string;
  label: string;
  icon: typeof BoltOutlined;
  end: boolean;
  badge?: number;
}) {
  return (
    <NavLink to={to} end={end} style={{ textDecoration: 'none' }}>
      {({ isActive }) => (
        <Stack
          direction="row"
          spacing={0.75}
          sx={{
            px: 1.5,
            py: 0.75,
            borderRadius: 2,
            color: isActive ? 'primary.main' : 'text.secondary',
            backgroundColor: (t) => (isActive ? alpha(t.palette.primary.main, 0.1) : 'transparent'),
            transition: 'all 140ms ease',
            '&:hover': { color: 'text.primary' },
            alignItems: 'center',
          }}
        >
          <Badge
            badgeContent={badge}
            max={99}
            sx={{
              '& .MuiBadge-badge': {
                backgroundColor: '#e8b24a',
                color: '#1a1712',
                fontSize: 9.5,
                fontWeight: 800,
                minWidth: 15,
                height: 15,
                px: 0.5,
              },
            }}
          >
            <Icon sx={{ fontSize: 19 }} />
          </Badge>
          <Typography
            variant="body2"
            sx={{ fontWeight: 700, display: { xs: 'none', sm: 'block' } }}
          >
            {label}
          </Typography>
        </Stack>
      )}
    </NavLink>
  );
}

export default function AppLayout() {
  const { state } = useProgress();
  const now = useNow(60 * 60 * 1000);
  const dueCount = dueCaseIds(state, now).length;

  return (
    <Box sx={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <AppBar
        position="sticky"
        sx={{
          backdropFilter: 'blur(12px)',
          backgroundColor: (t) => alpha(t.palette.background.default, 0.72),
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ gap: 1 }}>
            <NavLink to="/" style={{ textDecoration: 'none' }}>
              <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                <BrandMark size={30} />
                <Box sx={{ lineHeight: 1 }}>
                  <Typography
                    sx={{
                      fontFamily: display,
                      fontWeight: 800,
                      fontSize: 20,
                      letterSpacing: '-0.01em',
                      color: 'text.primary',
                    }}
                  >
                    Hack French
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: mono,
                      fontSize: 10.5,
                      letterSpacing: '0.12em',
                      color: 'text.secondary',
                      display: { xs: 'none', md: 'block' },
                    }}
                  >
                    взламывай, а не зубри
                  </Typography>
                </Box>
              </Stack>
            </NavLink>

            <Box sx={{ flex: 1 }} />

            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
              {navItems.map((item) => (
                <NavItem key={item.to} {...item} badge={item.to === '/review' ? dueCount : 0} />
              ))}
            </Stack>

            <Tooltip title="Опыт (XP): +10 за шаг, +50 за раскрытое дело, +120 за босс-файт" arrow>
              <Chip
                icon={<BoltOutlined sx={{ fontSize: 16 }} />}
                label={state.xp}
                size="small"
                aria-label={`Опыт: ${state.xp} XP`}
                sx={{
                  ml: 1,
                  fontWeight: 800,
                  color: 'primary.main',
                  backgroundColor: (t) => alpha(t.palette.primary.main, 0.12),
                  cursor: 'default',
                }}
              />
            </Tooltip>

            <Tooltip title="Настройки и перенос прогресса" arrow>
              <IconButton
                component={NavLink}
                to="/settings"
                size="small"
                aria-label="Настройки"
                sx={{ ml: 0.5, color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
              >
                <SettingsOutlined sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
          </Toolbar>
        </Container>
      </AppBar>

      <Box component="main" sx={{ flex: 1, py: { xs: 3, md: 5 } }}>
        <Container maxWidth="lg">
          <Suspense
            fallback={
              <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '40vh' }}>
                <CircularProgress />
              </Box>
            }
          >
            <Outlet />
          </Suspense>
        </Container>
      </Box>

      <Box component="footer" sx={{ borderTop: '1px solid', borderColor: 'divider', py: 3, mt: 4 }}>
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary" align="center">
            Hack French — игра-лаборатория для reverse engineering французского. Увидел странность →
            собрал улики → взломал механизм → применил в жизни.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
