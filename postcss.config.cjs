// PostCSS configuration for Vite + Tailwind CSS
// Using explicit plugin initialization to resolve "from option" warnings
module.exports = {
  plugins: [
    require('postcss-import'),
    require('tailwindcss/nesting'),
    require('tailwindcss'),
    require('autoprefixer'),
  ],
}
