import { describe, expect, it } from 'vitest';

import { canTransitionRecorderState } from './index';

describe('canTransitionRecorderState', () => {
    it('allows starting from idle', () => {
        expect(
            canTransitionRecorderState(
                'idle',
                'requesting-permission',
            ),
        ).toBe(true);
    });

    it('allows recording after permission was granted', () => {
        expect(
            canTransitionRecorderState(
                'requesting-permission',
                'recording',
            ),
        ).toBe(true);
    });

    it('allows pausing and resuming', () => {
        expect(
            canTransitionRecorderState(
                'recording',
                'paused',
            ),
        ).toBe(true);

        expect(
            canTransitionRecorderState(
                'paused',
                'recording',
            ),
        ).toBe(true);
    });

    it('allows processing after recording or pausing', () => {
        expect(
            canTransitionRecorderState(
                'recording',
                'processing',
            ),
        ).toBe(true);

        expect(
            canTransitionRecorderState(
                'paused',
                'processing',
            ),
        ).toBe(true);
    });

    it('allows completing after processing', () => {
        expect(
            canTransitionRecorderState(
                'processing',
                'completed',
            ),
        ).toBe(true);
    });

    it('allows resetting completed and error states', () => {
        expect(
            canTransitionRecorderState(
                'completed',
                'idle',
            ),
        ).toBe(true);

        expect(
            canTransitionRecorderState(
                'error',
                'idle',
            ),
        ).toBe(true);
    });

    it('rejects invalid transitions', () => {
        expect(
            canTransitionRecorderState(
                'idle',
                'paused',
            ),
        ).toBe(false);

        expect(
            canTransitionRecorderState(
                'completed',
                'recording',
            ),
        ).toBe(false);

        expect(
            canTransitionRecorderState(
                'processing',
                'paused',
            ),
        ).toBe(false);
    });

    it('rejects transitions to the same state', () => {
        expect(
            canTransitionRecorderState(
                'recording',
                'recording',
            ),
        ).toBe(false);

        expect(
            canTransitionRecorderState(
                'idle',
                'idle',
            ),
        ).toBe(false);
    });
});