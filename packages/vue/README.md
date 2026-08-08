# @codeplayer71/audio-recorder-vue

Fully typed Vue audio recorder composable and ready-to-use recorder component based on the MediaRecorder API.

## Installation

```bash
pnpm add @codeplayer71/audio-recorder-vue
```

```bash
npm install @codeplayer71/audio-recorder-vue
```

```bash
yarn add @codeplayer71/audio-recorder-vue
```

## Ready-to-use component

```vue
<script setup lang="ts">
import { JamItAudioRecorder } from '@codeplayer71/audio-recorder-vue';
import '@codeplayer71/audio-recorder-vue/style.css';
</script>

<template>
  <JamItAudioRecorder />
</template>
```

The component includes a live audio level indicator while recording.

You can disable it with:

```vue
<JamItAudioRecorder :show-audio-level="false" />
```

## Headless composable

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
  </div>
</template>
```

`audioLevel` is a computed value normalized between `0` and `1`.

It updates while recording and resets to `0` when recording is paused or ends.

## Customization

The component supports typed props, named slots and CSS variables.

```vue
<JamItAudioRecorder
  title="Record a voice message"
  start-label="Start"
  stop-label="Finish"
  :max-duration-ms="60_000"
  :show-audio-level="true"
  :show-cancel="false"
/>
```

### Audio level slot

The default audio level UI can be replaced with the `audioLevel` slot:

```vue
<JamItAudioRecorder>
  <template
    #audioLevel="{
      audioLevel,
      snapshot,
      isRecording,
      isPaused,
    }"
  >
    <progress
      v-if="isRecording || isPaused"
      :value="audioLevel"
      max="1"
    />
  </template>
</JamItAudioRecorder>
```

The slot receives:

- `audioLevel`
- `snapshot`
- `isRecording`
- `isPaused`

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

```vue
<JamItAudioRecorder class="custom-recorder" />
```

## Audio level behavior

The built-in audio level indicator:

- is visible while recording
- remains visible while paused with a value of `0`
- is hidden outside active recording states
- uses `role="meter"` for accessibility
- exposes `aria-valuemin`, `aria-valuemax` and `aria-valuenow`
- uses the normalized `audioLevel` value from the core package
- does not calculate microphone levels inside Vue

The Vue package does not create its own `AudioContext` or analyser. Audio analysis is handled entirely by `@codeplayer71/audio-recorder-core`.

## Documentation

Full documentation and examples are available in the main repository:

https://github.com/codeplayer71/jamit-audio-recorder

## License

MIT
