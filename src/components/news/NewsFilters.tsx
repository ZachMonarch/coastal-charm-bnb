import { Search, Globe, Grid, List } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type NewsCategory = 'all' | 'property' | 'real-estate' | 'investment' | 'careers' | 'legal' | 'technology';
export type NewsRegion = 'global' | 'north-america' | 'europe' | 'asia' | 'middle-east' | 'africa' | 'oceania';

interface NewsFiltersProps {
  category: NewsCategory;
  onCategoryChange: (category: NewsCategory) => void;
  region: NewsRegion;
  onRegionChange: (region: NewsRegion) => void;
  searchTerm: string;
  onSearchChange: (search: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
}

const categories: { id: NewsCategory; label: string }[] = [
  { id: 'all', label: 'All Topics' },
  { id: 'property', label: 'Property Management' },
  { id: 'real-estate', label: 'Real Estate Market' },
  { id: 'investment', label: 'Investment' },
  { id: 'careers', label: 'Careers' },
  { id: 'legal', label: 'Legal & Compliance' },
  { id: 'technology', label: 'PropTech' },
];

const regions: { id: NewsRegion; label: string; flag: string }[] = [
  { id: 'global', label: 'Global', flag: '🌍' },
  { id: 'north-america', label: 'North America', flag: '🇺🇸' },
  { id: 'europe', label: 'Europe', flag: '🇪🇺' },
  { id: 'asia', label: 'Asia Pacific', flag: '🌏' },
  { id: 'middle-east', label: 'Middle East', flag: '🇦🇪' },
  { id: 'africa', label: 'Africa', flag: '🌍' },
  { id: 'oceania', label: 'Oceania', flag: '🇦🇺' },
];

export function NewsFilters({
  category,
  onCategoryChange,
  region,
  onRegionChange,
  searchTerm,
  onSearchChange,
  viewMode,
  onViewModeChange,
}: NewsFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Search and controls row */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search news articles, topics, sources..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-12 bg-card"
          />
        </div>

        {/* Region selector */}
        <Select value={region} onValueChange={(v) => onRegionChange(v as NewsRegion)}>
          <SelectTrigger className="w-full md:w-[200px] h-12">
            <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Select region" />
          </SelectTrigger>
          <SelectContent>
            {regions.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                <span className="flex items-center gap-2">
                  <span>{r.flag}</span>
                  <span>{r.label}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* View mode toggle */}
        <div className="flex border rounded-lg p-1 bg-card">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => onViewModeChange('grid')}
            className="h-10 w-10"
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => onViewModeChange('list')}
            className="h-10 w-10"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Category tabs */}
      <Tabs value={category} onValueChange={(v) => onCategoryChange(v as NewsCategory)} className="w-full">
        <TabsList variant="pills" className="w-full h-auto flex-wrap justify-start">
          {categories.map((cat) => (
            <TabsTrigger
              key={cat.id}
              value={cat.id}
              variant="pills"
            >
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
