import {
    DEFAULT_PREFERRED_MIME_TYPES,
    type AudioRecorderOptions,
} from './options';

export type NormalizedAudioRecorderOptions = {
    preferredMimeTypes: readonly string[];
    audioConstraints: MediaTrackConstraints;
    maxDurationMs: number | null;
    maxFileSizeBytes: number | null;
    fileName: string;
};

const DEFAULT_FILE_NAME = 'audio-recording';

export function normalizeAudioRecorderOptions(
    options: AudioRecorderOptions = {},
): NormalizedAudioRecorderOptions {
    const maxDurationMs = options.maxDurationMs ?? null;
    const maxFileSizeBytes = options.maxFileSizeBytes ?? null;

    if (maxDurationMs !== null && maxDurationMs <= 0) {
        throw new TypeError('maxDurationMs must be greater than 0.');
    }

    if (maxFileSizeBytes !== null && maxFileSizeBytes <= 0) {
        throw new TypeError('maxFileSizeBytes must be greater than 0.');
    }

    const preferredMimeTypes =
        options.preferredMimeTypes ?? DEFAULT_PREFERRED_MIME_TYPES;

    if (preferredMimeTypes.length === 0) {
        throw new TypeError('preferredMimeTypes must not be empty.');
    }

    const fileName = options.fileName?.trim() || DEFAULT_FILE_NAME;

    return {
        preferredMimeTypes: [...preferredMimeTypes],
        audioConstraints: {
            ...options.audioConstraints,
        },
        maxDurationMs,
        maxFileSizeBytes,
        fileName,
    };
}