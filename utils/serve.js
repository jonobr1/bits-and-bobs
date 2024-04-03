const es = require('esbuild');

es.context({
  entryPoints: ['src/index.js'],
  outdir: 'public',
  bundle: true,
  loader: { '.js': 'jsx' },
  external: ['./images/*', './fonts/*'],
  sourcemap: true
}).then((ctx) => {

  ctx.serve({
    port: 8080,
    servedir: 'public'
  });

});