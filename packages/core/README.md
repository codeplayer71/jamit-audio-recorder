# @codeplayer71/audio-recorder-core

Framework-independent and fully typed browser audio recording core based on the MediaRecorder API.

## Installation

```bash
pnpm add @codeplayer71/audio-recorder-core
```

```bash
npm install @codeplayer71/audio-recorder-core
```

```bash
yarn add @codeplayer71/audio-recorder-core
```

## Usage

```ts
import { createAudioRecorder } from '@codeplayer71/audio-recorder-core';

const recorder = createAudioRecorder({
  maxDurationMs: 120_000,
  maxFileSizeBytes: 10_000_000,
});

const unsubscribe = recorder.subscribe((snapshot) => {
  console.log(snapshot.state);
  console.log(snapshot.durationMs);
  console.log(snapshot.audioLevel);
  console.log(snapshot.recording);
  console.log(snapshot.error);
});

await recorder.start();

const recording = await recorder.stop();

console.log(recording.file);
console.log(recording.url);

unsubscribe();
recorder.destroy();
```

## Live audio level

The recorder snapshot exposes a normalized live microphone level:

```ts
recorder.subscribe((snapshot) => {
  console.log(snapshot.audioLevel);
});
```

The value is always between:

```text
0 <= audioLevel <= 1
```

The level is intended as lightweight visual feedback for microphone activity.

It is not a professional decibel measurement.

### Behavior

The value is updated while the recorder is in the `recording` state.

It is reset to `0` when the recorder is:

- idle
- requesting microphone permission
- paused
- processing
- completed
- in an error state
- cancelled
- reset
- destroyed

## Implementation details

Live audio level monitoring uses the Web Audio API internally.

The recorder reuses the same `MediaStream` that is already created for `MediaRecorder`.

No second microphone stream is requested.

Internally, the level is calculated from time-domain samples using an RMS-based measurement and simple smoothing.

The analyser is not connected to the audio output, so microphone monitoring does not produce speaker playback or feedback.

## Failure behavior

Audio level monitoring is treated as an optional enhancement.

If the required Web Audio APIs are unavailable or `AudioContext` initialization fails:

- the audio recording continues normally
- `audioLevel` remains `0`
- no fatal recorder error is generated solely because audio level monitoring failed

## Resource cleanup

Audio level monitoring resources are cleaned up automatically.

This includes:

- `AudioContext`
- `MediaStreamAudioSourceNode`
- `AnalyserNode`
- `requestAnimationFrame`

Cleanup happens when monitoring stops, including on pause, stop, cancel, reset and destroy.

## Documentation

Full documentation, framework integrations and examples are available in the main repository:

https://github.com/codeplayer71/jamit-audio-recorder

## License

MIT
