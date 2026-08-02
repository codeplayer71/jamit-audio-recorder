import { describe, expect, it, vi } from 'vitest';

import {
    detectAudioRecorderBrowserSupport,
    getDefaultBrowserEnvironment,
} from './index';

describe('detectAudioRecorderBrowserSupport', () => {
    it('reports a fully supported browser environment', () => {
        const getUserMedia = vi.fn();

        const support = detectAudioRecorderBrowserSupport({
            navigator: {
                mediaDevices: {
                    getUserMedia,
                } as unknown as MediaDevices,
            },
            MediaRecorder: class {} as unknown as typeof MediaRecorder,
        });

        expect(support).toEqual({
            isBrowser: true,
            hasMediaDevices: true,
            hasGetUserMedia: true,
            hasMediaRecorder: true,
            isSupported: true,
        });
    });

    it('reports an unsupported non-browser environment', () => {
        const support =
            detectAudioRecorderBrowserSupport({});

        expect(support).toEqual({
            isBrowser: false,
            hasMediaDevices: false,
            hasGetUserMedia: false,
            hasMediaRecorder: false,
            isSupported: false,
        });
    });

    it('detects missing media devices', () => {
        const support = detectAudioRecorderBrowserSupport({
            navigator: {} as Pick<Navigator, 'mediaDevices'>,
            MediaRecorder: class {} as unknown as typeof MediaRecorder,
        });

        expect(support.hasMediaDevices).toBe(false);
        expect(support.hasGetUserMedia).toBe(false);
        expect(support.hasMediaRecorder).toBe(true);
        expect(support.isSupported).toBe(false);
    });

    it('detects a missing MediaRecorder constructor', () => {
        const support = detectAudioRecorderBrowserSupport({
            navigator: {
                mediaDevices: {
                    getUserMedia: vi.fn(),
                } as unknown as MediaDevices,
            },
        });

        expect(support.hasMediaDevices).toBe(true);
        expect(support.hasGetUserMedia).toBe(true);
        expect(support.hasMediaRecorder).toBe(false);
        expect(support.isSupported).toBe(false);
    });

    it('returns an immutable support result', () => {
        const support =
            detectAudioRecorderBrowserSupport({});

        expect(Object.isFrozen(support)).toBe(true);
    });
});

describe('getDefaultBrowserEnvironment', () => {
    it('can be called safely in the current environment', () => {
        expect(() =>
            getDefaultBrowserEnvironment(),
        ).not.toThrow();
    });
});