/**
 * PostCSS Configuration for Monarch Property Management
 * 
 * This configuration resolves two critical build issues:
 * 1. "from option" warning: Ensures PostCSS parser receives file path context
 * 2. "Unexpected button" CSS syntax errors: Uses compatible plugin versions
 * 
 * @see https://github.com/postcss/postcss/blob/main/docs/guidelines/runner.md
 */

const postcssImport = require('postcss-import');
const tailwindcssNesting = require('tailwindcss/nesting');
const tailwindcss = require('tailwindcss');
const autoprefixer = require('autoprefixer');

module.exports = {
  plugins: [
    // postcss-import must be first to resolve @import statements
    postcssImport({
      // Explicitly provide path context to prevent "from option" warnings
      root: process.cwd(),
    }),
    // Tailwind's nesting plugin for CSS nesting support
    tailwindcssNesting,
    // Main Tailwind CSS processor
    tailwindcss,
    // Autoprefixer for cross-browser compatibility
    autoprefixer({
      // Prevent warnings about grid layout
      grid: 'autoplace',
    }),
  ],
};
