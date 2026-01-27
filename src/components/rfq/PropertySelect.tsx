import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/integrations/supabase/client'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Search, Loader2 } from 'lucide-react'

interface Property {
  id: number
  title: string
  address: string
}

interface PropertySelectProps {
  value: string
  onChange: (value: string) => void
  error?: string
}

export const PropertySelect = ({ value, onChange, error }: PropertySelectProps) => {
  const [properties, setProperties] = useState<Property[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        // Fetch all properties with explicit columns (no SELECT *)
        // Use safe_property_listings for non-sensitive property data
        const { data, error } = await supabase
          .from('safe_property_listings')
          .select('id, title, address')
          .order('title')
          // No limit - fetch all for admin selection

        if (error) throw error
        
        setProperties(data || [])
      } catch (error) {
        console.error('Failed to fetch properties:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProperties()
  }, [])

  // Filter properties based on search query
  const filteredProperties = useMemo(() => {
    if (!searchQuery.trim()) return properties
    
    const query = searchQuery.toLowerCase()
    return properties.filter(property => 
      property.title?.toLowerCase().includes(query) ||
      property.address?.toLowerCase().includes(query)
    )
  }, [properties, searchQuery])

  // Find selected property to display in trigger
  const selectedProperty = useMemo(() => {
    return properties.find(p => p.id.toString() === value)
  }, [properties, value])

  return (
    <div className="space-y-2">
      <Label htmlFor="property">Property</Label>
      <Select value={value} onValueChange={onChange} disabled={isLoading}>
        <SelectTrigger id="property" className="w-full">
          <SelectValue placeholder={isLoading ? 'Loading properties...' : 'Select a property'}>
            {selectedProperty && (
              <span className="truncate">
                {selectedProperty.title} {selectedProperty.address && `- ${selectedProperty.address}`}
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          {/* Search input inside dropdown */}
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search properties..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {searchQuery ? 'No properties match your search' : 'No properties available'}
            </div>
          ) : (
            filteredProperties.map((property) => (
              <SelectItem key={property.id} value={property.id.toString()}>
                <span className="truncate">
                  {property.title} {property.address && `- ${property.address}`}
                </span>
              </SelectItem>
            ))
          )}
          
          {/* Show count */}
          {!isLoading && properties.length > 0 && (
            <div className="p-2 border-t text-xs text-muted-foreground text-center">
              {filteredProperties.length === properties.length 
                ? `${properties.length} properties available`
                : `Showing ${filteredProperties.length} of ${properties.length} properties`
              }
            </div>
          )}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
