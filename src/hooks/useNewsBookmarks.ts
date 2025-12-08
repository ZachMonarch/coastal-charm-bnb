import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/OptimizedAuthContext";
import { toast } from "sonner";

export interface BookmarkedArticle {
  id: string;
  user_id: string;
  article_id: string;
  article_title: string;
  article_url: string;
  article_image_url: string | null;
  article_source: string | null;
  article_published_at: string | null;
  bookmarked_at: string;
  notes: string | null;
}

export interface ArticleToBookmark {
  id: string;
  title: string;
  url: string;
  imageUrl?: string;
  source?: string;
  publishedAt?: string;
}

export function useNewsBookmarks() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user's bookmarks
  const { data: bookmarks = [], isLoading, refetch } = useQuery({
    queryKey: ["news-bookmarks", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("article_bookmarks")
        .select("id, user_id, article_id, article_title, article_url, article_image_url, article_source, article_published_at, bookmarked_at, notes")
        .eq("user_id", user.id)
        .order("bookmarked_at", { ascending: false });
      
      if (error) throw error;
      return data as BookmarkedArticle[];
    },
    enabled: !!user?.id
  });

  // Check if article is bookmarked
  const isBookmarked = (articleId: string): boolean => {
    return bookmarks.some(b => b.article_id === articleId);
  };

  // Add bookmark mutation
  const addBookmarkMutation = useMutation({
    mutationFn: async (article: ArticleToBookmark) => {
      if (!user?.id) throw new Error("Must be logged in to bookmark");
      
      const { error } = await supabase
        .from("article_bookmarks")
        .insert({
          user_id: user.id,
          article_id: article.id,
          article_title: article.title,
          article_url: article.url,
          article_image_url: article.imageUrl || null,
          article_source: article.source || null,
          article_published_at: article.publishedAt || null
        });
      
      if (error) throw error;
      
      // Track analytics
      await supabase.from("news_analytics").insert({
        article_id: article.id,
        article_title: article.title,
        event_type: "bookmark",
        user_id: user.id,
        source: "article_card"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["news-bookmarks"] });
      toast.success("Article bookmarked!");
    },
    onError: (error: Error) => {
      if (error.message.includes("duplicate")) {
        toast.info("Article already bookmarked");
      } else {
        toast.error("Failed to bookmark article");
      }
    }
  });

  // Remove bookmark mutation
  const removeBookmarkMutation = useMutation({
    mutationFn: async (articleId: string) => {
      if (!user?.id) throw new Error("Must be logged in");
      
      const { error } = await supabase
        .from("article_bookmarks")
        .delete()
        .eq("user_id", user.id)
        .eq("article_id", articleId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["news-bookmarks"] });
      toast.success("Bookmark removed");
    },
    onError: () => {
      toast.error("Failed to remove bookmark");
    }
  });

  // Toggle bookmark
  const toggleBookmark = (article: ArticleToBookmark) => {
    if (!user) {
      toast.error("Please sign in to bookmark articles");
      return;
    }
    
    if (isBookmarked(article.id)) {
      removeBookmarkMutation.mutate(article.id);
    } else {
      addBookmarkMutation.mutate(article);
    }
  };

  return {
    bookmarks,
    isLoading,
    isBookmarked,
    toggleBookmark,
    addBookmark: addBookmarkMutation.mutate,
    removeBookmark: removeBookmarkMutation.mutate,
    refetch
  };
}
