// CSS module declarations for side-effect imports.
// vite/client.d.ts normally provides these, but pnpm reparse points
// prevent TypeScript from resolving the `vite/client` types reference.
declare module '*.css'
declare module '*.scss'
declare module '*.pcss'
