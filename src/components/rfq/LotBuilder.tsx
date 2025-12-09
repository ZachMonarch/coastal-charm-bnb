import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Trash2, Plus } from 'lucide-react'
import { Label } from '@/components/ui/label'

interface Lot {
  title: string
  description: string
  quantity: number
  unit: string
}

interface LotBuilderProps {
  lots: Lot[]
  onChange: (lots: Lot[]) => void
  error?: string
}

export const LotBuilder = ({ lots, onChange, error }: LotBuilderProps) => {
  const [isImporting, setIsImporting] = useState(false)

  const addLot = () => {
    onChange([
      ...lots,
      { title: '', description: '', quantity: 1, unit: '' }
    ])
  }

  const removeLot = (index: number) => {
    onChange(lots.filter((_, i) => i !== index))
  }

  const updateLot = (index: number, field: keyof Lot, value: string | number) => {
    onChange(
      lots.map((lot, i) => 
        i === index ? { ...lot, [field]: value } : lot
      )
    )
  }

  const importFromCSV = async (file: File) => {
    try {
      setIsImporting(true)
      const text = await file.text()
      const rows = text.split('\n').filter(row => row.trim())
      
      const importedLots = rows.map(row => {
        const [title, description, quantity, unit] = row.split(',')
        return {
          title: title?.trim() || '',
          description: description?.trim() || '',
          quantity: parseInt(quantity?.trim() || '1', 10),
          unit: unit?.trim() || ''
        }
      })

      onChange([...lots, ...importedLots])
    } catch (error) {
      console.error('Failed to import CSV:', error)
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Lots</h3>
        <div className="flex gap-2">
          <input
            type="file"
            accept=".csv"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) importFromCSV(file)
            }}
            className="hidden"
            id="csv-upload"
          />
          <Button
            variant="outline"
            onClick={() => document.getElementById('csv-upload')?.click()}
            disabled={isImporting}
          >
            Import CSV
          </Button>
          <Button onClick={addLot}>
            <Plus className="mr-2 h-4 w-4" />
            Add Lot
          </Button>
        </div>
      </div>

      {error && (
        <p className="text-destructive text-sm">{error}</p>
      )}

      <div className="space-y-4">
        {lots.map((lot, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 space-y-4">
                  <div>
                    <Label htmlFor={`title-${index}`}>Title</Label>
                    <Input
                      id={`title-${index}`}
                      value={lot.title}
                      onChange={(e) => updateLot(index, 'title', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`description-${index}`}>Description</Label>
                    <Textarea
                      id={`description-${index}`}
                      value={lot.description}
                      onChange={(e) => updateLot(index, 'description', e.target.value)}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`quantity-${index}`}>Quantity</Label>
                      <Input
                        id={`quantity-${index}`}
                        type="number"
                        min={1}
                        value={lot.quantity}
                        onChange={(e) => updateLot(index, 'quantity', parseInt(e.target.value, 10))}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor={`unit-${index}`}>Unit</Label>
                      <Input
                        id={`unit-${index}`}
                        value={lot.unit}
                        onChange={(e) => updateLot(index, 'unit', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeLot(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}