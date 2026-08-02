import { describe, expect, it } from 'vitest';

import { getFileExtensionFromMimeType } from './index';

describe('getFileExtensionFromMimeType', () => {
    it.each([
        ['audio/webm', 'webm'],
        ['audio/ogg', 'ogg'],
        ['audio/mp4', 'm4a'],
        ['audio/mpeg', 'mp3'],
        ['audio/wav', 'wav'],
        ['audio/x-wav', 'wav'],
        ['audio/aac', 'aac'],
        ['audio/flac', 'flac'],
    ])(
        'returns "%s" as the expected extension',
        (mimeType, expectedExtension) => {
            expect(
                getFileExtensionFromMimeType(mimeType),
            ).toBe(expectedExtension);
        },
    );

    it('ignores codec parameters', () => {
        expect(
            getFileExtensionFromMimeType(
                'audio/webm;codecs=opus',
            ),
        ).toBe('webm');

        expect(
            getFileExtensionFromMimeType(
                'audio/ogg; codecs=opus',
            ),
        ).toBe('ogg');
    });

    it('normalizes whitespace and casing', () => {
        expect(
            getFileExtensionFromMimeType(' AUDIO/MP4 '),
        ).toBe('m4a');
    });

    it('returns a generic extension for an unknown MIME type', () => {
        expect(
            getFileExtensionFromMimeType(
                'audio/custom-format',
            ),
        ).toBe('audio');
    });

    it('returns a generic extension for an empty value', () => {
        expect(getFileExtensionFromMimeType('')).toBe('audio');
        expect(getFileExtensionFromMimeType('   ')).toBe('audio');
    });
});