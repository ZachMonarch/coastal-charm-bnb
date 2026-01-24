const path = require('path');

module.exports = {
  plugins: {
    // Configure postcss-import to properly pass the 'from' option
    'postcss-import': {
      // Root path for resolving imports
      root: process.cwd(),
      // Ensure 'from' option is passed to prevent parsing warnings
      resolve: (id, basedir, importOptions) => {
        return path.resolve(basedir, id);
      },
    },
    'tailwindcss/nesting': {},
    tailwindcss: {},
    autoprefixer: {},
  },
}
