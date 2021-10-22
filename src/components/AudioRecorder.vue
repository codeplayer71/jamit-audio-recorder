<template>
  <div class="audioControls">
    <div>
      <div
        v-if="!recordAudioState"
        title="Start recording"
        @click="permissionStatus === 'denied' || audioIsPlaying === false ? recordAudio() : false"
        class="ar-icon"
        :class="permissionStatus === 'denied' || audioIsPlaying ? 'recorder-start-error' : 'recorder-start pointer'"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path
            fill="#FFF"
            d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"
          ></path>
          <path d="M0 0h24v24H0z" fill="none"></path>
        </svg>
      </div>
      <div
        v-if="recordAudioState"
        title="Stop recording"
        @click="stopRecordAudio"
        class="ar-icon recorder-stop pointer"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M0 0h24v24H0z" fill="none"></path>
          <path d="M6 6h12v12H6z" fill="#FFF"></path>
        </svg>
      </div>
    </div>
    <div v-show="audioFile && !recordAudioState" ref="audio" class="audio">
      <audio controls="controls"></audio>
    </div>
    <div v-show="recordAudioState && timer">
      <span class="audioTimer" ref="audioTimer"></span>
    </div>
    <div v-show="audioFile && !recordAudioState">
      <button
        title="Delete Audio"
        :disabled="audioIsPlaying"
        @click="deleteAudioFile"
        class="deleteAudio pointer">X</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AudioRecorder',
  props: {
    timer: {
      type: Boolean,
      default: true,
    },
  },
  mounted() {
    this.checkPermission();
  },
  data() {
    return {
      permissionStatus: null,
      recorder: null,
      audioIsPlaying: false,
      audioFile: null,
      audioType: 'audio/x-wav',
      audioFileName: 'audio.wav',
      uploadedAudioFile: null,
      recordAudioState: false,
      initialTime: Date.now(),
    };
  },
  methods: {
    async checkPermission() {
      const status = await navigator.permissions.query(
        { name: 'microphone' },
      );
      this.permissionStatus = status.state;
    },
    clearAudio() {
      const TIMER = this.$refs.audioTimer;
      this.initialTime = Date.now();
      TIMER.innerText = '';
    },
    checkAudioTime() {
      const TIMER = this.$refs.audioTimer;
      const timeDifference = Date.now() - this.initialTime;
      const formatted = this.convertAudioTime(timeDifference);
      TIMER.innerHTML = `${formatted}`;
    },
    convertAudioTime(miliseconds) {
      const totalSeconds = Math.floor(miliseconds / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds - minutes * 60;
      const sec = seconds < 10 ? `0${seconds}` : seconds;
      return `${minutes}:${sec}`;
    },
    recordAudio() {
      this.clearAudio();
      try {
        const device = navigator.mediaDevices.getUserMedia({ audio: true });
        const items = [];
        device.then((stream) => {
          this.recorder = new MediaRecorder(stream);
          this.recorder.ondataavailable = (e) => {
            items.push(e.data);
            if (this.recorder.state === 'inactive') {
              const blob = new Blob(items, { type: this.audioType });
              this.audioFile = URL.createObjectURL(blob);
              this.uploadedAudioFile = blob;
              const { audio } = this.$refs;
              audio.innerHTML = '';
              const mainaudio = document.createElement('audio');
              mainaudio.setAttribute('controls', 'controls');
              audio.appendChild(mainaudio);
              mainaudio.innerHTML = `<source src="${this.audioFile}" type="${this.audioType}" />`;
              mainaudio.onplay = () => {
                this.audioIsPlaying = true;
              };
              mainaudio.onpause = () => {
                this.audioIsPlaying = false;
              };
              mainaudio.onended = () => {
                this.audioIsPlaying = false;
              };
            }
          };
          this.recordAudioState = true;
          this.audioInterval = setInterval(this.checkAudioTime, 500);
          this.recorder.start();
        }).catch((err) => {
          // eslint-disable-next-line no-alert
          alert(err);
          // eslint-disable-next-line no-console
          console.log(err);
        });
      } catch (err) {
        // eslint-disable-next-line no-alert
        alert(`Audio error:  ${err}`);
        // eslint-disable-next-line no-console
        console.error('Audio error: ', err);
      }
    },
    stopRecordAudio() {
      clearInterval(this.audioInterval);
      this.recorder.stop();
      this.recordAudioState = false;
    },
    deleteAudioFile() {
      if (this.recordAudioState === false) {
        this.audioFile = null;
        this.uploadedAudioFile = null;
      }
    },
  },
  watch: {
    uploadedAudioFile(value) {
      this.$emit('audioFile', value);
    },
  },
};
</script>

<style scoped>

.audioControls {
  display: flex;
  align-items: center;
}

.ar-icon {
  width: 40px;
  height: 40px;
  line-height: 45px;
  border-radius: 50%;
  padding: 5px;
}

audio {
  max-height: 100%;
  max-width: 100%;
  margin: auto;
  object-fit: contain;
}

.audio {
  margin: 0 5px;
}
.recorder-start {
  background: green;
}
.recorder-start-error {
  background: gray;
}

.recorder-stop {
  background: red;
  box-shadow: 0 0 0 0 rgba(255, 82, 82, 1);
  animation: pulse 1500ms infinite;
}

@keyframes pulse {
  0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(255, 82, 82, 0.7);
  }

  70% {
    transform: scale(1);
    box-shadow: 0 0 0 10px rgba(255, 255, 255, 0);
  }

  100% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
  }
}

.audioTimer {
  background: #f1f3f4;
  padding: 5px 20px;
  color: #202020;
  border-radius: 5%;
  font-size: 1rem;
  font-weight: bold;
  margin: 0 0 0 5px;
}

.deleteAudio {
  background-color: darkred;
  color: #fff;
  padding: 5px;
  border-radius: 50px;
  width: 30px;
  height: 30px;
  border: none;
  font-weight: bold;
}

.deleteAudio:disabled {
  background-color: palevioletred;
}

.pointer {
  cursor: pointer;
}
</style>
