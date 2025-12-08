import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { useNewsBookmarks } from "@/hooks/useNewsBookmarks";
import { useAuth } from "@/contexts/OptimizedAuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Bookmark, ExternalLink, Trash2, Search, Clock, 
  ArrowLeft, BookmarkX, Newspaper 
} from "lucide-react";
import { format } from "date-fns";

export default function Bookmarks() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { bookmarks, isLoading, removeBookmark } = useNewsBookmarks();
  const [searchTerm, setSearchTerm] = useState("");

  // Filter bookmarks by search term
  const filteredBookmarks = bookmarks.filter(bookmark =>
    bookmark.article_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (bookmark.article_source?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  if (!user) {
    return (
      <div className="container max-w-4xl mx-auto py-12 px-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Bookmark className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Sign In Required</h2>
            <p className="text-muted-foreground mb-6">
              Please sign in to view your saved articles
            </p>
            <Button onClick={() => navigate("/auth")}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Saved Articles | Monarch Property Management</title>
        <meta name="description" content="View your saved property news articles" />
      </Helmet>

      <div className="container max-w-5xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/news")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Bookmark className="h-8 w-8 text-primary" />
                Saved Articles
              </h1>
              <p className="text-muted-foreground">
                {bookmarks.length} article{bookmarks.length !== 1 ? "s" : ""} saved
              </p>
            </div>
          </div>
          
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search bookmarks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Bookmarks List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <div className="w-24 h-24 bg-muted rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-muted rounded w-3/4" />
                      <div className="h-4 bg-muted rounded w-1/2" />
                      <div className="h-4 bg-muted rounded w-1/4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredBookmarks.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              {searchTerm ? (
                <>
                  <Search className="h-16 w-16 text-muted-foreground mb-4" />
                  <h2 className="text-xl font-semibold mb-2">No Results Found</h2>
                  <p className="text-muted-foreground mb-4">
                    No bookmarks match "{searchTerm}"
                  </p>
                  <Button variant="outline" onClick={() => setSearchTerm("")}>
                    Clear Search
                  </Button>
                </>
              ) : (
                <>
                  <BookmarkX className="h-16 w-16 text-muted-foreground mb-4" />
                  <h2 className="text-xl font-semibold mb-2">No Saved Articles</h2>
                  <p className="text-muted-foreground mb-6">
                    Start saving articles by clicking the bookmark icon on any news article
                  </p>
                  <Button onClick={() => navigate("/news")}>
                    <Newspaper className="h-4 w-4 mr-2" />
                    Browse News
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredBookmarks.map((bookmark) => (
              <Card key={bookmark.id} className="group hover:shadow-md transition-shadow">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Thumbnail */}
                    {bookmark.article_image_url && (
                      <div className="w-full sm:w-32 h-32 sm:h-24 flex-shrink-0 overflow-hidden rounded-lg">
                        <img
                          src={bookmark.article_image_url}
                          alt={bookmark.article_title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <a 
                          href={bookmark.article_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="group/link"
                        >
                          <h3 className="font-semibold text-lg line-clamp-2 group-hover/link:text-primary transition-colors">
                            {bookmark.article_title}
                          </h3>
                        </a>
                        
                        <div className="flex gap-1 flex-shrink-0">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => window.open(bookmark.article_url, "_blank")}
                            title="Open article"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => removeBookmark(bookmark.article_id)}
                            title="Remove bookmark"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-muted-foreground">
                        {bookmark.article_source && (
                          <Badge variant="outline" className="text-xs">
                            {bookmark.article_source}
                          </Badge>
                        )}
                        {bookmark.article_published_at && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(bookmark.article_published_at), "MMM d, yyyy")}
                          </span>
                        )}
                        <span className="text-xs">
                          Saved {format(new Date(bookmark.bookmarked_at), "MMM d, yyyy 'at' h:mm a")}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
