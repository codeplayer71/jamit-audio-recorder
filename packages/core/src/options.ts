export const DEFAULT_PREFERRED_MIME_TYPES = [
    'audio/webm;codecs=opus',
    'audio/ogg;codecs=opus',
    'audio/mp4',
    'audio/webm',
] as const;

export type AudioRecorderOptions = {
    preferredMimeTypes?: readonly string[];
    audioConstraints?: MediaTrackConstraints;
    maxDurationMs?: number;
    maxFileSizeBytes?: number;
    fileName?: string;
};