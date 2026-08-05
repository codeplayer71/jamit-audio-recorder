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

## Headless hook

```tsx
import { useAudioRecorder } from '@codeplayer71/audio-recorder-react';

export function Recorder() {
  const {
    snapshot,
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

## Customization

The component supports typed props, render props and CSS variables.

```tsx
<JamItAudioRecorder
  title="Record a voice message"
  startLabel="Start"
  stopLabel="Finish"
  maxDurationMs={60_000}
  showCancel={false}
/>
```

```css
.custom-recorder {
  --jamit-recorder-primary: #2dd4bf;
  --jamit-recorder-border-radius: 20px;
  --jamit-recorder-button-radius: 10px;
}
```

```tsx
<JamItAudioRecorder className="custom-recorder" />
```

## Documentation

Full documentation and examples are available in the main repository:

https://github.com/codeplayer71/jamit-audio-recorder

## License

MIT