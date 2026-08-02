# JamIT Audio Recorder

Reliable browser audio recording for Vue, Nuxt, React and TypeScript, powered by one shared framework-independent core.

## Status

This project is currently under active development.

JamIT Audio Recorder is a complete new implementation and does not reuse or migrate the codebase of the previous npm package.

## Planned support

- TypeScript
- Vanilla JavaScript
- Vue 3
- Nuxt 3 and Nuxt 4
- React

## Architecture

The recording functionality is implemented once in a framework-independent TypeScript core.

Vue, Nuxt and React use thin framework adapters built on top of the shared core.