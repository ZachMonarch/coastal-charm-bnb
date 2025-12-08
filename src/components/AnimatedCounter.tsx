import { useEffect, useRef, useState } from "react";
import { useInView } from "react-intersection-observer";
import { cn } from "@/lib/utils";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  separator?: string;
  className?: string;
}

// Easing function: easeOutExpo
const easeOutExpo = (t: number): number => {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
};

export default function AnimatedCounter({
  value,
  duration = 2000,
  prefix = "",
  suffix = "",
  decimals = 0,
  separator = ",",
  className,
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const { ref, inView } = useInView({
    threshold: 0.3,
    triggerOnce: true,
  });

  // Check for reduced motion preference
  const prefersReducedMotion = 
    typeof window !== "undefined" && 
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (inView && !hasAnimated) {
      if (prefersReducedMotion) {
        setDisplayValue(value);
        setHasAnimated(true);
        return;
      }

      const animate = (timestamp: number) => {
        if (!startTimeRef.current) {
          startTimeRef.current = timestamp;
        }

        const elapsed = timestamp - startTimeRef.current;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeOutExpo(progress);
        
        setDisplayValue(easedProgress * value);

        if (progress < 1) {
          rafRef.current = requestAnimationFrame(animate);
        } else {
          setDisplayValue(value);
          setHasAnimated(true);
        }
      };

      rafRef.current = requestAnimationFrame(animate);

      return () => {
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
        }
      };
    }
  }, [inView, value, duration, hasAnimated, prefersReducedMotion]);

  // Format the number with separators and decimals
  const formatNumber = (num: number): string => {
    const fixed = num.toFixed(decimals);
    const [intPart, decPart] = fixed.split(".");
    
    // Add thousand separators
    const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
    
    return decPart ? `${formattedInt}.${decPart}` : formattedInt;
  };

  return (
    <span
      ref={ref}
      className={cn(
        "tabular-nums transition-opacity duration-300",
        inView ? "opacity-100" : "opacity-0",
        className
      )}
    >
      {prefix}
      {formatNumber(displayValue)}
      {suffix}
    </span>
  );
}