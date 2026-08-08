export type RecorderState =
    | 'idle'
    | 'requesting-permission'
    | 'recording'
    | 'paused'
    | 'processing'
    | 'completed'
    | 'error';

export type AudioRecorderErrorCode =
    | 'unsupported-browser'
    | 'media-recorder-unavailable'
    | 'permission-denied'
    | 'permission-dismissed'
    | 'device-not-found'
    | 'device-in-use'
    | 'unsupported-mime-type'
    | 'recording-failed'
    | 'invalid-state'
    | 'max-duration-exceeded'
    | 'max-file-size-exceeded'
    | 'audio-context-failed'
    | 'unknown';

export type AudioRecorderError = {
    code: AudioRecorderErrorCode;
    message: string;
    originalError?: unknown;
};

export type AudioRecording = {
    blob: Blob;
    file: File;
    url: string;
    durationMs: number;
    sizeBytes: number;
    mimeType: string;
    extension: string;
    createdAt: Date;
};

export type RecorderSnapshot = Readonly<{
    state: RecorderState;
    durationMs: number;
    recording: AudioRecording | null;
    error: AudioRecorderError | null;
    audioLevel: number;
}>;