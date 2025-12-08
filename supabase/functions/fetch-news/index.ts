import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// RSS Feed sources for property management news (FREE backup)
const RSS_FEEDS = [
  { name: 'NAR Newsroom', url: 'https://www.nar.realtor/newsroom.rss', category: 'real-estate' },
  { name: 'Inman News', url: 'https://www.inman.com/feed/', category: 'property' },
  { name: 'HousingWire', url: 'https://www.housingwire.com/feed/', category: 'real-estate' },
  { name: 'Propmodo', url: 'https://www.propmodo.com/feed/', category: 'technology' },
];

interface Article {
  id: string;
  title: string;
  description: string;
  url: string;
  imageUrl: string;
  publishedAt: string;
  source: string;
  author: string;
  category: string;
}

// Parse RSS feed XML
async function parseRSSFeed(feedUrl: string, sourceName: string, category: string): Promise<Article[]> {
  try {
    const response = await fetch(feedUrl, {
      headers: { 'User-Agent': 'Monarch Property Management News Aggregator' }
    });
    
    if (!response.ok) {
      console.error(`RSS fetch failed for ${sourceName}: ${response.status}`);
      return [];
    }
    
    const xml = await response.text();
    const articles: Article[] = [];
    
    // Parse XML manually (Deno doesn't have DOMParser in edge functions)
    const itemMatches = xml.match(/<item[^>]*>[\s\S]*?<\/item>/gi) || [];
    
    for (let i = 0; i < Math.min(itemMatches.length, 5); i++) {
      const item = itemMatches[i];
      
      const titleMatch = item.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
      const descMatch = item.match(/<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i);
      const linkMatch = item.match(/<link[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i);
      const pubDateMatch = item.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i);
      const mediaMatch = item.match(/<media:content[^>]*url="([^"]*)"/) || item.match(/<enclosure[^>]*url="([^"]*)"/);
      const imgMatch = item.match(/<img[^>]*src="([^"]*)"/);
      
      const title = titleMatch ? titleMatch[1].trim().replace(/<[^>]*>/g, '') : '';
      const description = descMatch ? descMatch[1].trim().replace(/<[^>]*>/g, '').substring(0, 300) : '';
      const url = linkMatch ? linkMatch[1].trim() : '';
      const imageUrl = mediaMatch ? mediaMatch[1] : (imgMatch ? imgMatch[1] : '');
      const publishedAt = pubDateMatch ? new Date(pubDateMatch[1]).toISOString() : new Date().toISOString();
      
      if (title && url) {
        articles.push({
          id: `rss-${sourceName.toLowerCase().replace(/\s+/g, '-')}-${i}-${Date.now()}`,
          title,
          description: description || `Latest news from ${sourceName}`,
          url,
          imageUrl,
          publishedAt,
          source: sourceName,
          author: sourceName,
          category,
        });
      }
    }
    
    console.log(`Parsed ${articles.length} articles from ${sourceName}`);
    return articles;
  } catch (error) {
    console.error(`Error parsing RSS feed ${sourceName}:`, error);
    return [];
  }
}

