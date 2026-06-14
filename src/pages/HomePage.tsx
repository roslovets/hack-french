import ArrowForwardOutlined from '@mui/icons-material/ArrowForwardOutlined';
import BoltOutlined from '@mui/icons-material/BoltOutlined';
import LightbulbOutlined from '@mui/icons-material/LightbulbOutlined';
import TravelExploreOutlined from '@mui/icons-material/TravelExploreOutlined';
import { Box, Button, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

import CaseCard from '@/components/CaseCard';
import { casesByCategory, categories, cases, totalCases } from '@/data';
import { display, mono } from '@/theme';

import { useProgress } from '@/state/useProgress';

/** L-shaped "dossier corners" at the edges of a block. */
function CornerFrame({ color = '#e8b24a' }: { color?: string }) {
  const common = {
    position: 'absolute' as const,
    width: 16,
    height: 16,
    borderColor: alpha(color, 0.55),
    pointerEvents: 'none' as const,
  };
  return (
    <>
      <Box sx={{ ...common, top: 10, left: 10, borderTop: '2px solid', borderLeft: '2px solid' }} />
      <Box
        sx={{ ...common, top: 10, right: 10, borderTop: '2px solid', borderRight: '2px solid' }}
      />
      <Box
        sx={{ ...common, bottom: 10, left: 10, borderBottom: '2px solid', borderLeft: '2px solid' }}
      />
      <Box
        sx={{
          ...common,
          bottom: 10,
          right: 10,
          borderBottom: '2px solid',
          borderRight: '2px solid',
        }}
      />
    </>
  );
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
        <Typography sx={{ fontFamily: mono, fontWeight: 700, fontSize: 26, lineHeight: 1 }}>
          {value}
        </Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    </Box>
  );
}

