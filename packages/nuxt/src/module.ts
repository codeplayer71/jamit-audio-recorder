import type { NuxtModule } from '@nuxt/schema';
import {
    addImports,
    createResolver,
    defineNuxtModule,
} from '@nuxt/kit';

export interface ModuleOptions {}

const audioRecorderModule: NuxtModule<ModuleOptions> =
    defineNuxtModule<ModuleOptions>({
        meta: {
            name: '@jamit/audio-recorder-nuxt',
            configKey: 'audioRecorder',
        },

        defaults: {},

        setup() {
            const resolver = createResolver(import.meta.url);

            addImports({
                name: 'useAudioRecorder',
                from: resolver.resolve(
                    './runtime/app/composables/useAudioRecorder',
                ),
            });
        },
    });

export default audioRecorderModule;