import { lazy } from 'react';

import { Route, Routes, useParams } from 'react-router-dom';

import AppLayout from '@/components/layout/AppLayout';

const HomePage = lazy(() => import('@/pages/HomePage'));
const CasePage = lazy(() => import('@/pages/CasePage'));
const InsightsPage = lazy(() => import('@/pages/InsightsPage'));
const MissionsPage = lazy(() => import('@/pages/MissionsPage'));
const ReviewPage = lazy(() => import('@/pages/ReviewPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const WordLabPage = lazy(() => import('@/pages/WordLabPage'));
const WordSessionPage = lazy(() => import('@/pages/WordSessionPage'));
const WordBossPage = lazy(() => import('@/pages/WordBossPage'));

/**
 * Remount CasePage when the case changes (keyed by :id), otherwise the internal
 * state (current step, finished) would persist between cases — and "Next case"
 * would open on the last step of the previous one instead of from the start.
 */
function KeyedCasePage() {
  const { id } = useParams();
  return <CasePage key={id} />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/case/:id" element={<KeyedCasePage />} />
        <Route path="/review" element={<ReviewPage />} />
        <Route path="/insights" element={<InsightsPage />} />
        <Route path="/missions" element={<MissionsPage />} />
        <Route path="/words" element={<WordLabPage />} />
        <Route path="/words/session" element={<WordSessionPage />} />
        <Route path="/words/boss/:id" element={<WordBossPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<HomePage />} />
      </Route>
    </Routes>
  );
}
