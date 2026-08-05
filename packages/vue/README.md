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

## Headless composable

```vue
<script setup lang="ts">
import { useAudioRecorder } from '@codeplayer71/audio-recorder-vue';

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
</script>
```

## Customization

The component supports typed props, named slots and CSS variables.

```vue
<JamItAudioRecorder
  title="Record a voice message"
  start-label="Start"
  stop-label="Finish"
  :max-duration-ms="60_000"
  :show-cancel="false"
/>
```

```css
.custom-recorder {
  --jamit-recorder-primary: #2dd4bf;
  --jamit-recorder-border-radius: 20px;
  --jamit-recorder-button-radius: 10px;
}
```

```vue
<JamItAudioRecorder class="custom-recorder" />
```

## Documentation

Full documentation and examples are available in the main repository:

https://github.com/codeplayer71/jamit-audio-recorder

## License

MIT