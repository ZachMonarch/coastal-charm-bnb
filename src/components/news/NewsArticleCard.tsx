import { ExternalLink, Clock, Bookmark, BookmarkCheck, Share2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useNewsBookmarks } from "@/hooks/useNewsBookmarks";
import { useNewsAnalytics } from "@/hooks/useNewsAnalytics";
import { toast } from "sonner";

interface Article {
  id: string;
  title: string;
  description: string;
  url: string;
  imageUrl: string;
  publishedAt: string;
  source: string;
  author: string;
  category?: string;
}

interface NewsArticleCardProps {
  article: Article;
  viewMode: 'grid' | 'list';
}

export function NewsArticleCard({ article, viewMode }: NewsArticleCardProps) {
  const { isBookmarked, toggleBookmark } = useNewsBookmarks();
  const { trackClick, trackShare } = useNewsAnalytics();
  const bookmarked = isBookmarked(article.id);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleShare = async () => {
    trackShare(article.id, article.title);
    if (navigator.share) {
      await navigator.share({
        title: article.title,
        text: article.description,
        url: article.url,
      });
    } else {
      navigator.clipboard.writeText(article.url);
      toast.success("Link copied to clipboard");
    }
  };

  const handleClick = () => {
    trackClick(article.id, article.title, viewMode === 'grid' ? 'grid_card' : 'list_card');
  };

  const handleBookmark = () => {
    toggleBookmark({
      id: article.id,
      title: article.title,
      url: article.url,
      imageUrl: article.imageUrl,
      source: article.source,
      publishedAt: article.publishedAt
    });
  };

  if (viewMode === 'list') {
    return (
      <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Image */}
          <div className="relative w-full md:w-64 h-48 md:h-auto overflow-hidden flex-shrink-0">
            {article.imageUrl ? (
              <img
                src={article.imageUrl}
                alt={article.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                <span className="text-4xl">📰</span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 p-6">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className="text-xs">
                {article.source}
              </Badge>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDate(article.publishedAt)}
              </span>
            </div>

              <a href={article.url} target="_blank" rel="noopener noreferrer" onClick={handleClick}>
                <CardTitle className="text-xl mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                  {article.title}
                </CardTitle>
              </a>

            <CardDescription className="line-clamp-2 mb-4">
              {article.description}
            </CardDescription>

            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" asChild>
                <a href={article.url} target="_blank" rel="noopener noreferrer">
                  Read More
                  <ExternalLink className="ml-2 h-3 w-3" />
                </a>
              </Button>

              <div className="flex gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={cn("h-8 w-8", bookmarked && "text-primary")} 
                  onClick={handleBookmark}
                  title={bookmarked ? "Remove bookmark" : "Bookmark article"}
                >
                  {bookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleShare}>
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Grid view
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col h-full">
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        {article.imageUrl ? (
          <img
            src={article.imageUrl}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
            <span className="text-4xl">📰</span>
          </div>
        )}
        
        {/* Overlay actions */}
        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button 
            variant="secondary" 
            size="icon" 
            className={cn("h-8 w-8", bookmarked && "text-primary bg-primary/10")} 
            onClick={handleBookmark}
            title={bookmarked ? "Remove bookmark" : "Bookmark article"}
          >
            {bookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
          </Button>
          <Button variant="secondary" size="icon" className="h-8 w-8" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <CardHeader className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="text-xs">
            {article.source}
          </Badge>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDate(article.publishedAt)}
          </span>
        </div>

        <a href={article.url} target="_blank" rel="noopener noreferrer" onClick={handleClick}>
          <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
            {article.title}
          </CardTitle>
        </a>

        <CardDescription className="line-clamp-3 mt-2">
          {article.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0">
        <Button
          variant="outline"
          size="sm"
          className="w-full group-hover:border-primary group-hover:text-primary transition-colors"
          asChild
        >
          <a href={article.url} target="_blank" rel="noopener noreferrer">
            Read More
            <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
