import { describe, expect, it, vi } from 'vitest';

import { selectSupportedMimeType } from './index';

describe('selectSupportedMimeType', () => {
    it('returns the first supported MIME type', () => {
        const isTypeSupported = vi.fn((mimeType: string) => {
            return mimeType === 'audio/mp4';
        });

        const result = selectSupportedMimeType(
            [
                'audio/webm;codecs=opus',
                'audio/mp4',
                'audio/webm',
            ],
            isTypeSupported,
        );

        expect(result).toBe('audio/mp4');
        expect(isTypeSupported).toHaveBeenCalledTimes(2);
    });

    it('returns the first MIME type when it is supported', () => {
        const isTypeSupported = vi.fn(() => true);

        const result = selectSupportedMimeType(
            [
                'audio/webm;codecs=opus',
                'audio/mp4',
            ],
            isTypeSupported,
        );

        expect(result).toBe('audio/webm;codecs=opus');
        expect(isTypeSupported).toHaveBeenCalledTimes(1);
    });

    it('returns null when no MIME type is supported', () => {
        const isTypeSupported = vi.fn(() => false);

        const result = selectSupportedMimeType(
            [
                'audio/webm;codecs=opus',
                'audio/mp4',
            ],
            isTypeSupported,
        );

        expect(result).toBeNull();
        expect(isTypeSupported).toHaveBeenCalledTimes(2);
    });

    it('returns null for an empty list', () => {
        const isTypeSupported = vi.fn(() => true);

        const result = selectSupportedMimeType([], isTypeSupported);

        expect(result).toBeNull();
        expect(isTypeSupported).not.toHaveBeenCalled();
    });
});