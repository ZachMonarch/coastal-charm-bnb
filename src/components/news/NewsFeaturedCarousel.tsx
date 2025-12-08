import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Article {
  id: string;
  title: string;
  description: string;
  url: string;
  imageUrl: string;
  publishedAt: string;
  source: string;
  author: string;
}

interface NewsFeaturedCarouselProps {
  articles: Article[];
}

export function NewsFeaturedCarousel({ articles }: NewsFeaturedCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const featuredArticles = articles.slice(0, 5);

  useEffect(() => {
    if (featuredArticles.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredArticles.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [featuredArticles.length]);

  if (featuredArticles.length === 0) return null;

  const currentArticle = featuredArticles[currentIndex];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => 
      prev === 0 ? featuredArticles.length - 1 : prev - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % featuredArticles.length);
  };

  return (
    <div className="relative rounded-2xl overflow-hidden bg-card border shadow-lg group">
      <div className="grid lg:grid-cols-2 min-h-[400px]">
        {/* Image side */}
        <div className="relative h-64 lg:h-full overflow-hidden">
          {currentArticle.imageUrl ? (
            <img
              src={currentArticle.imageUrl}
              alt={currentArticle.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <span className="text-6xl">📰</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent lg:bg-gradient-to-r" />
          
          {/* Navigation arrows */}
          {featuredArticles.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm"
                onClick={goToPrevious}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm"
                onClick={goToNext}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}
        </div>

        {/* Content side */}
        <div className="p-8 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-4">
            <Badge variant="default" className="bg-primary text-primary-foreground">
              Featured
            </Badge>
            <Badge variant="outline">{currentArticle.source}</Badge>
          </div>

          <h2 className="text-2xl lg:text-3xl font-bold mb-4 line-clamp-3 hover:text-primary transition-colors">
            <a href={currentArticle.url} target="_blank" rel="noopener noreferrer">
              {currentArticle.title}
            </a>
          </h2>

          <p className="text-muted-foreground mb-6 line-clamp-3">
            {currentArticle.description}
          </p>

          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {formatDate(currentArticle.publishedAt)}
            </div>
            {currentArticle.author && (
              <span>by {currentArticle.author}</span>
            )}
          </div>

          <Button asChild className="w-fit">
            <a href={currentArticle.url} target="_blank" rel="noopener noreferrer">
              Read Full Article
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>

          {/* Dots indicator */}
          {featuredArticles.length > 1 && (
            <div className="flex gap-2 mt-8">
              {featuredArticles.map((_, index) => (
                <button
                  key={index}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-300",
                    index === currentIndex 
                      ? "bg-primary w-8" 
                      : "bg-muted hover:bg-muted-foreground/50"
                  )}
                  onClick={() => setCurrentIndex(index)}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
