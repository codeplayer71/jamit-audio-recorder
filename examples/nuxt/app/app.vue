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
  audioConstraints: {
    channelCount: 1,
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
});

const formattedDuration = computed(() => {
  const totalSeconds = Math.floor(snapshot.value.durationMs / 1_000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
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
          @click="start"
      >
        Start
      </button>

      <button
          type="button"
          :disabled="snapshot.state !== 'recording'"
          @click="pause"
      >
        Pause
      </button>

      <button
          type="button"
          :disabled="snapshot.state !== 'paused'"
          @click="resume"
      >
        Resume
      </button>

      <button
          type="button"
          :disabled="!['recording', 'paused'].includes(snapshot.state)"
          @click="stop"
      >
        Stop
      </button>

      <button
          type="button"
          :disabled="!['recording', 'paused'].includes(snapshot.state)"
          @click="cancel"
      >
        Cancel
      </button>

      <button
          type="button"
          :disabled="snapshot.recording === null && snapshot.error === null"
          @click="reset"
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
  </main>
</template>