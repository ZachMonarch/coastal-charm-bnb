import '@testing-library/jest-dom'
import * as matchers from '@testing-library/jest-dom/matchers'
import { expect } from 'vitest'

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers)

// Optional: provide a global fetch implementation in non-browser environments
if (typeof globalThis.fetch === 'undefined') {
  // Node 18+ includes fetch; this is a fallback for older Node versions.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  globalThis.fetch = require('node-fetch') as any
}
