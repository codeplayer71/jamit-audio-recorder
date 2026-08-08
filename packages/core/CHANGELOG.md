# @codeplayer71/audio-recorder-core

## 1.1.0

### Minor Changes

- 641dbf5: Add live normalized audio level monitoring across the JamIT Audio Recorder packages.

  The core now exposes `audioLevel` as a normalized value between `0` and `1`, calculated from the active microphone stream using Web Audio API analysis with smoothing and automatic lifecycle cleanup.

  Vue and React expose the live audio level through their composable and hook and include an accessible built-in level meter with customization options.

  Nuxt automatically exposes the same functionality through the Vue integration.

## 1.0.0

### Major Changes

- 7cb467d: Publish the first stable release of JamIT Audio Recorder under the codeplayer71 npm scope, including the framework-independent core, Vue and React integrations, ready-to-use recorder components and automatic Nuxt integration.
