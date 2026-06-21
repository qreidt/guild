import {defineConfig} from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';

// Inlined from @tresjs/core's `templateCompilerOptions` so vite.config does NOT
// import @tresjs/core — keeping the build decoupled from the 3D deps (the 2D
// path must build even with three / @tresjs/core uninstalled). This marks the
// Three.js-mapped `<Tres*>` tags as custom elements so Vue's compiler hands them
// to TresJS's custom renderer instead of trying to resolve them as components.
// The whitelist are the real Vue components TresJS ships (not custom elements).
const tresWhitelist = ['TresCanvas', 'TresCanvasContext', 'TresLeches', 'TresScene'];
const isTresCustomElement = (tag: string): boolean =>
    ((/^Tres[A-Z]/.test(tag) || tag.startsWith('tres-')) && !tresWhitelist.includes(tag)) || tag === 'primitive';

export default defineConfig({
    base: '/guild/',
    server: {
        // Honour the preview harness's assigned port (autoPort) via PORT env;
        // falls back to Vite's default for a plain `npm run dev`.
        port: Number(process.env.PORT) || 5173,
    },
    plugins: [
        vue({
            template: {
                compilerOptions: {
                    isCustomElement: isTresCustomElement,
                },
            },
        }),
        tailwindcss(),
    ],
});
