import {
    createAudioRecorder,
    DEFAULT_PREFERRED_MIME_TYPES,
} from '@jamit/audio-recorder-core';

console.log({
    hasCreateAudioRecorder:
        typeof createAudioRecorder === 'function',
    preferredMimeTypes:
    DEFAULT_PREFERRED_MIME_TYPES,
});