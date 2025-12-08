import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

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

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const { data, error } = await supabase
          .from('properties')
          .select('id, title, address')
          .order('title')
          .limit(100)

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

  return (
    <div className="space-y-2">
      <Label htmlFor="property">Property</Label>
      <Select value={value} onValueChange={onChange} disabled={isLoading}>
        <SelectTrigger id="property">
          <SelectValue placeholder={isLoading ? 'Loading properties...' : 'Select a property'} />
        </SelectTrigger>
        <SelectContent>
          {properties.map((property) => (
            <SelectItem key={property.id} value={property.id.toString()}>
              {property.title} {property.address && `- ${property.address}`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
