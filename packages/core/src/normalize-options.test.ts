import { describe, expect, it } from 'vitest';

import {
    DEFAULT_PREFERRED_MIME_TYPES,
    normalizeAudioRecorderOptions,
} from './index';

describe('normalizeAudioRecorderOptions', () => {
    it('returns the default options', () => {
        const options = normalizeAudioRecorderOptions();

        expect(options).toEqual({
            preferredMimeTypes: [...DEFAULT_PREFERRED_MIME_TYPES],
            audioConstraints: {},
            maxDurationMs: null,
            maxFileSizeBytes: null,
            fileName: 'audio-recording',
        });
    });

    it('returns normalized custom options', () => {
        const options = normalizeAudioRecorderOptions({
            preferredMimeTypes: ['audio/mp4'],
            audioConstraints: {
                channelCount: 1,
                echoCancellation: true,
            },
            maxDurationMs: 120_000,
            maxFileSizeBytes: 10_000_000,
            fileName: 'voice-message',
        });

        expect(options).toEqual({
            preferredMimeTypes: ['audio/mp4'],
            audioConstraints: {
                channelCount: 1,
                echoCancellation: true,
            },
            maxDurationMs: 120_000,
            maxFileSizeBytes: 10_000_000,
            fileName: 'voice-message',
        });
    });

    it('uses the default file name when the provided value is empty', () => {
        const options = normalizeAudioRecorderOptions({
            fileName: '   ',
        });

        expect(options.fileName).toBe('audio-recording');
    });

    it('throws when maxDurationMs is not greater than 0', () => {
        expect(() =>
            normalizeAudioRecorderOptions({
                maxDurationMs: 0,
            }),
        ).toThrow('maxDurationMs must be greater than 0.');
    });

    it('throws when maxFileSizeBytes is not greater than 0', () => {
        expect(() =>
            normalizeAudioRecorderOptions({
                maxFileSizeBytes: -1,
            }),
        ).toThrow('maxFileSizeBytes must be greater than 0.');
    });

    it('throws when preferredMimeTypes is empty', () => {
        expect(() =>
            normalizeAudioRecorderOptions({
                preferredMimeTypes: [],
            }),
        ).toThrow('preferredMimeTypes must not be empty.');
    });

    it('creates independent arrays and objects', () => {
        const preferredMimeTypes = ['audio/mp4'];
        const audioConstraints: MediaTrackConstraints = {
            channelCount: 1,
        };

        const options = normalizeAudioRecorderOptions({
            preferredMimeTypes,
            audioConstraints,
        });

        expect(options.preferredMimeTypes).not.toBe(preferredMimeTypes);
        expect(options.audioConstraints).not.toBe(audioConstraints);
    });
});