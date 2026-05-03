// Bundles src/extension.ts into a single dist/extension.js for the .vsix.
// `vscode` is externalized — it's provided at runtime by the host.
//
// Usage:
//   node esbuild.js          # one-shot production build (minified)
//   node esbuild.js --watch  # rebuild on change, sourcemaps inline

const esbuild = require('esbuild');

const watch = process.argv.includes('--watch');

const buildOptions = {
  entryPoints: ['src/extension.ts'],
  bundle: true,
  format: 'cjs',
  platform: 'node',
  target: 'node18',
  external: ['vscode'],
  outfile: 'dist/extension.js',
  sourcemap: watch ? 'inline' : false,
  minify: !watch,
  logLevel: 'info',
};

(async () => {
  if (watch) {
    const ctx = await esbuild.context(buildOptions);
    await ctx.watch();
    console.log('[esbuild] watching for changes...');
  } else {
    await esbuild.build(buildOptions);
  }
})();
