-- ============================================================================
-- News Enhancement: Bookmarks, Newsletter Subscriptions, and Analytics
-- ============================================================================

-- Article Bookmarks for Users
CREATE TABLE IF NOT EXISTS article_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id TEXT NOT NULL,
  article_title TEXT NOT NULL,
  article_url TEXT NOT NULL,
  article_image_url TEXT,
  article_source TEXT,
  article_published_at TIMESTAMPTZ,
  bookmarked_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  UNIQUE(user_id, article_id)
);

-- Newsletter Subscriptions
CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  subscription_type TEXT DEFAULT 'weekly' CHECK (subscription_type IN ('daily', 'weekly', 'monthly')),
  categories TEXT[] DEFAULT ARRAY['all'],
  is_active BOOLEAN DEFAULT TRUE,
  confirmed_at TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(email)
);

-- News Analytics for Tracking
CREATE TABLE IF NOT EXISTS news_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id TEXT NOT NULL,
  article_title TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'click', 'share', 'bookmark')),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  source TEXT,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON article_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_article ON article_bookmarks(article_id);
CREATE INDEX IF NOT EXISTS idx_analytics_article ON news_analytics(article_id);
CREATE INDEX IF NOT EXISTS idx_analytics_date ON news_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON news_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscriptions(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_active ON newsletter_subscriptions(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE article_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_analytics ENABLE ROW LEVEL SECURITY;

-- Bookmark policies (users manage their own)
CREATE POLICY "bookmarks_own_access" ON article_bookmarks
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Newsletter policies (users manage their own or admin)
CREATE POLICY "newsletter_own_access" ON newsletter_subscriptions
  FOR SELECT USING (
    (user_id = auth.uid()) OR 
    (email = (SELECT email FROM auth.users WHERE id = auth.uid())) OR
    is_admin_user(auth.uid())
  );

CREATE POLICY "newsletter_insert" ON newsletter_subscriptions
  FOR INSERT WITH CHECK (
    (user_id = auth.uid()) OR 
    (user_id IS NULL)
  );

CREATE POLICY "newsletter_update" ON newsletter_subscriptions
  FOR UPDATE USING (
    (user_id = auth.uid()) OR 
    (email = (SELECT email FROM auth.users WHERE id = auth.uid())) OR
    is_admin_user(auth.uid())
  );

CREATE POLICY "newsletter_admin_delete" ON newsletter_subscriptions
  FOR DELETE USING (is_admin_user(auth.uid()));

-- Analytics policies (insert for all authenticated, read for admins)
CREATE POLICY "analytics_insert" ON news_analytics
  FOR INSERT WITH CHECK (true);

CREATE POLICY "analytics_read_admin" ON news_analytics
  FOR SELECT USING (is_admin_user(auth.uid()));

-- Trigger to update newsletter updated_at
CREATE OR REPLACE FUNCTION update_newsletter_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

CREATE TRIGGER newsletter_updated_at
  BEFORE UPDATE ON newsletter_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_newsletter_updated_at();