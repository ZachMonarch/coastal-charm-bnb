const path = require('path');

module.exports = {
  plugins: {
    'postcss-import': {
      // Ensure 'from' option is passed to prevent parsing warnings
      resolve: (id, basedir) => path.resolve(basedir, id),
    },
    'tailwindcss/nesting': {},
    tailwindcss: {},
    autoprefixer: {},
  },
}
