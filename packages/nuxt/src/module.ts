import type { NuxtModule } from '@nuxt/schema';
import {
    addComponent,
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

        setup(_options, nuxt) {
            const resolver = createResolver(import.meta.url);

            addImports({
                name: 'useAudioRecorder',
                from: resolver.resolve(
                    './runtime/app/composables/useAudioRecorder',
                ),
            });

            addComponent({
                name: 'JamItAudioRecorder',
                export: 'JamItAudioRecorder',
                filePath: '@jamit/audio-recorder-vue',
            });

            nuxt.options.css.push('@jamit/audio-recorder-vue/style.css');
        },
    });

export default audioRecorderModule;