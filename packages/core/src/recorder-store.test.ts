import { describe, expect, it, vi } from 'vitest';

import { createRecorderStore } from './recorder-store';

describe('createRecorderStore', () => {
    it('starts with the initial snapshot', () => {
        const store = createRecorderStore();

        expect(store.getSnapshot()).toEqual({
            state: 'idle',
            durationMs: 0,
            recording: null,
            error: null,
        });
    });

    it('returns an immutable snapshot', () => {
        const store = createRecorderStore();

        expect(Object.isFrozen(store.getSnapshot())).toBe(true);
    });

    it('transitions to an allowed state', () => {
        const store = createRecorderStore();

        const snapshot = store.transition(
            'requesting-permission',
        );

        expect(snapshot.state).toBe('requesting-permission');
        expect(store.getSnapshot()).toBe(snapshot);
    });

    it('rejects an invalid state transition', () => {
        const store = createRecorderStore();

        expect(() => store.transition('paused')).toThrow(
            'Invalid recorder state transition: idle -> paused.',
        );
    });

    it('updates snapshot values without changing the state', () => {
        const store = createRecorderStore();

        const snapshot = store.update({
            durationMs: 1_500,
        });

        expect(snapshot).toEqual({
            state: 'idle',
            durationMs: 1_500,
            recording: null,
            error: null,
        });
    });

    it('notifies subscribers when the snapshot changes', () => {
        const store = createRecorderStore();
        const subscriber = vi.fn();

        store.subscribe(subscriber);
        store.transition('requesting-permission');

        expect(subscriber).toHaveBeenCalledTimes(1);
        expect(subscriber).toHaveBeenCalledWith(
            store.getSnapshot(),
        );
    });

    it('stops notifying an unsubscribed subscriber', () => {
        const store = createRecorderStore();
        const subscriber = vi.fn();

        const unsubscribe = store.subscribe(subscriber);

        unsubscribe();
        store.transition('requesting-permission');

        expect(subscriber).not.toHaveBeenCalled();
    });

    it('clears subscriptions when destroyed', () => {
        const store = createRecorderStore();
        const subscriber = vi.fn();

        store.subscribe(subscriber);
        store.destroy();

        expect(() =>
            store.transition('requesting-permission'),
        ).toThrow('Recorder store has been destroyed.');

        expect(subscriber).not.toHaveBeenCalled();
    });

    it('can be destroyed multiple times safely', () => {
        const store = createRecorderStore();

        expect(() => {
            store.destroy();
            store.destroy();
        }).not.toThrow();
    });
});