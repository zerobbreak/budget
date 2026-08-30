import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { nitro } from 'nitro/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    tailwindcss(),
    tanstackStart(),
    nitro({
      // Workaround for Vite 8.2/Rolldown emitting undeclared ssr_exports in SSR chunks.
      // https://github.com/TanStack/router/issues/8031
      inlineDynamicImports: true,
    }),
    viteReact(),
  ],
})

export default config
