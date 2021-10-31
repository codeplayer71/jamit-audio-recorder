<template>
  <div>
    <AudioRecorder
      :timer="true"
      timer-color="#333"
      :timer-font-size="1.2"
      timer-background="#eee"
      :audio-width="200"
      @audioFile="myAudioFile"
    />
  </div>
</template>

<script>
import AudioRecorder from './components/AudioRecorder.vue';

export default {
  name: 'App',
  components: {
    AudioRecorder,
  },
  methods: {
    myAudioFile(audioFile) {
      // eslint-disable-next-line no-console
      console.log('myAudioFile: ', audioFile);
    },
  },
};
</script>
