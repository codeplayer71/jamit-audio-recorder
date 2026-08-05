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

## Headless composable

```vue
<script setup lang="ts">
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

<template>
  <div>
    <p>Status: {{ snapshot.state }}</p>
    <p>Duration: {{ snapshot.durationMs }} ms</p>

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

## Customization

The automatically registered component supports the same props, slots and CSS variables as `@codeplayer71/audio-recorder-vue`.

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