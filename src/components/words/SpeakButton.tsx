import VolumeUpOutlined from '@mui/icons-material/VolumeUpOutlined';
import { IconButton, Tooltip } from '@mui/material';

import { speak, speechAvailable } from '@/lib/speech';

interface Props {
  /** Text to synthesize when there is no audio file (or it fails to play). */
  text: string;
  /** Optional pre-recorded clip path, relative to the app base. */
  src?: string;
  rate?: number;
  size?: 'small' | 'medium';
  label?: string;
}

/** Play a French word/phrase: a bundled clip if available, otherwise browser TTS. */
export default function SpeakButton({
  text,
  src,
  rate,
  size = 'small',
  label = 'Прослушать',
}: Props) {
  // Nothing to play: no clip and no speech synthesis available.
  if (!src && !speechAvailable()) return null;

  function play() {
    if (src) {
      const audio = new Audio(import.meta.env.BASE_URL + src);
      audio.play().catch(() => speak(text, { rate }));
    } else {
      speak(text, { rate });
    }
  }

  return (
    <Tooltip title={label} arrow>
      <IconButton
        size={size}
        onClick={play}
        aria-label={label}
        sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
      >
        <VolumeUpOutlined fontSize="inherit" />
      </IconButton>
    </Tooltip>
  );
}
