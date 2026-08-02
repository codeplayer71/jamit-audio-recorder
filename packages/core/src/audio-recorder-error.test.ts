import { describe, expect, it } from 'vitest';

import {
    createAudioRecorderError,
    mapMediaAccessError,
} from './index';

describe('createAudioRecorderError', () => {
    it('creates an error without an original error', () => {
        expect(
            createAudioRecorderError(
                'invalid-state',
                'The action is not allowed.',
            ),
        ).toEqual({
            code: 'invalid-state',
            message: 'The action is not allowed.',
        });
    });

    it('includes the original error when provided', () => {
        const originalError = new Error('Original error');

        expect(
            createAudioRecorderError(
                'recording-failed',
                'Recording failed.',
                originalError,
            ),
        ).toEqual({
            code: 'recording-failed',
            message: 'Recording failed.',
            originalError,
        });
    });
});

describe('mapMediaAccessError', () => {
    it('maps denied microphone permission', () => {
        const error = new DOMException(
            'Permission denied',
            'NotAllowedError',
        );

        expect(mapMediaAccessError(error)).toMatchObject({
            code: 'permission-denied',
            message: 'Microphone permission was denied.',
            originalError: error,
        });
    });

    it('maps a dismissed permission request', () => {
        const error = new DOMException(
            'Request aborted',
            'AbortError',
        );

        expect(mapMediaAccessError(error)).toMatchObject({
            code: 'permission-dismissed',
            originalError: error,
        });
    });

    it('maps a missing audio device', () => {
        const error = new DOMException(
            'Device not found',
            'NotFoundError',
        );

        expect(mapMediaAccessError(error)).toMatchObject({
            code: 'device-not-found',
            originalError: error,
        });
    });

    it('maps an unavailable audio device', () => {
        const error = new DOMException(
            'Device unavailable',
            'NotReadableError',
        );

        expect(mapMediaAccessError(error)).toMatchObject({
            code: 'device-in-use',
            originalError: error,
        });
    });

    it('maps unknown DOM exceptions', () => {
        const error = new DOMException(
            'Unknown browser error',
            'UnknownError',
        );

        expect(mapMediaAccessError(error)).toMatchObject({
            code: 'unknown',
            originalError: error,
        });
    });

    it('maps non-DOM errors', () => {
        const error = new Error('Unexpected error');

        expect(mapMediaAccessError(error)).toMatchObject({
            code: 'unknown',
            originalError: error,
        });
    });
});