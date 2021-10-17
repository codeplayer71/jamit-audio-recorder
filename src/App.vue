<template>
  <AudioRecorder :timer="true" />
</template>

<script>
import AudioRecorder from './components/AudioRecorder.vue';

export default {
  name: 'App',
  components: {
    AudioRecorder,
  },
};
</script>
