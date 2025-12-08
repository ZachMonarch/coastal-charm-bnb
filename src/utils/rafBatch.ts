/**
 * RAF Batching Utility
 * 
 * Prevents forced reflows by batching DOM reads/writes into requestAnimationFrame.
 * Use this for scroll handlers, resize handlers, or any frequent layout operations.
 * 
 * Performance Impact: Eliminates forced reflow warnings in Lighthouse
 * 
 * @example
 * ```ts
 * useEffect(() => {
 *   const onScroll = () => {
 *     rafBatch(() => {
 *       const y = window.scrollY; // READ
 *       setShadow(y > 0); // WRITE
 *     });
 *   };
 *   window.addEventListener('scroll', onScroll, { passive: true });
 *   return () => window.removeEventListener('scroll', onScroll);
 * }, []);
 * ```
 */

let ticking = false;
const queue: Array<() => void> = [];

const runQueue = () => {
  ticking = false;
  const tasks = queue.splice(0, queue.length);
  for (const task of tasks) {
    task();
  }
};

export const rafBatch = (fn: () => void) => {
  queue.push(fn);
  if (!ticking) {
    ticking = true;
    requestAnimationFrame(runQueue);
  }
};
