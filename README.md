# JamIT Audio Recorder

A modern, framework-friendly audio recording library for Vanilla TypeScript, Vue, Nuxt and React.

## Live demo

Test the JamIT Audio Recorder directly in your browser. Try recording, pausing, resuming, live audio level monitoring, playback, downloading, and the ready-to-use recorder interface.

[Open the interactive live demo](https://jamit.one/packages/jamit-audio-recorder)

## Packages

- `@codeplayer71/audio-recorder-core`
- `@codeplayer71/audio-recorder-vue`
- `@codeplayer71/audio-recorder-react`
- `@codeplayer71/audio-recorder-nuxt`

## Features

- Start, pause, resume, stop, cancel and reset recordings
- Framework-independent TypeScript core
- Typed Vue composable and React hook
- Ready-to-use Vue and React recorder components
- Nuxt module with automatic imports and component registration
- Maximum duration and file-size limits
- Live audio level monitoring during recording
- Browser-aware MIME-type detection
- Playback and download support
- Customizable styles through CSS variables
- Slots for Vue and render props for React
- Automatic resource cleanup

## Project status

JamIT Audio Recorder is publicly available on npm and actively developed.

The recording core, framework integrations, ready-to-use components and example applications are functional. New backwards-compatible features are released through the monorepo's Changesets-based release workflow.

## Installation

Install only the package required by your application.

### Core

```bash
pnpm add @codeplayer71/audio-recorder-core
```

### Vue

```bash
pnpm add @codeplayer71/audio-recorder-vue
```

### React

```bash
pnpm add @codeplayer71/audio-recorder-react
```

### Nuxt

```bash
pnpm add @codeplayer71/audio-recorder-nuxt
```

## Core

The framework-independent core can be used directly in any browser application.

```ts
import { createAudioRecorder } from '@codeplayer71/audio-recorder-core';

const recorder = createAudioRecorder({
  maxDurationMs: 120_000,
  maxFileSizeBytes: 10_000_000,
  audioConstraints: {
    channelCount: 1,
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
});

const unsubscribe = recorder.subscribe((snapshot) => {
  console.log(snapshot.state);
  console.log(snapshot.durationMs);
  console.log(snapshot.audioLevel);
  console.log(snapshot.recording);
  console.log(snapshot.error);
});

await recorder.start();

recorder.pause();
recorder.resume();

const recording = await recorder.stop();

console.log(recording.file);
console.log(recording.url);

unsubscribe();
recorder.destroy();
```

The `audioLevel` value is normalized to the range `0` to `1`.

It is updated while recording and returns to `0` when recording is paused, stopped, cancelled, reset or destroyed.

## Vue

### Ready-to-use component

Import the component and its styles:

```vue
<script setup lang="ts">
import { JamItAudioRecorder } from '@codeplayer71/audio-recorder-vue';
import '@codeplayer71/audio-recorder-vue/style.css';
</script>

<template>
  <JamItAudioRecorder />
</template>
```

The built-in component includes a live audio level indicator while recording.

You can disable it with:

```vue
<JamItAudioRecorder :show-audio-level="false" />
```

### Headless composable

Use the composable when you want to build a completely custom interface:

```vue
<script setup lang="ts">
import { useAudioRecorder } from '@codeplayer71/audio-recorder-vue';

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
</script>

<template>
  <div>
    <p>Status: {{ snapshot.state }}</p>
    <p>Duration: {{ snapshot.durationMs }} ms</p>

    <progress
      :value="audioLevel"
      max="1"
    />

    <button
      type="button"
      @click="start"
    >
      Start
    </button>

    <button
      type="button"
      @click="pause"
    >
      Pause
    </button>

    <button
      type="button"
      @click="resume"
    >
      Resume
    </button>

    <button
      type="button"
      @click="stop"
    >
      Stop
    </button>

    <button
      type="button"
      @click="cancel"
    >
      Cancel
    </button>

    <button
      type="button"
      @click="reset"
    >
      Reset
    </button>
  </div>
</template>
```

## React

### Ready-to-use component

Import the component and its styles:

```tsx
import {
  JamItAudioRecorder,
} from '@codeplayer71/audio-recorder-react';
import '@codeplayer71/audio-recorder-react/style.css';

export function Recorder() {
  return <JamItAudioRecorder />;
}
```

The built-in component includes a live audio level indicator while recording.

You can disable it with:

```tsx
<JamItAudioRecorder showAudioLevel={false} />
```

### Headless hook

Use the hook when you want full control over the interface:

```tsx
import {
  useAudioRecorder,
} from '@codeplayer71/audio-recorder-react';

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

      <button
        type="button"
        onClick={() => void start()}
      >
        Start
      </button>

      <button
        type="button"
        onClick={pause}
      >
        Pause
      </button>

      <button
        type="button"
        onClick={resume}
      >
        Resume
      </button>

      <button
        type="button"
        onClick={() => void stop()}
      >
        Stop
      </button>

      <button
        type="button"
        onClick={cancel}
      >
        Cancel
      </button>

      <button
        type="button"
        onClick={reset}
      >
        Reset
      </button>
    </div>
  );
}
```

## Nuxt

Register the module in `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['@codeplayer71/audio-recorder-nuxt'],
});
```

The module automatically provides:

- `useAudioRecorder()`
- `<JamItAudioRecorder />`
- the default component styles

The component can be used without a manual import:

```vue
<template>
  <JamItAudioRecorder />
</template>
```

The composable is also automatically available:

```vue
<script setup lang="ts">
const {
  snapshot,
  audioLevel,
  start,
  pause,
  resume,
  stop,
  cancel,
  reset,
} = useAudioRecorder();
</script>

<template>
  <progress
    :value="audioLevel"
    max="1"
  />
</template>
```

Nuxt uses the Vue integration internally. It does not implement its own audio level calculation.

## Component customization

The ready-to-use Vue and React components provide a professional default interface while remaining customizable.

### Labels and visible sections

```vue
<JamItAudioRecorder
  title="Record a voice message"
  start-label="Start"
  stop-label="Finish"
  download-label="Save recording"
  :max-duration-ms="60_000"
  :max-file-size-bytes="5_000_000"
  :show-audio-level="true"
  :show-cancel="false"
/>
```

Available display options include:

- `showTitle`
- `showStatus`
- `showDuration`
- `showAudioLevel`
- `showPlayer`
- `showDownload`
- `showCancel`
- `showReset`

### CSS variables

The default design can be customized without replacing the component structure:

```css
.custom-recorder {
  --jamit-recorder-background: #0f172a;
  --jamit-recorder-color: #ffffff;
  --jamit-recorder-muted-color: #94a3b8;
  --jamit-recorder-border-color: #334155;
  --jamit-recorder-primary: #2dd4bf;
  --jamit-recorder-primary-hover: #14b8a6;
  --jamit-recorder-danger: #ef4444;
  --jamit-recorder-danger-hover: #dc2626;
  --jamit-recorder-border-radius: 20px;
  --jamit-recorder-button-radius: 10px;
  --jamit-recorder-spacing: 28px;
  --jamit-recorder-icon-size: 20px;

  --jamit-recorder-audio-level-background: #334155;
  --jamit-recorder-audio-level-color: #2dd4bf;
  --jamit-recorder-audio-level-height: 0.5rem;
}
```

Vue:

```vue
<JamItAudioRecorder class="custom-recorder" />
```

React:

```tsx
<JamItAudioRecorder className="custom-recorder" />
```

## Vue slots

Individual areas of the Vue component can be replaced through named slots.

```vue
<JamItAudioRecorder>
  <template #header>
    <h2>Voice message</h2>
  </template>

  <template #audioLevel="{ audioLevel }">
    <progress
      :value="audioLevel"
      max="1"
    />
  </template>

  <template
    #controls="{
      start,
      stop,
      isRecording,
    }"
  >
    <button
      v-if="!isRecording"
      type="button"
      @click="start"
    >
      Record
    </button>

    <button
      v-else
      type="button"
      @click="stop"
    >
      Finish
    </button>
  </template>
</JamItAudioRecorder>
```

Available slots:

- `header`
- `status`
- `duration`
- `audioLevel`
- `controls`
- `error`
- `player`
- `download`
- `footer`

## React render props

Individual areas of the React component can be replaced through render props.

```tsx
<JamItAudioRecorder
  renderHeader={() => (
    <h2>Voice message</h2>
  )}
  renderAudioLevel={({ audioLevel }) => (
    <progress
      value={audioLevel}
      max={1}
    />
  )}
  renderControls={({
    start,
    stop,
    isRecording,
  }) => (
    <div>
      {!isRecording ? (
        <button
          type="button"
          onClick={() => void start()}
        >
          Record
        </button>
      ) : (
        <button
          type="button"
          onClick={() => void stop()}
        >
          Finish
        </button>
      )}
    </div>
  )}
/>
```

Available render props:

- `renderHeader`
- `renderStatus`
- `renderDuration`
- `renderAudioLevel`
- `renderControls`
- `renderError`
- `renderPlayer`
- `renderDownload`
- `renderFooter`

## Recorder options

The recorder accepts configuration options such as:

```ts
{
  maxDurationMs: 120_000,
  maxFileSizeBytes: 10_000_000,
  audioConstraints: {
    channelCount: 1,
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
}
```

### `maxDurationMs`

Maximum recording duration in milliseconds.

### `maxFileSizeBytes`

Maximum recording size in bytes.

### `audioConstraints`

Browser media constraints passed to the microphone request.

## Recorder state

The recorder snapshot contains:

```ts
type RecorderSnapshot = {
  state: RecorderState;
  durationMs: number;
  recording: AudioRecording | null;
  error: AudioRecorderError | null;
  audioLevel: number;
};
```

`audioLevel` is a normalized live microphone level between `0` and `1`.

It is intended as lightweight visual feedback for microphone activity and should not be treated as a professional decibel measurement.

The recorder state can include values such as:

```text
idle
requesting-permission
recording
paused
processing
completed
error
```

## Recording result

A completed recording contains:

```ts
type AudioRecording = {
  blob: Blob;
  file: File;
  url: string;
  durationMs: number;
  mimeType: string;
  extension: string;
  sizeBytes: number;
  createdAt: Date;
};
```

The object URL can be used for immediate playback, while the file can be uploaded or downloaded.

## Browser formats

Audio recording is based on the browser `MediaRecorder` API.

The resulting format depends on the MIME types supported by the current browser. Chromium-based browsers commonly create:

```text
audio/webm;codecs=opus
```

Other browsers may use formats such as:

```text
audio/mp4
audio/ogg
audio/webm
```

The library detects the actual MIME type and assigns the matching file extension. It does not simply rename the recorded file.

## Live audio level monitoring

Live audio level monitoring is implemented in the framework-independent core with the Web Audio API.

The existing microphone `MediaStream` is reused for both recording and analysis. No second microphone stream is requested.

The level:

- is normalized between `0` and `1`
- reacts to microphone input while recording
- is smoothed to reduce visual flicker
- resets to `0` while paused
- resets to `0` when recording ends
- does not connect the microphone to the audio output
- does not modify the recorded audio
- does not provide a professional dB measurement

Vue, React and Nuxt consume the same core value and do not calculate their own audio level.

## Resource cleanup

The library automatically cleans up:

- microphone media streams
- duration timers
- object URLs
- state subscriptions
- framework lifecycle resources
- Web Audio API analysis resources
- animation frames used for audio level monitoring

Audio-level resources such as `AudioContext`, `MediaStreamAudioSourceNode` and `AnalyserNode` are released when monitoring stops.

The Vue integration cleans up when its effect scope is disposed.

The React integration also handles development behavior in React Strict Mode.

## Development

Install workspace dependencies:

```bash
pnpm install
```

Run all tests:

```bash
pnpm test
```

Run all type checks:

```bash
pnpm typecheck
```

Build all packages and examples:

```bash
pnpm build
```

Run an individual example:

```bash
pnpm --filter @codeplayer71/audio-recorder-example-vanilla dev
pnpm --filter @codeplayer71/audio-recorder-example-vue dev
pnpm --filter @codeplayer71/audio-recorder-example-react dev
pnpm --filter @codeplayer71/audio-recorder-example-nuxt dev
```

## Repository

Source code and development progress:

https://github.com/codeplayer71/jamit-audio-recorder
