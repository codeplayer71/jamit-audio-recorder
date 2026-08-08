# @codeplayer71/audio-recorder-react

Fully typed React audio recorder hook and ready-to-use recorder component based on the MediaRecorder API.

## Installation

```bash
pnpm add @codeplayer71/audio-recorder-react
```

```bash
npm install @codeplayer71/audio-recorder-react
```

```bash
yarn add @codeplayer71/audio-recorder-react
```

## Ready-to-use component

```tsx
import { JamItAudioRecorder } from '@codeplayer71/audio-recorder-react';
import '@codeplayer71/audio-recorder-react/style.css';

export function Recorder() {
  return <JamItAudioRecorder />;
}
```

The component includes a live audio level indicator while recording.

You can disable it with:

```tsx
<JamItAudioRecorder showAudioLevel={false} />
```

## Headless hook

```tsx
import { useAudioRecorder } from '@codeplayer71/audio-recorder-react';

export function Recorder() {
  const {
    snapshot,
    audioLevel,
    start,
    pause,
    resume,
    stop,
    cancel,
    reset,
  } = useAudioRecorder({
    maxDurationMs: 120_000,
    maxFileSizeBytes: 10_000_000,
  });

  return (
    <div>
      <p>Status: {snapshot.state}</p>
      <p>Duration: {snapshot.durationMs} ms</p>

      <progress
        value={audioLevel}
        max={1}
      />

      <button type="button" onClick={() => void start()}>
        Start
      </button>

      <button type="button" onClick={pause}>
        Pause
      </button>

      <button type="button" onClick={resume}>
        Resume
      </button>

      <button type="button" onClick={() => void stop()}>
        Stop
      </button>

      <button type="button" onClick={cancel}>
        Cancel
      </button>

      <button type="button" onClick={reset}>
        Reset
      </button>
    </div>
  );
}
```

`audioLevel` is normalized between `0` and `1`.

It updates while recording and resets to `0` when recording is paused or ends.

## Customization

The component supports typed props, render props and CSS variables.

```tsx
<JamItAudioRecorder
  title="Record a voice message"
  startLabel="Start"
  stopLabel="Finish"
  maxDurationMs={60_000}
  showAudioLevel
  showCancel={false}
/>
```

### Audio level render prop

The default audio level UI can be replaced with `renderAudioLevel`:

```tsx
<JamItAudioRecorder
  renderAudioLevel={({
    audioLevel,
    snapshot,
    isRecording,
    isPaused,
  }) => (
    <progress
      value={audioLevel}
      max={1}
      aria-label={`Audio level: ${Math.round(audioLevel * 100)}%`}
    />
  )}
/>
```

The render state includes:

- `audioLevel`
- `snapshot`
- `isRecording`
- `isPaused`
- the existing recorder state and actions

### CSS variables

The recorder can be customized through CSS variables:

```css
.custom-recorder {
  --jamit-recorder-primary: #2dd4bf;
  --jamit-recorder-border-radius: 20px;
  --jamit-recorder-button-radius: 10px;

  --jamit-recorder-audio-level-background: #334155;
  --jamit-recorder-audio-level-color: #2dd4bf;
  --jamit-recorder-audio-level-height: 0.5rem;
}
```

```tsx
<JamItAudioRecorder className="custom-recorder" />
```

## Audio level behavior

The built-in audio level indicator:

- is visible while recording
- remains visible while paused with a value of `0`
- is hidden outside active recording states
- uses `role="meter"` for accessibility
- exposes `aria-valuemin`, `aria-valuemax` and `aria-valuenow`
- uses the normalized `audioLevel` value from the core package
- does not calculate microphone levels inside React

The React package does not create its own `AudioContext` or analyser. Audio analysis is handled entirely by `@codeplayer71/audio-recorder-core`.

## Documentation

Full documentation and examples are available in the main repository:

https://github.com/codeplayer71/jamit-audio-recorder

## License

MIT
