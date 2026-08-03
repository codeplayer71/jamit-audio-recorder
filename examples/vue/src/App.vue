<script setup lang="ts">
import {
  createAudioRecorder,
  type RecorderSnapshot,
} from '@jamit/audio-recorder-core';
import { computed, onBeforeUnmount, ref } from 'vue';

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

const snapshot = ref<RecorderSnapshot>(recorder.getSnapshot());

const unsubscribe = recorder.subscribe((nextSnapshot) => {
  snapshot.value = nextSnapshot;
});

const formattedDuration = computed(() => {
  const totalSeconds = Math.floor(snapshot.value.durationMs / 1_000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
});

async function startRecording(): Promise<void> {
  await recorder.start();
}

function pauseRecording(): void {
  recorder.pause();
}

function resumeRecording(): void {
  recorder.resume();
}

async function stopRecording(): Promise<void> {
  await recorder.stop();
}

function cancelRecording(): void {
  recorder.cancel();
}

function resetRecording(): void {
  recorder.reset();
}

onBeforeUnmount(() => {
  unsubscribe();
  recorder.destroy();
});
</script>

<template>
  <main class="recorder">
    <h1>JamIT Audio Recorder</h1>

    <p class="recorder__status">
      Status:
      <strong>{{ snapshot.state }}</strong>
    </p>

    <p>Duration: {{ formattedDuration }}</p>

    <div class="recorder__actions">
      <button
          type="button"
          :disabled="snapshot.state !== 'idle'"
          @click="startRecording"
      >
        Start
      </button>

      <button
          type="button"
          :disabled="snapshot.state !== 'recording'"
          @click="pauseRecording"
      >
        Pause
      </button>

      <button
          type="button"
          :disabled="snapshot.state !== 'paused'"
          @click="resumeRecording"
      >
        Resume
      </button>

      <button
          type="button"
          :disabled="!['recording', 'paused'].includes(snapshot.state)"
          @click="stopRecording"
      >
        Stop
      </button>

      <button
          type="button"
          :disabled="!['recording', 'paused'].includes(snapshot.state)"
          @click="cancelRecording"
      >
        Cancel
      </button>

      <button
          type="button"
          :disabled="snapshot.recording === null && snapshot.error === null"
          @click="resetRecording"
      >
        Reset
      </button>
    </div>

    <p
        v-if="snapshot.error"
        class="recorder__error"
    >
      {{ snapshot.error.message }}
    </p>

    <audio
        v-if="snapshot.recording"
        :src="snapshot.recording.url"
        controls
    />

    <a
        class="recorder__download"
        :class="{
        'recorder__download--disabled': snapshot.recording === null,
      }"
        :href="snapshot.recording?.url"
        :download="snapshot.recording?.file.name"
        :aria-disabled="snapshot.recording === null"
        :tabindex="snapshot.recording ? 0 : -1"
    >
      Download recording
    </a>
  </main>
  <footer class="recorder__footer">
    Created by
    <a
        href="https://jamit.one"
        target="_blank"
        rel="noopener noreferrer"
    >
      JamIT
    </a>
  </footer>
</template>