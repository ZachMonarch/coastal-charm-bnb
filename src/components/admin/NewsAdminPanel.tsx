import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Newspaper, Rss, PlusCircle, RefreshCw, Trash2, Star, StarOff, 
  Eye, EyeOff, ExternalLink, CheckCircle, XCircle, Radio, Clock,
  Mail, BarChart3, Users, TrendingUp, MousePointer, Share2
} from "lucide-react";
import { useNewsAnalyticsAdmin } from "@/hooks/useNewsAnalytics";
import { format } from "date-fns";

interface NewsArticle {
  id: string;
  title: string;
  description: string | null;
  url: string;
  image_url: string | null;
  published_at: string;
  source: string;
  source_type: string;
  author: string | null;
  category: string | null;
  is_featured: boolean;
  is_published: boolean;
  created_at: string;
}

interface RSSFeedSource {
  id: string;
  name: string;
  url: string;
  is_active: boolean;
  last_fetched_at: string | null;
  fetch_interval_minutes: number;
  category: string | null;
  created_at: string;
}

export default function NewsAdminPanel() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const { summary: analyticsSummary, isLoading: loadingAnalytics } = useNewsAnalyticsAdmin();
  
  // New article form state
  const [newArticle, setNewArticle] = useState({
    title: "",
    description: "",
    url: "",
    image_url: "",
    source: "Monarch News",
    category: "property",
    is_featured: false
  });

  // New RSS source form state
  const [newRSSSource, setNewRSSSource] = useState({
    name: "",
    url: "",
    category: "property"
  });

  // Fetch articles from database
  const { data: articles = [], isLoading: loadingArticles, refetch: refetchArticles } = useQuery({
    queryKey: ["admin-news-articles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news_articles")
        .select("id, title, description, url, image_url, published_at, source, source_type, author, category, is_featured, is_published, created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data as NewsArticle[];
    }
  });

  // Fetch RSS sources
  const { data: rssSources = [], isLoading: loadingRSS, refetch: refetchRSS } = useQuery({
    queryKey: ["admin-rss-sources"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rss_feed_sources")
        .select("id, name, url, is_active, last_fetched_at, fetch_interval_minutes, category, created_at")
        .order("name");
      
      if (error) throw error;
      return data as RSSFeedSource[];
    }
  });

  // Fetch newsletter subscribers
  const { data: subscribers = [], isLoading: loadingSubscribers, refetch: refetchSubscribers } = useQuery({
    queryKey: ["admin-newsletter-subscribers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("newsletter_subscriptions")
        .select("id, email, subscription_type, is_active, confirmed_at, created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data;
    }
  });

  // Create custom article mutation
  const createArticleMutation = useMutation({
    mutationFn: async (article: typeof newArticle) => {
      const { error } = await supabase
        .from("news_articles")
        .insert({
          title: article.title,
          description: article.description,
          url: article.url,
          image_url: article.image_url || null,
          source: article.source,
          source_type: "custom",
          category: article.category,
          is_featured: article.is_featured,
          is_published: true,
          published_at: new Date().toISOString()
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Article created successfully");
      refetchArticles();
      setNewArticle({
        title: "",
        description: "",
        url: "",
        image_url: "",
        source: "Monarch News",
        category: "property",
        is_featured: false
      });
    },
    onError: (error: Error) => {
      toast.error(`Failed to create article: ${error.message}`);
    }
  });

  // Toggle article featured status
  const toggleFeaturedMutation = useMutation({
    mutationFn: async ({ id, is_featured }: { id: string; is_featured: boolean }) => {
      const { error } = await supabase
        .from("news_articles")
        .update({ is_featured: !is_featured })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      refetchArticles();
      toast.success("Article updated");
    }
  });

  // Toggle article published status
  const togglePublishedMutation = useMutation({
    mutationFn: async ({ id, is_published }: { id: string; is_published: boolean }) => {
      const { error } = await supabase
        .from("news_articles")
        .update({ is_published: !is_published })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      refetchArticles();
      toast.success("Article visibility updated");
    }
  });

  // Delete article mutation
  const deleteArticleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("news_articles")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      refetchArticles();
      toast.success("Article deleted");
    }
  });

  // Add RSS source mutation
  const addRSSSourceMutation = useMutation({
    mutationFn: async (source: typeof newRSSSource) => {
      const { error } = await supabase
        .from("rss_feed_sources")
        .insert({
          name: source.name,
          url: source.url,
          category: source.category,
          is_active: true
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("RSS source added");
      refetchRSS();
      setNewRSSSource({ name: "", url: "", category: "property" });
    },
    onError: (error: Error) => {
      toast.error(`Failed to add RSS source: ${error.message}`);
    }
  });

  // Toggle RSS source active status
  const toggleRSSActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("rss_feed_sources")
        .update({ is_active: !is_active })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      refetchRSS();
      toast.success("RSS source updated");
    }
  });

  // Delete RSS source mutation
  const deleteRSSSourceMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("rss_feed_sources")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      refetchRSS();
      toast.success("RSS source deleted");
    }
  });

  // Stats for overview
  const stats = {
    totalArticles: articles.length,
    featuredArticles: articles.filter(a => a.is_featured).length,
    customArticles: articles.filter(a => a.source_type === "custom").length,
    activeRSS: rssSources.filter(r => r.is_active).length,
    totalRSS: rssSources.length,
    totalSubscribers: subscribers.length,
    activeSubscribers: subscribers.filter(s => s.is_active).length
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Newspaper className="h-6 w-6" />
            News Management
          </h2>
          <p className="text-muted-foreground">Manage news articles, RSS feeds, subscribers, and analytics</p>
        </div>
        <Button onClick={() => { refetchArticles(); refetchRSS(); refetchSubscribers(); }} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="articles">Articles</TabsTrigger>
          <TabsTrigger value="rss">RSS</TabsTrigger>
          <TabsTrigger value="newsletter">Newsletter</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="create">Create</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Articles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalArticles}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Featured</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-warning">{stats.featuredArticles}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Custom Articles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{stats.customArticles}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active RSS Feeds</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-success">{stats.activeRSS}/{stats.totalRSS}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Radio className="h-5 w-5 text-success" />
                API Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span className="font-medium">GNews API</span>
                </div>
                <Badge variant="outline" className="bg-success/10 text-success border-success/30 dark:bg-success/20 dark:border-success/40">
                  Configured
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <Rss className="h-5 w-5 text-primary" />
                  <span className="font-medium">RSS Aggregation</span>
                </div>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                  {stats.activeRSS} Active Feeds
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Articles Tab */}
        <TabsContent value="articles">
          <Card>
            <CardHeader>
              <CardTitle>Manage Articles</CardTitle>
              <CardDescription>View and manage all news articles</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingArticles ? (
                <div className="text-center py-8 text-muted-foreground">Loading articles...</div>
              ) : articles.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No articles found. Create your first custom article.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {articles.map((article) => (
                      <TableRow key={article.id}>
                        <TableCell className="font-medium max-w-xs truncate">
                          {article.title}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{article.source_type}</Badge>
                        </TableCell>
                        <TableCell>{article.category || "-"}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {article.is_featured && (
                              <Badge className="bg-warning text-warning-foreground">Featured</Badge>
                            )}
                            {article.is_published ? (
                              <Badge variant="outline" className="text-success border-success/30">Published</Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground">Hidden</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => toggleFeaturedMutation.mutate({ id: article.id, is_featured: article.is_featured })}
                              title={article.is_featured ? "Remove from featured" : "Add to featured"}
                            >
                              {article.is_featured ? (
                                <StarOff className="h-4 w-4 text-warning" />
                              ) : (
                                <Star className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => togglePublishedMutation.mutate({ id: article.id, is_published: article.is_published })}
                              title={article.is_published ? "Hide article" : "Publish article"}
                            >
                              {article.is_published ? (
                                <Eye className="h-4 w-4" />
                              ) : (
                                <EyeOff className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => window.open(article.url, "_blank")}
                              title="View article"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => deleteArticleMutation.mutate(article.id)}
                              className="text-destructive hover:text-destructive"
                              title="Delete article"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* RSS Sources Tab */}
        <TabsContent value="rss">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Add RSS Feed</CardTitle>
                <CardDescription>Add a new RSS feed source for property news</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="space-y-2">
                    <Label>Feed Name</Label>
                    <Input
                      placeholder="e.g., Realtor.com News"
                      value={newRSSSource.name}
                      onChange={(e) => setNewRSSSource(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>RSS URL</Label>
                    <Input
                      placeholder="https://example.com/feed.xml"
                      value={newRSSSource.url}
                      onChange={(e) => setNewRSSSource(prev => ({ ...prev, url: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={newRSSSource.category}
                      onValueChange={(value) => setNewRSSSource(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="property">Property</SelectItem>
                        <SelectItem value="real-estate">Real Estate</SelectItem>
                        <SelectItem value="investment">Investment</SelectItem>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="legal">Legal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button 
                  onClick={() => addRSSSourceMutation.mutate(newRSSSource)}
                  className="mt-4 gap-2"
                  disabled={!newRSSSource.name || !newRSSSource.url}
                >
                  <PlusCircle className="h-4 w-4" />
                  Add RSS Source
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active RSS Sources</CardTitle>
                <CardDescription>Manage your RSS feed sources</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingRSS ? (
                  <div className="text-center py-8 text-muted-foreground">Loading RSS sources...</div>
                ) : rssSources.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No RSS sources configured.</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>URL</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Last Fetched</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rssSources.map((source) => (
                        <TableRow key={source.id}>
                          <TableCell className="font-medium">{source.name}</TableCell>
                          <TableCell className="max-w-xs truncate text-muted-foreground">
                            {source.url}
                          </TableCell>
                          <TableCell>{source.category || "-"}</TableCell>
                          <TableCell>
                            {source.last_fetched_at ? (
                              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {format(new Date(source.last_fetched_at), "MMM d, HH:mm")}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">Never</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={source.is_active}
                              onCheckedChange={() => toggleRSSActiveMutation.mutate({ id: source.id, is_active: source.is_active })}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => window.open(source.url, "_blank")}
                                title="Open feed URL"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => deleteRSSSourceMutation.mutate(source.id)}
                                className="text-destructive hover:text-destructive"
                                title="Delete source"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Create Article Tab */}
        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Create Custom Article</CardTitle>
              <CardDescription>Add a custom news article or announcement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Title *</Label>
                    <Input
                      placeholder="Article title"
                      value={newArticle.title}
                      onChange={(e) => setNewArticle(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Source Name</Label>
                    <Input
                      placeholder="e.g., Monarch News"
                      value={newArticle.source}
                      onChange={(e) => setNewArticle(prev => ({ ...prev, source: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Description *</Label>
                  <Textarea
                    placeholder="Article description or summary..."
                    rows={4}
                    value={newArticle.description}
                    onChange={(e) => setNewArticle(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Article URL *</Label>
                    <Input
                      placeholder="https://example.com/article"
                      value={newArticle.url}
                      onChange={(e) => setNewArticle(prev => ({ ...prev, url: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Image URL</Label>
                    <Input
                      placeholder="https://example.com/image.jpg"
                      value={newArticle.image_url}
                      onChange={(e) => setNewArticle(prev => ({ ...prev, image_url: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={newArticle.category}
                      onValueChange={(value) => setNewArticle(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="property">Property</SelectItem>
                        <SelectItem value="real-estate">Real Estate</SelectItem>
                        <SelectItem value="investment">Investment</SelectItem>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="legal">Legal</SelectItem>
                        <SelectItem value="careers">Careers</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2 pt-7">
                    <Switch
                      id="featured"
                      checked={newArticle.is_featured}
                      onCheckedChange={(checked) => setNewArticle(prev => ({ ...prev, is_featured: checked }))}
                    />
                    <Label htmlFor="featured">Feature this article</Label>
                  </div>
                </div>

                <Button 
                  onClick={() => createArticleMutation.mutate(newArticle)}
                  disabled={!newArticle.title || !newArticle.description || !newArticle.url || createArticleMutation.isPending}
                  className="gap-2"
                >
                  <PlusCircle className="h-4 w-4" />
                  {createArticleMutation.isPending ? "Creating..." : "Create Article"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Newsletter Tab */}
        <TabsContent value="newsletter">
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Subscribers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalSubscribers}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-500">{stats.activeSubscribers}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Unsubscribed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-muted-foreground">{stats.totalSubscribers - stats.activeSubscribers}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Subscribers
                </CardTitle>
                <CardDescription>Manage newsletter subscribers</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingSubscribers ? (
                  <div className="text-center py-8 text-muted-foreground">Loading subscribers...</div>
                ) : subscribers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No subscribers yet.</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Frequency</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Subscribed</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subscribers.map((sub) => (
                        <TableRow key={sub.id}>
                          <TableCell className="font-medium">{sub.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{sub.subscription_type}</Badge>
                          </TableCell>
                          <TableCell>
                            {sub.is_active ? (
                              <Badge className="bg-green-500">Active</Badge>
                            ) : (
                              <Badge variant="secondary">Unsubscribed</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(sub.created_at), "MMM d, yyyy")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Total Views
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{analyticsSummary?.totalViews || 0}</div>
                  <p className="text-xs text-muted-foreground">Last 30 days</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <MousePointer className="h-4 w-4" />
                    Total Clicks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">{analyticsSummary?.totalClicks || 0}</div>
                  <p className="text-xs text-muted-foreground">Last 30 days</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Share2 className="h-4 w-4" />
                    Total Shares
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-500">{analyticsSummary?.totalShares || 0}</div>
                  <p className="text-xs text-muted-foreground">Last 30 days</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Bookmarks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-amber-500">{analyticsSummary?.totalBookmarks || 0}</div>
                  <p className="text-xs text-muted-foreground">Last 30 days</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Top Articles
                </CardTitle>
                <CardDescription>Most viewed articles in the last 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingAnalytics ? (
                  <div className="text-center py-8 text-muted-foreground">Loading analytics...</div>
                ) : !analyticsSummary?.topArticles?.length ? (
                  <div className="text-center py-8 text-muted-foreground">No analytics data yet. Views will appear here.</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Article</TableHead>
                        <TableHead className="text-right">Views</TableHead>
                        <TableHead className="text-right">Clicks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analyticsSummary.topArticles.map((article, i) => (
                        <TableRow key={article.article_id}>
                          <TableCell className="font-medium max-w-md truncate">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="flex-shrink-0">{i + 1}</Badge>
                              {article.article_title}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{article.view_count}</TableCell>
                          <TableCell className="text-right">{article.click_count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}