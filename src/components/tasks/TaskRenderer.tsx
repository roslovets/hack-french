import type { TaskStep } from '@/types';

import BuildTask from './BuildTask';
import CatchTask from './CatchTask';
import ChoiceTask from './ChoiceTask';
import CodeBreakdownTask from './CodeBreakdownTask';
import DebugTask from './DebugTask';
import DialogueTask from './DialogueTask';
import FindMechanismsTask from './FindMechanismsTask';
import OrderTask from './OrderTask';
import OwnPhraseTask from './OwnPhraseTask';
import SortTask from './SortTask';
import TimelineTask from './TimelineTask';

interface Props {
  step: TaskStep;
  boss?: boolean;
  completed: boolean;
  onComplete: () => void;
}

export default function TaskRenderer({ step, boss, completed, onComplete }: Props) {
  switch (step.kind) {
    case 'strangeness':
    case 'hypothesis':
    case 'expand':
    case 'fixCalque':
    case 'scene':
    case 'mutation':
    case 'oddOneOut':
    case 'explainError':
    case 'cloze':
    case 'collapse':
    case 'insight':
    case 'compare':
    case 'trap':
    case 'simpler':
      return <ChoiceTask step={step} boss={boss} completed={completed} onComplete={onComplete} />;
    case 'timeline':
      return <TimelineTask step={step} boss={boss} completed={completed} onComplete={onComplete} />;
    case 'dialogue':
      return <DialogueTask step={step} boss={boss} completed={completed} onComplete={onComplete} />;
    case 'findMechanisms':
      return (
        <FindMechanismsTask step={step} boss={boss} completed={completed} onComplete={onComplete} />
      );
    case 'code':
      return (
        <CodeBreakdownTask step={step} boss={boss} completed={completed} onComplete={onComplete} />
      );
    case 'build':
      return <BuildTask step={step} boss={boss} completed={completed} onComplete={onComplete} />;
    case 'ownPhrase':
      return <OwnPhraseTask step={step} boss={boss} onComplete={onComplete} />;
    case 'catch':
      return <CatchTask step={step} boss={boss} onComplete={onComplete} />;
    case 'sort':
      return <SortTask step={step} boss={boss} completed={completed} onComplete={onComplete} />;
    case 'order':
      return <OrderTask step={step} boss={boss} completed={completed} onComplete={onComplete} />;
    case 'debug':
      return <DebugTask step={step} boss={boss} completed={completed} onComplete={onComplete} />;
    default:
      return null;
  }
}
