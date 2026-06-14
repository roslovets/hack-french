import AutoFixHighOutlined from '@mui/icons-material/AutoFixHighOutlined';
import BugReportOutlined from '@mui/icons-material/BugReportOutlined';
import CategoryOutlined from '@mui/icons-material/CategoryOutlined';
import CompareArrowsOutlined from '@mui/icons-material/CompareArrowsOutlined';
import DataObjectOutlined from '@mui/icons-material/DataObjectOutlined';
import EditNoteOutlined from '@mui/icons-material/EditNoteOutlined';
import ExtensionOutlined from '@mui/icons-material/ExtensionOutlined';
import FilterAltOutlined from '@mui/icons-material/FilterAltOutlined';
import ForumOutlined from '@mui/icons-material/ForumOutlined';
import GppMaybeOutlined from '@mui/icons-material/GppMaybeOutlined';
import HandymanOutlined from '@mui/icons-material/HandymanOutlined';
import LightbulbOutlined from '@mui/icons-material/LightbulbOutlined';
import ManageSearchOutlined from '@mui/icons-material/ManageSearchOutlined';
import RadarOutlined from '@mui/icons-material/RadarOutlined';
import ReportProblemOutlined from '@mui/icons-material/ReportProblemOutlined';
import ScienceOutlined from '@mui/icons-material/ScienceOutlined';
import ShortTextOutlined from '@mui/icons-material/ShortTextOutlined';
import SpaceBarOutlined from '@mui/icons-material/SpaceBarOutlined';
import StorefrontOutlined from '@mui/icons-material/StorefrontOutlined';
import SwapVertOutlined from '@mui/icons-material/SwapVertOutlined';
import type { SvgIconComponent } from '@mui/icons-material';
import TimelineOutlined from '@mui/icons-material/TimelineOutlined';
import TravelExploreOutlined from '@mui/icons-material/TravelExploreOutlined';
import UnfoldLessOutlined from '@mui/icons-material/UnfoldLessOutlined';
import UnfoldMoreOutlined from '@mui/icons-material/UnfoldMoreOutlined';

import type { TaskKind } from '@/types';

export type Tone = 'accent' | 'gold' | 'teal' | 'danger' | 'amber';

export interface TaskMeta {
  label: string;
  icon: SvgIconComponent;
  tone: Tone;
}

export const taskMeta: Record<TaskKind, TaskMeta> = {
  strangeness: { label: 'Найди странность', icon: TravelExploreOutlined, tone: 'accent' },
  hypothesis: { label: 'Выбери гипотезу', icon: ScienceOutlined, tone: 'accent' },
  code: { label: 'Разбор как код', icon: DataObjectOutlined, tone: 'accent' },
  build: { label: 'Собери фразу', icon: ExtensionOutlined, tone: 'accent' },
  collapse: { label: 'Сверни фразу', icon: UnfoldLessOutlined, tone: 'accent' },
  expand: { label: 'Разверни фразу', icon: UnfoldMoreOutlined, tone: 'accent' },
  fixCalque: { label: 'Исправь кальку', icon: HandymanOutlined, tone: 'danger' },
  scene: { label: 'Сцена', icon: StorefrontOutlined, tone: 'amber' },
  mutation: { label: 'Мутация фразы', icon: AutoFixHighOutlined, tone: 'accent' },
  ownPhrase: { label: 'Своя фраза', icon: EditNoteOutlined, tone: 'teal' },
  catch: { label: 'Поймай в реальности', icon: RadarOutlined, tone: 'teal' },
  insight: { label: 'Озарение', icon: LightbulbOutlined, tone: 'gold' },
  oddOneOut: { label: 'Найди лишнюю', icon: FilterAltOutlined, tone: 'accent' },
  explainError: { label: 'Объясни ошибку', icon: ReportProblemOutlined, tone: 'danger' },
  cloze: { label: 'Вставь механизм', icon: SpaceBarOutlined, tone: 'accent' },
  sort: { label: 'Сортировка', icon: CategoryOutlined, tone: 'accent' },
  order: { label: 'Уровень прямоты', icon: SwapVertOutlined, tone: 'amber' },
  debug: { label: 'Debug Mode', icon: BugReportOutlined, tone: 'danger' },
  compare: { label: 'Сравни фразы', icon: CompareArrowsOutlined, tone: 'accent' },
  trap: { label: 'Переводческий капкан', icon: GppMaybeOutlined, tone: 'danger' },
  simpler: { label: 'Скажи проще', icon: ShortTextOutlined, tone: 'accent' },
  timeline: { label: 'Таймлайн события', icon: TimelineOutlined, tone: 'amber' },
  dialogue: { label: 'Диалог-квест', icon: ForumOutlined, tone: 'amber' },
  findMechanisms: { label: 'Найди механизмы', icon: ManageSearchOutlined, tone: 'accent' },
};

export const toneColor: Record<Tone, string> = {
  accent: '#e8b24a',
  gold: '#f1c75b',
  teal: '#5bbf8f',
  danger: '#e5484d',
  amber: '#cf8a4a',
};
