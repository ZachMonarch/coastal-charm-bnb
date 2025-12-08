/**
 * Utilities to prevent forced reflows and layout thrashing
 * Use these functions when you need to read/write DOM properties
 */

// Batch DOM reads to prevent forced reflows
export function batchDOMReads<T>(reads: (() => T)[]): T[] {
  return reads.map(read => read());
}

// Batch DOM writes to prevent forced reflows
export function batchDOMWrites(writes: (() => void)[]): void {
  requestAnimationFrame(() => {
    writes.forEach(write => write());
  });
}

// Read/Write cycle optimization
export function optimizedReadWrite(
  reads: (() => any)[],
  writes: ((readResults: any[]) => void)[]
): void {
  // Phase 1: Batch all reads
  const readResults = batchDOMReads(reads);
  
  // Phase 2: Batch all writes in next frame
  requestAnimationFrame(() => {
    writes.forEach((write, index) => {
      write(readResults);
    });
  });
}

// Debounced scroll handler to prevent excessive reflows
export function createOptimizedScrollHandler(
  callback: (scrollTop: number) => void,
  delay: number = 16 // ~60fps
): EventListener {
  let ticking = false;
  let lastScrollTop = 0;

  return () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        if (scrollTop !== lastScrollTop) {
          callback(scrollTop);
          lastScrollTop = scrollTop;
        }
        ticking = false;
      });
      ticking = true;
    }
  };
}

// Cache computed styles to prevent repeated reflows
const styleCache = new WeakMap<Element, CSSStyleDeclaration>();

export function getCachedComputedStyle(element: Element): CSSStyleDeclaration {
  if (!styleCache.has(element)) {
    styleCache.set(element, window.getComputedStyle(element));
  }
  return styleCache.get(element)!;
}

// Clear style cache when needed (e.g., after layout changes)
export function clearStyleCache(): void {
  // WeakMap doesn't have a clear method, but garbage collection handles cleanup automatically
  // To force a clear, create a new WeakMap instance
  Object.defineProperty(globalThis, 'styleCache', {
    value: new WeakMap<Element, CSSStyleDeclaration>(),
    writable: true
  });
}

// Optimized element measurement
export function measureElement(element: Element): {
  width: number;
  height: number;
  top: number;
  left: number;
} {
  // Use getBoundingClientRect only once per batch
  const rect = element.getBoundingClientRect();
  return {
    width: rect.width,
    height: rect.height,
    top: rect.top,
    left: rect.left
  };
}

// Batch element measurements
export function batchMeasureElements(elements: Element[]): ReturnType<typeof measureElement>[] {
  return elements.map(element => measureElement(element));
}
