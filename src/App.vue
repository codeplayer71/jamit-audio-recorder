<template>
 <div>
  <AudioRecorder :timer="true" @audioFile="myAudioFile" />
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
