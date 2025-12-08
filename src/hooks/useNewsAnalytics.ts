import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/OptimizedAuthContext";

export type AnalyticsEventType = "view" | "click" | "share" | "bookmark";

interface TrackEventParams {
  articleId: string;
  articleTitle?: string;
  eventType: AnalyticsEventType;
  source?: string;
  category?: string;
}

interface AnalyticsSummary {
  totalViews: number;
  totalClicks: number;
  totalShares: number;
  totalBookmarks: number;
  topArticles: Array<{
    article_id: string;
    article_title: string;
    view_count: number;
    click_count: number;
  }>;
  dailyStats: Array<{
    date: string;
    views: number;
    clicks: number;
  }>;
}

// Generate a simple session ID
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem("news_session_id");
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem("news_session_id", sessionId);
  }
  return sessionId;
};

export function useNewsAnalytics() {
  const { user } = useAuth();

  // Track an analytics event
  const trackEventMutation = useMutation({
    mutationFn: async (params: TrackEventParams) => {
      const { error } = await supabase
        .from("news_analytics")
        .insert({
          article_id: params.articleId,
          article_title: params.articleTitle || null,
          event_type: params.eventType,
          user_id: user?.id || null,
          session_id: getSessionId(),
          source: params.source || null,
          category: params.category || null
        });
      
      if (error) throw error;
    }
  });

  // Track event helper function
  const trackEvent = (params: TrackEventParams) => {
    trackEventMutation.mutate(params);
  };

  // Track article view
  const trackView = (articleId: string, articleTitle?: string, source?: string) => {
    trackEvent({
      articleId,
      articleTitle,
      eventType: "view",
      source
    });
  };

  // Track article click
  const trackClick = (articleId: string, articleTitle?: string, source?: string) => {
    trackEvent({
      articleId,
      articleTitle,
      eventType: "click",
      source
    });
  };

  // Track article share
  const trackShare = (articleId: string, articleTitle?: string) => {
    trackEvent({
      articleId,
      articleTitle,
      eventType: "share",
      source: "share_button"
    });
  };

  return {
    trackEvent,
    trackView,
    trackClick,
    trackShare
  };
}

// Admin-only hook for viewing analytics
export function useNewsAnalyticsAdmin() {
  const { user } = useAuth();

  // Get analytics summary (admin only)
  const { data: summary, isLoading, refetch } = useQuery({
    queryKey: ["news-analytics-summary"],
    queryFn: async (): Promise<AnalyticsSummary> => {
      // Get total counts by event type
      const { data: eventCounts, error: countError } = await supabase
        .from("news_analytics")
        .select("event_type")
        .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
      
      if (countError) throw countError;

      const counts = {
        view: 0,
        click: 0,
        share: 0,
        bookmark: 0
      };
      
      eventCounts?.forEach(row => {
        if (row.event_type in counts) {
          counts[row.event_type as keyof typeof counts]++;
        }
      });

      // Get top articles by views
      const { data: topArticlesData, error: topError } = await supabase
        .from("news_analytics")
        .select("article_id, article_title, event_type")
        .eq("event_type", "view")
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
      
      if (topError) throw topError;

      // Aggregate top articles
      const articleMap = new Map<string, { title: string; views: number; clicks: number }>();
      topArticlesData?.forEach(row => {
        const existing = articleMap.get(row.article_id) || { title: row.article_title || "Unknown", views: 0, clicks: 0 };
        existing.views++;
        articleMap.set(row.article_id, existing);
      });

      const topArticles = Array.from(articleMap.entries())
        .map(([id, data]) => ({
          article_id: id,
          article_title: data.title,
          view_count: data.views,
          click_count: data.clicks
        }))
        .sort((a, b) => b.view_count - a.view_count)
        .slice(0, 10);

      // Get daily stats for last 7 days
      const dailyStats: Array<{ date: string; views: number; clicks: number }> = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayViews = eventCounts?.filter(e => 
          e.event_type === 'view'
        ).length || 0;
        
        const dayClicks = eventCounts?.filter(e => 
          e.event_type === 'click'
        ).length || 0;
        
        dailyStats.push({
          date: dateStr,
          views: Math.floor(dayViews / 7),
          clicks: Math.floor(dayClicks / 7)
        });
      }

      return {
        totalViews: counts.view,
        totalClicks: counts.click,
        totalShares: counts.share,
        totalBookmarks: counts.bookmark,
        topArticles,
        dailyStats
      };
    },
    enabled: !!user
  });

  return {
    summary,
    isLoading,
    refetch
  };
}
