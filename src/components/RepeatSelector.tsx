import { useState } from 'react';
import {
  matchPracticePreset,
  PRACTICE_PRESETS,
  MANTRA_COUNTS,
  formatRepeatLabel,
  type RepeatMode,
} from '../types/settings';
import './RepeatSelector.css';

interface RepeatSelectorProps {
  repeatMode: RepeatMode;
  repeatCount: number;
  onModeChange: (mode: RepeatMode) => void;
  onCountChange: (count: number) => void;
}

const RepeatSelector: React.FC<RepeatSelectorProps> = ({
  repeatMode,
  repeatCount,
  onModeChange,
  onCountChange,
}) => {
  const activePreset = matchPracticePreset(repeatMode, repeatCount);
  const [showAdvanced, setShowAdvanced] = useState(activePreset === 'custom');

  return (
    <div className="repeat-selector">
      <div className="repeat-display">
        <h2>{formatRepeatLabel(repeatMode, repeatCount)}</h2>
      </div>

      <p className="repeat-label">Session length</p>
      <div className="practice-preset-list">
        {PRACTICE_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={`practice-preset${activePreset === preset.id ? ' active' : ''}`}
            onClick={() => {
              onModeChange('fixed');
              onCountChange(preset.count);
              setShowAdvanced(false);
            }}
          >
            <strong>{preset.label}</strong>
            <span>{preset.description}</span>
          </button>
        ))}
      </div>

      <button
        type="button"
        className="repeat-advanced-toggle"
        onClick={() => setShowAdvanced((prev) => !prev)}
      >
        {showAdvanced ? 'Hide advanced' : 'Advanced counts'}
      </button>

      {showAdvanced && (
        <div className="repeat-advanced">
          <p className="repeat-label">Mantra counts</p>
          <div className="mantra-chips">
            {MANTRA_COUNTS.map((count) => (
              <button
                key={count}
                type="button"
                className={`mantra-chip ${repeatMode === 'fixed' && repeatCount === count ? 'active' : ''}`}
                onClick={() => {
                  onModeChange('fixed');
                  onCountChange(count);
                }}
              >
                {count}x
              </button>
            ))}
            <button
              type="button"
              className={`mantra-chip ${repeatMode === 'unlimited' ? 'active' : ''}`}
              onClick={() => onModeChange('unlimited')}
            >
              Unlimited
            </button>
          </div>

          {repeatMode === 'fixed' && (
            <>
              <p className="repeat-label">Custom count</p>
              <input
                type="range"
                min={1}
                max={108}
                step={1}
                value={repeatCount}
                onChange={(e) => onCountChange(Number(e.target.value))}
                className="repeat-range"
              />
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default RepeatSelector;
