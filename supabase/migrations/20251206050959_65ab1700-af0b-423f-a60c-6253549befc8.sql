-- News articles table for caching and custom articles
CREATE TABLE IF NOT EXISTS news_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  url TEXT NOT NULL,
  image_url TEXT,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source TEXT NOT NULL,
  source_type TEXT CHECK (source_type IN ('gnews', 'newsapi', 'rss', 'custom')) NOT NULL,
  author TEXT,
  category TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- RSS Feed sources management
CREATE TABLE IF NOT EXISTS rss_feed_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  last_fetched_at TIMESTAMPTZ,
  fetch_interval_minutes INTEGER DEFAULT 60,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rss_feed_sources ENABLE ROW LEVEL SECURITY;

-- RLS Policies for news_articles
CREATE POLICY "news_articles_public_read" ON news_articles
  FOR SELECT USING (is_published = TRUE);

CREATE POLICY "news_articles_admin_manage" ON news_articles
  FOR ALL USING (is_admin_user(auth.uid()))
  WITH CHECK (is_admin_user(auth.uid()));

-- RLS Policies for rss_feed_sources
CREATE POLICY "rss_feed_sources_public_read" ON rss_feed_sources
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "rss_feed_sources_admin_manage" ON rss_feed_sources
  FOR ALL USING (is_admin_user(auth.uid()))
  WITH CHECK (is_admin_user(auth.uid()));

-- Insert default RSS sources
INSERT INTO rss_feed_sources (name, url, category, is_active) VALUES
  ('NAR Newsroom', 'https://www.nar.realtor/newsroom.rss', 'real-estate', TRUE),
  ('Inman News', 'https://www.inman.com/feed/', 'property', TRUE),
  ('HousingWire', 'https://www.housingwire.com/feed/', 'real-estate', TRUE),
  ('Propmodo', 'https://www.propmodo.com/feed/', 'technology', TRUE),
  ('NARPM News', 'https://www.narpm.org/about/press-room/feed/', 'property', TRUE)
ON CONFLICT (url) DO NOTHING;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_news_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER news_articles_updated_at
  BEFORE UPDATE ON news_articles
  FOR EACH ROW EXECUTE FUNCTION update_news_updated_at();

CREATE TRIGGER rss_feed_sources_updated_at
  BEFORE UPDATE ON rss_feed_sources
  FOR EACH ROW EXECUTE FUNCTION update_news_updated_at();