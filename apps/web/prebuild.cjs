const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const CACHE_DIR = 'c:/Users/wuwei/.trae-cn/work/6a51fe29550b5e2e29e1c04b/.vite-cache/deps';

fs.rmSync(path.dirname(CACHE_DIR), { recursive: true, force: true });
fs.mkdirSync(CACHE_DIR, { recursive: true });

const deps = [
  ['react', 'react'],
  ['react_jsx-runtime', 'react/jsx-runtime'],
  ['react_jsx-dev-runtime', 'react/jsx-dev-runtime'],
  ['react-dom', 'react-dom'],
  ['react-dom_client', 'react-dom/client'],
];

async function main() {
  for (const [name, entry] of deps) {
    console.log('Bundling ' + name + '...');
    const resolved = require.resolve(entry);
    const result = await esbuild.build({
      entryPoints: [resolved],
      bundle: true,
      format: 'esm',
      platform: 'browser',
      target: 'esnext',
      write: false,
    });
    // Result has one output file per entry point
    for (let i = 0; i < result.outputFiles.length; i++) {
      const out = result.outputFiles[i];
      let outPath = path.join(CACHE_DIR, name + path.extname(out.path) || '.js');
      if (path.extname(outPath) === '') outPath = path.join(CACHE_DIR, name + '.js');
      fs.writeFileSync(outPath, out.contents);
      console.log('  wrote: ' + path.basename(outPath) + ' (' + out.contents.length + ' bytes)');
    }
  }
  const meta = { optimized: {} };
  for (const [name] of deps) {
    const fp = path.join(CACHE_DIR, name + '.js');
    if (fs.existsSync(fp)) {
      meta.optimized[name] = {
        src: name + '.js',
        file: fp,
        fileHash: Date.now().toString(36),
        needsInterop: false,
      };
    }
  }
  fs.writeFileSync(path.join(CACHE_DIR, '_metadata.json'), JSON.stringify(meta, null, 2));
  console.log('DONE');
}
main().catch(e => { console.error(e); process.exit(1); });
