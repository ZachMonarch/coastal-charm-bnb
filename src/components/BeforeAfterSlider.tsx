import { useState, useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  initialPosition?: number;
  className?: string;
}

export default function BeforeAfterSlider({
  beforeImage,
  afterImage,
  beforeLabel = "Before",
  afterLabel = "After",
  initialPosition = 50,
  className,
}: BeforeAfterSliderProps) {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const rectRef = useRef<DOMRect | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Animate slider on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Cache-based position update to prevent forced reflows
  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    
    // Use cached rect during drag to prevent layout thrashing
    if (!rectRef.current) {
      rectRef.current = containerRef.current.getBoundingClientRect();
    }
    
    const x = clientX - rectRef.current.left;
    const percentage = Math.max(0, Math.min(100, (x / rectRef.current.width) * 100));
    setPosition(percentage);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    // Clear cached rect on drag start to get fresh measurements
    rectRef.current = null;
    setIsDragging(true);
    updatePosition(e.clientX);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      updatePosition(e.clientX);
    }
  }, [isDragging, updatePosition]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    // Clear cached rect on drag end
    rectRef.current = null;
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    // Clear cached rect on touch start
    rectRef.current = null;
    setIsDragging(true);
    updatePosition(e.touches[0].clientX);
  };

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (isDragging) {
      updatePosition(e.touches[0].clientX);
    }
  }, [isDragging, updatePosition]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const step = 5;
    if (e.key === "ArrowLeft") {
      setPosition((prev) => Math.max(0, prev - step));
    } else if (e.key === "ArrowRight") {
      setPosition((prev) => Math.min(100, prev + step));
    }
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleTouchMove);
      window.addEventListener("touchend", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full aspect-[4/3] overflow-hidden rounded-xl select-none cursor-ew-resize",
        className
      )}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="slider"
      aria-label="Before and after image comparison"
      aria-valuenow={Math.round(position)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {/* After Image (Background) */}
      <div className="absolute inset-0">
        <img
          src={afterImage}
          alt={afterLabel}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <span className="absolute bottom-4 right-4 px-3 py-1.5 bg-background/80 backdrop-blur-sm rounded-full text-sm font-medium text-foreground">
          {afterLabel}
        </span>
      </div>

      {/* Before Image (Clipped) */}
      <div
        className="absolute inset-0 overflow-hidden transition-[clip-path] duration-75"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <img
          src={beforeImage}
          alt={beforeLabel}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <span className="absolute bottom-4 left-4 px-3 py-1.5 bg-background/80 backdrop-blur-sm rounded-full text-sm font-medium text-foreground">
          {beforeLabel}
        </span>
      </div>

      {/* Slider Handle */}
      <div
        className={cn(
          "absolute top-0 bottom-0 w-1 bg-primary transition-all",
          isDragging ? "shadow-[0_0_20px_hsl(var(--primary)/0.5)]" : "",
          isLoaded ? "opacity-100" : "opacity-0"
        )}
        style={{ left: `${position}%`, transform: "translateX(-50%)" }}
      >
        {/* Handle Circle */}
        <div
          className={cn(
            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
            "w-10 h-10 rounded-full bg-primary border-4 border-background shadow-lg",
            "flex items-center justify-center",
            isDragging ? "scale-110" : "scale-100",
            "transition-transform duration-150"
          )}
        >
          <div className="flex items-center gap-0.5">
            <svg className="w-3 h-3 text-primary-foreground" fill="currentColor" viewBox="0 0 24 24">
              <path d="M15 19l-7-7 7-7" />
            </svg>
            <svg className="w-3 h-3 text-primary-foreground" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}