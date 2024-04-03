const path = require('path');
const es = require('esbuild');

es.buildSync({
  entryPoints: [
    path.resolve(__dirname, '../src/index.js')
  ],
  bundle: true,
  loader: { '.js': 'jsx' },
  outfile: path.resolve(__dirname, '../public/index.js')
});