/** Compact dossier index: all sections at once, with progress and a jump link. */
function DossierIndex() {
  const { isCaseCompleted } = useProgress();
  const jump = (catId: string) => {
    document.getElementById(`cat-${catId}`)?.scrollIntoView({ block: 'start' });
  };
  return (
    <Box
      sx={{
        mb: 6,
        p: { xs: 2, md: 2.5 },
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper',
      }}
    >
      <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
        Содержание досье
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr' },
          columnGap: 3,
          rowGap: 0,
        }}
      >
        {categories.map((category) => {
          const list = casesByCategory(category.id);
          if (list.length === 0) return null;
          const done = list.filter((c) => isCaseCompleted(c.id)).length;
          const complete = done === list.length;
          return (
            <Box
              key={category.id}
              role="button"
              tabIndex={0}
              onClick={() => jump(category.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  jump(category.id);
                }
              }}
              sx={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 1,
                py: 0.65,
                cursor: 'pointer',
                color: 'text.secondary',
                transition: 'color 120ms ease',
                '&:hover': { color: 'text.primary' },
                '&:hover .toc-num': { color: 'primary.main' },
              }}
            >
              <Typography
                className="toc-num"
                sx={{
                  fontFamily: mono,
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: alpha('#e8b24a', 0.65),
                  minWidth: 26,
                }}
              >
                §{String(category.order).padStart(2, '0')}
              </Typography>
              <Typography sx={{ fontSize: 14.5, fontWeight: 600 }} noWrap>
                {category.title}
              </Typography>
              <Box
                sx={{
                  flex: 1,
                  alignSelf: 'flex-end',
                  mb: '5px',
                  borderBottom: '1px dotted',
                  borderColor: 'divider',
                  minWidth: 12,
                }}
              />
              <Typography
                sx={{
                  fontFamily: mono,
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: complete ? 'success.main' : 'text.disabled',
                }}
              >
                {done}/{list.length}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { state, isCaseCompleted } = useProgress();

  const nextCase = cases.find((c) => !isCaseCompleted(c.id)) ?? cases[0];
  const solved = state.completedCases.length;
  const pct = Math.round((solved / totalCases) * 100);

  return (
    <Box>
      {/* Hero — dossier cover */}
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 3,
          px: { xs: 3, md: 6 },
          py: { xs: 4, md: 7 },
          mb: 4,
          backgroundColor: 'background.paper',
          backgroundImage: (t) =>
            `radial-gradient(680px 360px at 88% 0%, ${alpha(t.palette.primary.main, 0.12)}, transparent 60%)`,
        }}
      >
        <CornerFrame />
        {/* Watermark stamp */}
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            right: { xs: -30, md: 24 },
            top: '50%',
            transform: 'translateY(-50%) rotate(-8deg)',
            fontFamily: display,
            fontWeight: 900,
            fontSize: { xs: 150, md: 230 },
            lineHeight: 0.8,
            color: (t) => alpha(t.palette.primary.main, 0.06),
            userSelect: 'none',
            pointerEvents: 'none',
            display: { xs: 'none', sm: 'block' },
          }}
        >
          FR
        </Box>

        <Box sx={{ position: 'relative', maxWidth: 780 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2.5 }}>
            <Box
              sx={{
                fontFamily: mono,
                fontSize: 11,
                letterSpacing: '0.22em',
                px: 1,
                py: 0.5,
                borderRadius: 1,
                color: 'primary.main',
                border: '1px solid',
                borderColor: (t) => alpha(t.palette.primary.main, 0.4),
                backgroundColor: (t) => alpha(t.palette.primary.main, 0.08),
              }}
            >
              DOSSIER
            </Box>
            <Typography
              sx={{
                fontFamily: mono,
                fontSize: 12,
                color: 'text.secondary',
                letterSpacing: '0.1em',
              }}
            >
              reverse engineering du français
            </Typography>
          </Stack>

          <Typography variant="h1" sx={{ fontSize: { xs: 38, md: 60 }, lineHeight: 1.04, mb: 2 }}>
            Не зубри французский.{' '}
            <Box
              component="span"
              sx={{
                color: 'text.primary',
                backgroundImage: (t) =>
                  `linear-gradient(transparent 60%, ${alpha(t.palette.primary.main, 0.38)} 60%)`,
                px: 0.5,
              }}
            >
              Взламывай
            </Box>
            , как он работает.
          </Typography>

          <Typography
            sx={{
              color: 'text.secondary',
              fontSize: { xs: 16, md: 18 },
              maxWidth: 600,
              mb: 3.5,
            }}
          >
            Каждое дело — расследование французского механизма: увидел странность, собрал улики,
            взломал, применил в бытовой сцене и поймал в реальной жизни.
          </Typography>

          <Stack direction="row" spacing={1.5} useFlexGap sx={{ flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowForwardOutlined />}
              onClick={() => {
                if (nextCase) void navigate(`/case/${nextCase.id}`);
              }}
            >
              {solved > 0 ? 'Продолжить расследование' : 'Открыть первое дело'}
            </Button>
            <Button
              variant="outlined"
              size="large"
              color="inherit"
              onClick={() => void navigate('/insights')}
              sx={{ borderColor: 'divider' }}
            >
              Мои озарения
            </Button>
          </Stack>
        </Box>
      </Box>

      {/* Stats ledger */}
      <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: 'wrap', mb: 6 }}>
        <StatTile
          icon={<TravelExploreOutlined />}
          value={`${solved}/${totalCases}`}
          label="дел раскрыто"
          color="#e8b24a"
        />
        <StatTile
          icon={<LightbulbOutlined />}
          value={state.insights.length}
          label="озарений собрано"
          color="#f1c75b"
        />
        <StatTile icon={<BoltOutlined />} value={state.xp} label="опыта (XP)" color="#5bbf8f" />
        <StatTile
          icon={<TravelExploreOutlined />}
          value={`${pct}%`}
          label="прогресс"
          color="#5b8cd6"
        />
      </Stack>

      {/* Compact index of all sections */}
      <DossierIndex />

      {/* Cases by section */}
      {categories.map((category) => {
        const list = casesByCategory(category.id);
        if (list.length === 0) return null;
        return (
          <Box key={category.id} id={`cat-${category.id}`} sx={{ mb: 5, scrollMarginTop: 88 }}>
            <Stack
              direction="row"
              spacing={1.5}
              sx={{ alignItems: 'baseline', mb: 0.5, flexWrap: 'wrap' }}
            >
              <Typography
                sx={{ fontFamily: mono, fontSize: 13, color: 'primary.main', fontWeight: 700 }}
              >
                §{String(category.order).padStart(2, '0')}
              </Typography>
              <Typography variant="h5">{category.title}</Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {category.subtitle}
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr' },
                gap: 2,
              }}
            >
              {list.map((c) => (
                <CaseCard key={c.id} caseItem={c} />
              ))}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
