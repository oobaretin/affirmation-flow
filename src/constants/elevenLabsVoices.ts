export interface ElevenLabsVoice {
  id: string;
  name: string;
  description: string;
  /** ElevenLabs voice category — only custom/generated voices work on free-tier API. */
  category?: string;
}

export const KNIGHT_VOICE_ID = '45UYeUCUrGxt4rWuj2Ir';
export const MAYA_VOICE_ID = '1mxDhDmIEPvRsmFiOpqp';
export const RO_VOICE_ID = 'tWJgshgnbZaAWXStuXh6';

/** Custom Voice Design voices for AffirmEaze. */
export const ELEVENLABS_VOICES: ElevenLabsVoice[] = [
  {
    id: KNIGHT_VOICE_ID,
    name: 'Knight',
    description: 'Calm & steady',
    category: 'generated',
  },
  {
    id: MAYA_VOICE_ID,
    name: 'Maya',
    description: 'Warm & gentle',
    category: 'generated',
  },
  {
    id: RO_VOICE_ID,
    name: 'Ro',
    description: 'Grounded & clear',
    category: 'generated',
  },
];

export const APP_ELEVENLABS_VOICE_IDS = new Set(ELEVENLABS_VOICES.map((voice) => voice.id));

export const DEFAULT_ELEVENLABS_VOICE_ID = KNIGHT_VOICE_ID;
