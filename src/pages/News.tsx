import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Newspaper, RefreshCw, TrendingUp, AlertCircle, Wifi, WifiOff, Radio } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";
import { NewsFilters, type NewsCategory, type NewsRegion } from "@/components/news/NewsFilters";
import { NewsFeaturedCarousel } from "@/components/news/NewsFeaturedCarousel";
import { NewsArticleCard } from "@/components/news/NewsArticleCard";
import { NewsletterSubscription } from "@/components/news/NewsletterSubscription";

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

interface NewsResponse {
  articles: Article[];
  total: number;
  source: 'live' | 'sample';
  provider: 'gnews' | 'newsapi' | 'rss' | 'monarch';
}

export default function News() {
  const [category, setCategory] = useState<NewsCategory>('all');
  const [region, setRegion] = useState<NewsRegion>('global');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['news', category, region, debouncedSearch],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('fetch-news', {
        body: { category, region, searchTerm: debouncedSearch }
      });
      
      if (error) throw error;
      return data as NewsResponse;
    },
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const isLive = data?.source === 'live';
  const provider = data?.provider;

  useEffect(() => {
    if (error) {
      toast.error('Failed to load news. Please try again later.');
    }
  }, [error]);

  const articles = data?.articles || [];
  const featuredArticles = articles.slice(0, 5);
  const remainingArticles = articles.slice(5);

  return (
    <>
      <Helmet>
        <title>Property Management News & Insights | Monarch Property Management</title>
        <meta name="description" content="Stay updated with the latest news, trends, and advice in property management, real estate markets, and industry careers from around the world." />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Hero Header with Background Image */}
        <div className="relative overflow-hidden border-b">
          {/* Background Image */}
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1600&h=600&fit=crop"
              alt=""
              className="w-full h-full object-cover"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/80 to-background" />
          </div>
          
          <div className="container max-w-7xl mx-auto px-4 py-16 md:py-20 relative z-10">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-primary/20 backdrop-blur rounded-xl flex items-center justify-center shadow-lg">
                    <Newspaper className="h-6 w-6 text-primary" />
                  </div>
                  {!isLoading && (
                    <Badge 
                      variant={isLive ? "default" : "secondary"}
                      className={`gap-1.5 ${isLive ? 'bg-green-600 hover:bg-green-700' : ''}`}
                    >
                      {isLive ? (
                        <>
                          <Radio className="h-3 w-3 animate-pulse" />
                          Live News
                        </>
                      ) : (
                        <>
                          <WifiOff className="h-3 w-3" />
                          Sample Articles
                        </>
                      )}
                    </Badge>
                  )}
                  {isLive && provider && (
                    <span className="text-xs text-muted-foreground">
                      via {provider === 'gnews' ? 'GNews' : provider === 'rss' ? 'RSS Feeds' : 'NewsAPI'}
                    </span>
                  )}
                </div>
                <h1 className="text-4xl md:text-5xl font-bold mb-3 text-foreground drop-shadow-sm">
                  Property <span className="text-primary">News</span> & Insights
                </h1>
                <p className="text-lg text-foreground/80 max-w-2xl drop-shadow-sm">
                  Stay informed with the latest trends, market updates, investment opportunities, and expert advice from the property management industry worldwide.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => refetch()} 
                  disabled={isFetching}
                  className="gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container max-w-7xl mx-auto px-4 py-8">
          {/* Filters */}
          <div className="mb-8">
            <NewsFilters
              category={category}
              onCategoryChange={setCategory}
              region={region}
              onRegionChange={setRegion}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="space-y-8">
              {/* Featured skeleton */}
              <div className="h-[400px] bg-muted rounded-2xl animate-pulse" />
              
              {/* Grid skeleton */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-48 bg-muted rounded-t-lg" />
                    <div className="p-6 space-y-3">
                      <div className="h-4 bg-muted rounded w-1/4" />
                      <div className="h-6 bg-muted rounded" />
                      <div className="h-4 bg-muted rounded w-3/4" />
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Content */}
          {!isLoading && articles.length > 0 && (
            <div className="space-y-10">
              {/* Featured Carousel - only show when not searching */}
              {!debouncedSearch && featuredArticles.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-6">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold">Featured Stories</h2>
                  </div>
                  <NewsFeaturedCarousel articles={featuredArticles} />
                </section>
              )}

              {/* Articles Grid/List */}
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">
                    {debouncedSearch ? 'Search Results' : 'Latest Articles'}
                  </h2>
                  <span className="text-sm text-muted-foreground">
                    {articles.length} articles
                  </span>
                </div>

                {viewMode === 'grid' ? (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {(debouncedSearch ? articles : remainingArticles).map((article) => (
                      <NewsArticleCard 
                        key={article.id} 
                        article={article} 
                        viewMode={viewMode}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(debouncedSearch ? articles : remainingArticles).map((article) => (
                      <NewsArticleCard 
                        key={article.id} 
                        article={article} 
                        viewMode={viewMode}
                      />
                    ))}
                  </div>
                )}
              </section>

              {/* Load more hint */}
              {articles.length >= 20 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    Showing top {articles.length} articles. Refine your search to find more specific content.
                  </p>
                </div>
              )}

              {/* Newsletter Subscription */}
              <section className="mt-12">
                <NewsletterSubscription />
              </section>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && articles.length === 0 && (
            <Card className="text-center py-16">
              <CardContent>
                <Newspaper className="h-16 w-16 mx-auto mb-6 text-muted-foreground/50" />
                <h3 className="text-2xl font-semibold mb-3">No articles found</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  We couldn't find any articles matching your criteria. Try adjusting your filters or search terms.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button variant="outline" onClick={() => {
                    setCategory('all');
                    setRegion('global');
                    setSearchTerm('');
                  }}>
                    Clear Filters
                  </Button>
                  <Button onClick={() => refetch()}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <Card className="text-center py-16 border-destructive/50">
              <CardContent>
                <AlertCircle className="h-16 w-16 mx-auto mb-6 text-destructive/50" />
                <h3 className="text-2xl font-semibold mb-3">Failed to load news</h3>
                <p className="text-muted-foreground mb-6">
                  There was an error fetching the latest articles. Please try again.
                </p>
                <Button onClick={() => refetch()} variant="destructive">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