// Fetch articles from all RSS feeds
async function fetchRSSArticles(): Promise<Article[]> {
  const allArticles: Article[] = [];
  
  const feedPromises = RSS_FEEDS.map(feed => 
    parseRSSFeed(feed.url, feed.name, feed.category)
  );
  
  const results = await Promise.allSettled(feedPromises);
  
  for (const result of results) {
    if (result.status === 'fulfilled') {
      allArticles.push(...result.value);
    }
  }
  
  // Sort by publish date
  allArticles.sort((a, b) => 
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
  
  console.log(`Total RSS articles: ${allArticles.length}`);
  return allArticles;
}

// Enhanced sample articles for property management
const generateSampleArticles = () => {
  const now = Date.now();
  return [
    {
      id: 'sample-1',
      title: 'Property Management Trends to Watch in 2025',
      description: 'Discover the latest trends shaping the property management industry, from AI-powered maintenance to sustainable building practices and tenant experience platforms.',
      url: 'https://www.nar.realtor/research-and-statistics',
      imageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&auto=format&fit=crop',
      publishedAt: new Date(now - 3600000).toISOString(),
      source: 'NAR Insights',
      author: 'Property Research Team',
      category: 'property',
    },
    {
      id: 'sample-2',
      title: 'How to Maximize Your Rental Property Investment Returns',
      description: 'Expert tips on optimizing returns from your rental properties through strategic improvements, tenant retention strategies, and market timing.',
      url: 'https://www.zillow.com/research/',
      imageUrl: 'https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800&auto=format&fit=crop',
      publishedAt: new Date(now - 7200000).toISOString(),
      source: 'Zillow Research',
      author: 'Investment Analysts',
      category: 'investment',
    },
    {
      id: 'sample-3',
      title: 'Understanding Tenant Rights and Landlord Responsibilities in 2025',
      description: 'A comprehensive guide to navigating the legal landscape of property management, including new regulations and maintaining positive tenant relationships.',
      url: 'https://www.hud.gov/topics/rental_assistance',
      imageUrl: 'https://images.unsplash.com/photo-1554469384-e58fac16e23a?w=800&auto=format&fit=crop',
      publishedAt: new Date(now - 10800000).toISOString(),
      source: 'HUD News',
      author: 'Legal Affairs Team',
      category: 'legal',
    },
    {
      id: 'sample-4',
      title: 'Smart Home Technology Revolutionizing Property Management',
      description: 'How smart home devices, IoT sensors, and AI-powered systems are transforming property management efficiency and tenant satisfaction.',
      url: 'https://www.inman.com/category/technology/',
      imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop',
      publishedAt: new Date(now - 14400000).toISOString(),
      source: 'Inman Tech',
      author: 'PropTech Reporter',
      category: 'technology',
    },
    {
      id: 'sample-5',
      title: 'Sustainable Property Management: Green Building Practices',
      description: 'Learn how eco-friendly initiatives can reduce operating costs by up to 30% and attract environmentally conscious tenants.',
      url: 'https://www.usgbc.org/articles',
      imageUrl: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800&auto=format&fit=crop',
      publishedAt: new Date(now - 18000000).toISOString(),
      source: 'USGBC',
      author: 'Green Building Council',
      category: 'property',
    },
    {
      id: 'sample-6',
      title: 'Real Estate Market Analysis: Regional Trends Report',
      description: 'Comprehensive analysis of real estate market trends, pricing shifts, and investment opportunities across major metropolitan markets.',
      url: 'https://www.corelogic.com/intelligence/',
      imageUrl: 'https://images.unsplash.com/photo-1560520653-9e0e4c89eb11?w=800&auto=format&fit=crop',
      publishedAt: new Date(now - 25200000).toISOString(),
      source: 'CoreLogic',
      author: 'Market Analytics',
      category: 'real-estate',
    },
    {
      id: 'sample-7',
      title: 'Commercial Property Investment Strategies for Economic Uncertainty',
      description: 'Expert insights on commercial real estate investment opportunities, risk management strategies, and portfolio diversification.',
      url: 'https://www.cbre.com/insights',
      imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop',
      publishedAt: new Date(now - 28800000).toISOString(),
      source: 'CBRE Research',
      author: 'Commercial Team',
      category: 'investment',
    },
    {
      id: 'sample-8',
      title: 'PropTech Startups Disrupting Traditional Property Management',
      description: 'The latest PropTech innovations transforming how properties are managed, marketed, and maintained with significant investment growth.',
      url: 'https://www.propmodo.com/',
      imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop',
      publishedAt: new Date(now - 32400000).toISOString(),
      source: 'Propmodo',
      author: 'Tech Editor',
      category: 'technology',
    },
    {
      id: 'sample-9',
      title: 'New Regulations Affecting Property Managers: Compliance Guide',
      description: 'Stay compliant with the latest regulatory changes impacting property management operations, including fair housing updates.',
      url: 'https://www.narpm.org/resources/',
      imageUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop',
      publishedAt: new Date(now - 36000000).toISOString(),
      source: 'NARPM',
      author: 'Compliance Team',
      category: 'legal',
    },
    {
      id: 'sample-10',
      title: 'Multifamily Housing Demand Surges in Suburban Markets',
      description: 'Remote work continues to drive demand for suburban multifamily properties with vacancy rates hitting historic lows.',
      url: 'https://www.nmhc.org/research-insight/',
      imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop',
      publishedAt: new Date(now - 43200000).toISOString(),
      source: 'NMHC',
      author: 'Housing Research',
      category: 'real-estate',
    },
  ];
};

// GNews API category/query mapping
const getCategoryQuery = (category: string): string => {
  const queries: Record<string, string> = {
    'property': 'property management OR rental property OR landlord tenant',
    'real-estate': 'real estate market OR housing prices OR home sales',
    'investment': 'real estate investment OR property investment OR REIT',
    'careers': 'property manager jobs OR real estate career',
    'legal': 'landlord tenant law OR housing regulations OR rent control',
    'technology': 'proptech OR property technology OR smart building',
    'all': 'property management OR real estate OR housing market',
  };
  return queries[category] || queries['all'];
};

// GNews region mapping
const getGNewsLang = (region: string): { lang: string; country?: string } => {
  const mapping: Record<string, { lang: string; country?: string }> = {
    'north-america': { lang: 'en', country: 'us' },
    'europe': { lang: 'en', country: 'gb' },
    'asia': { lang: 'en' },
    'middle-east': { lang: 'en' },
    'africa': { lang: 'en' },
    'oceania': { lang: 'en', country: 'au' },
    'global': { lang: 'en' },
  };
  return mapping[region] || mapping['global'];
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GNEWS_API_KEY = Deno.env.get('GNEWS_API_KEY');
    
    const { category = 'all', region = 'global', searchTerm = '', includeRSS = true } = await req.json().catch(() => ({}));

    console.log(`Fetching news: category=${category}, region=${region}, search=${searchTerm}, includeRSS=${includeRSS}`);
    console.log(`GNews API Key available: ${!!GNEWS_API_KEY}`);

    let allArticles: Article[] = [];
    let source: 'live' | 'sample' = 'sample';
    let provider = 'monarch';

    // PRIMARY: Try GNews API first
    if (GNEWS_API_KEY) {
      try {
        const query = searchTerm || getCategoryQuery(category);
        const { lang, country } = getGNewsLang(region);
        
        let apiUrl = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=${lang}&max=15&apikey=${GNEWS_API_KEY}`;
        
        if (country) {
          apiUrl += `&country=${country}`;
        }

        console.log('Fetching from GNews API (primary source)...');

        const response = await fetch(apiUrl);

        if (response.ok) {
          const data = await response.json();
          
          if (data.articles && data.articles.length > 0) {
            const gnewsArticles = data.articles.map((article: any, index: number) => ({
              id: `gnews-${index}-${Date.now()}`,
              title: article.title,
              description: article.description || '',
              url: article.url,
              imageUrl: article.image || '',
              publishedAt: article.publishedAt,
              source: article.source?.name || 'GNews',
              author: article.source?.name || '',
              category: category,
            }));

            allArticles.push(...gnewsArticles);
            source = 'live';
            provider = 'gnews';
            console.log(`Got ${gnewsArticles.length} articles from GNews API`);
          }
        } else {
          const errorText = await response.text();
          console.error('GNews API error:', response.status, errorText);
        }
      } catch (gnewsError) {
        console.error('GNews API fetch error:', gnewsError);
      }
    }

    // BACKUP: Use RSS feeds if GNews fails or returns insufficient articles
    if (includeRSS && allArticles.length < 5) {
      try {
        console.log('Fetching from RSS feeds (backup source)...');
        const rssArticles = await fetchRSSArticles();
        
        if (rssArticles.length > 0) {
          // Add RSS articles that aren't duplicates
          const existingTitles = new Set(allArticles.map(a => a.title.toLowerCase()));
          const newRssArticles = rssArticles.filter(a => !existingTitles.has(a.title.toLowerCase()));
          
          allArticles.push(...newRssArticles);
          
          if (source === 'sample' && newRssArticles.length > 0) {
            source = 'live';
            provider = 'rss';
          }
          
          console.log(`Added ${newRssArticles.length} unique RSS articles as backup`);
        }
      } catch (rssError) {
        console.error('RSS fetch error:', rssError);
      }
    }

    // SUPPLEMENT: Add RSS for additional content variety (when GNews succeeded)
    if (includeRSS && allArticles.length >= 5 && source === 'live') {
      try {
        const rssArticles = await fetchRSSArticles();
        
        if (rssArticles.length > 0) {
          const existingTitles = new Set(allArticles.map(a => a.title.toLowerCase()));
          const newRssArticles = rssArticles.filter(a => !existingTitles.has(a.title.toLowerCase()));
          
          // Add up to 5 RSS articles for variety
          allArticles.push(...newRssArticles.slice(0, 5));
          console.log(`Supplemented with ${Math.min(newRssArticles.length, 5)} RSS articles for variety`);
        }
      } catch (rssError) {
        console.error('RSS supplement error:', rssError);
      }
    }

    // FALLBACK: If still no articles, use sample data
    if (allArticles.length === 0) {
      console.log('No live data available, returning sample articles');
      const sampleArticles = generateSampleArticles();
      allArticles = filterArticles(sampleArticles, category, searchTerm);
      source = 'sample';
      provider = 'monarch';
    } else {
      // Filter by category and search if needed
      allArticles = filterArticles(allArticles, category, searchTerm);
    }

    // Sort by date
    allArticles.sort((a, b) => 
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    // Limit to 25 articles
    allArticles = allArticles.slice(0, 25);

    console.log(`Returning ${allArticles.length} total articles, source: ${source}, provider: ${provider}`);

    return new Response(
      JSON.stringify({ 
        articles: allArticles, 
        total: allArticles.length,
        source,
        provider
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in fetch-news function:', error);
    
    const sampleArticles = generateSampleArticles();
    return new Response(
      JSON.stringify({ 
        articles: sampleArticles, 
        total: sampleArticles.length,
        source: 'sample',
        provider: 'monarch'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function filterArticles(articles: Article[], category: string, searchTerm: string): Article[] {
  let filtered = [...articles];
  
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter(article => 
      article.title.toLowerCase().includes(term) ||
      article.description.toLowerCase().includes(term) ||
      article.source.toLowerCase().includes(term)
    );
  }
  
  if (category && category !== 'all') {
    // Filter by category if articles have category tags
    const categoryFiltered = filtered.filter(article => 
      article.category === category ||
      article.title.toLowerCase().includes(category) ||
      article.description.toLowerCase().includes(category)
    );
    
    // If category filtering returns results, use them; otherwise keep all
    if (categoryFiltered.length > 0) {
      filtered = categoryFiltered;
    }
  }
  
  return filtered;
}
