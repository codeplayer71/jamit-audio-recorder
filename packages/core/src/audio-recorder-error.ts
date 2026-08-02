import type {
    AudioRecorderError,
    AudioRecorderErrorCode,
} from './types';

export function createAudioRecorderError(
    code: AudioRecorderErrorCode,
    message: string,
    originalError?: unknown,
): AudioRecorderError {
    return {
        code,
        message,
        ...(originalError === undefined
            ? {}
            : { originalError }),
    };
}

export function mapMediaAccessError(
    error: unknown,
): AudioRecorderError {
    if (!(error instanceof DOMException)) {
        return createAudioRecorderError(
            'unknown',
            'An unknown error occurred while requesting microphone access.',
            error,
        );
    }

    switch (error.name) {
        case 'NotAllowedError':
        case 'SecurityError':
            return createAudioRecorderError(
                'permission-denied',
                'Microphone permission was denied.',
                error,
            );

        case 'AbortError':
            return createAudioRecorderError(
                'permission-dismissed',
                'The microphone permission request was dismissed.',
                error,
            );

        case 'NotFoundError':
        case 'DevicesNotFoundError':
            return createAudioRecorderError(
                'device-not-found',
                'No audio input device was found.',
                error,
            );

        case 'NotReadableError':
        case 'TrackStartError':
            return createAudioRecorderError(
                'device-in-use',
                'The audio input device is unavailable or already in use.',
                error,
            );

        default:
            return createAudioRecorderError(
                'unknown',
                'An unknown error occurred while requesting microphone access.',
                error,
            );
    }
}