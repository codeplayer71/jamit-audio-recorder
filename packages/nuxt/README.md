# @codeplayer71/audio-recorder-nuxt

Nuxt module for automatic audio recorder composable imports, component registration and default styles.

## Installation

```bash
pnpm add @codeplayer71/audio-recorder-nuxt
```

```bash
npm install @codeplayer71/audio-recorder-nuxt
```

```bash
yarn add @codeplayer71/audio-recorder-nuxt
```

## Setup

Register the module in `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['@codeplayer71/audio-recorder-nuxt'],
});
```

The module automatically:

- imports `useAudioRecorder`
- registers `JamItAudioRecorder`
- includes the default component styles

## Component usage

```vue
<template>
  <JamItAudioRecorder />
</template>
```

No manual component import or CSS import is required.

The component includes the live audio level indicator provided by the Vue package.

You can disable it with:

```vue
<JamItAudioRecorder :show-audio-level="false" />
```

## Headless composable

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

    <button type="button" @click="start">
      Start
    </button>

    <button type="button" @click="pause">
      Pause
    </button>

    <button type="button" @click="resume">
      Resume
    </button>

    <button type="button" @click="stop">
      Stop
    </button>

    <button type="button" @click="cancel">
      Cancel
    </button>

    <button type="button" @click="reset">
      Reset
    </button>
  </div>
</template>
```

`audioLevel` is normalized between `0` and `1`.

It updates while recording and resets to `0` when recording is paused or ends.

## Customization

The automatically registered component supports the same props, slots and CSS variables as `@codeplayer71/audio-recorder-vue`.

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

Because Nuxt reuses the Vue component directly, the `audioLevel` slot is also available:

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

### CSS variables

The recorder can be customized through the same CSS variables as the Vue package:

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

Nuxt does not implement its own audio level analysis.

The module reuses `@codeplayer71/audio-recorder-vue`, which in turn exposes the `audioLevel` value from `@codeplayer71/audio-recorder-core`.

The built-in indicator:

- is visible while recording
- remains visible while paused with a value of `0`
- is hidden outside active recording states
- uses `role="meter"` for accessibility
- exposes `aria-valuemin`, `aria-valuemax` and `aria-valuenow`
- does not create an additional microphone stream
- does not calculate microphone levels inside Nuxt

## Documentation

Full documentation and examples are available in the main repository:

https://github.com/codeplayer71/jamit-audio-recorder

## License

MIT
