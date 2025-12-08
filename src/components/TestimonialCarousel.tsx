import { useEffect, useState, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface Testimonial {
  id: string | number;
  name: string;
  role?: string;
  location?: string;
  avatar?: string;
  content: string;
  rating: number;
}

interface TestimonialCarouselProps {
  testimonials: Testimonial[];
  autoScrollInterval?: number;
  className?: string;
}

export default function TestimonialCarousel({
  testimonials,
  autoScrollInterval = 5000,
  className,
}: TestimonialCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
    skipSnaps: false,
  });

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  // Auto-scroll
  useEffect(() => {
    if (!emblaApi || isPaused) return;

    const interval = setInterval(() => {
      emblaApi.scrollNext();
    }, autoScrollInterval);

    return () => clearInterval(interval);
  }, [emblaApi, autoScrollInterval, isPaused]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div
      className={cn("relative", className)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Carousel Container */}
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.id}
              className="flex-none w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] min-w-0"
            >
              <div className="glass-card p-6 rounded-2xl h-full flex flex-col">
                {/* Quote Icon */}
                <Quote className="w-8 h-8 text-primary/30 mb-4" />

                {/* Content */}
                <blockquote className="text-muted-foreground leading-relaxed flex-1 mb-6">
                  "{testimonial.content}"
                </blockquote>

                {/* Rating */}
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "w-4 h-4 transition-all duration-300",
                        i < testimonial.rating
                          ? "fill-primary text-primary"
                          : "text-muted-foreground/30"
                      )}
                      style={{
                        animationDelay: `${i * 100}ms`,
                      }}
                    />
                  ))}
                </div>

                {/* Author */}
                <div className="flex items-center gap-3 pt-4 border-t border-border">
                  <Avatar className="h-10 w-10 border-2 border-primary/20">
                    <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                      {getInitials(testimonial.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-foreground text-sm">
                      {testimonial.name}
                    </p>
                    {testimonial.role && (
                      <p className="text-xs text-muted-foreground">
                        {testimonial.role}
                        {testimonial.location && ` • ${testimonial.location}`}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-center gap-4 mt-8">
        <Button
          variant="outline"
          size="icon"
          onClick={scrollPrev}
          className="rounded-full"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="sr-only">Previous</span>
        </Button>

        {/* Dots */}
        <div className="flex items-center gap-2">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => emblaApi?.scrollTo(index)}
              className={cn(
                "transition-all duration-300 rounded-full",
                selectedIndex === index
                  ? "w-8 h-2 bg-primary"
                  : "w-2 h-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={scrollNext}
          className="rounded-full"
        >
          <ChevronRight className="w-4 h-4" />
          <span className="sr-only">Next</span>
        </Button>
      </div>
    </div>
  );
}