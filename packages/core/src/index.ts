export {
    normalizeAudioRecorderOptions,
} from './normalize-options';

export type {
    NormalizedAudioRecorderOptions,
} from './normalize-options';

export {
    DEFAULT_PREFERRED_MIME_TYPES,
} from './options';

export type {
    AudioRecorderOptions,
} from './options';

export type {
    AudioRecorderError,
    AudioRecorderErrorCode,
    AudioRecording,
    RecorderSnapshot,
    RecorderState,
} from './types';

export {
    selectSupportedMimeType,
} from './select-supported-mime-type';

export {
    canTransitionRecorderState,
} from './recorder-state-machine';

export {
    createAudioRecorderError,
    mapMediaAccessError,
} from './audio-recorder-error';

export {
    detectAudioRecorderBrowserSupport,
    getDefaultBrowserEnvironment,
} from './browser-support';

export type {
    AudioRecorderBrowserEnvironment,
    AudioRecorderBrowserSupport,
} from './browser-support';

export {
    createAudioRecorder,
} from './create-audio-recorder';

export type {
    AudioRecorder,
    CreateAudioRecorderOptions,
} from './create-audio-recorder';

export {
    getFileExtensionFromMimeType,
} from './get-file-extension';

export const JAMIT_AUDIO_RECORDER_CORE_VERSION = '0.0.0';