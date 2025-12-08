import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { logger } from "@/utils/logger";
import { CalendarIcon, Wrench, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/OptimizedAuthContext";
import { toast } from "sonner";
import { projectSchema } from "@/lib/validation/adminSchemas";
import { ZodError } from "zod";

interface AdminProjectCreationFormProps {
  onClose?: () => void;
  onSuccess?: () => void;
}

const projectTypes = [
  "Plumbing",
  "Electrical", 
  "HVAC",
  "Roofing",
  "Painting",
  "Flooring",
  "Carpentry",
  "Appliance Repair",
  "Landscaping",
  "General Maintenance",
  "Emergency Repair"
];

const priorities = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" }
];

export default function AdminProjectCreationForm({ onClose, onSuccess }: AdminProjectCreationFormProps) {
  const { user, hasRole } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Only admin users should be able to create projects
  if (!hasRole('admin')) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Access Restricted</h3>
          <p className="text-muted-foreground">
            Project creation is restricted to administrators only.
          </p>
          <div className="mt-4">
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    priority: "medium",
    budget_min: "",
    budget_max: "",
    location: "",
    preferred_start_date: undefined as Date | undefined,
    deadline: undefined as Date | undefined,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    setErrors({});
    
    try {
      // Validate form data
      const validatedData = projectSchema.parse({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        priority: formData.priority,
        budget_min: formData.budget_min ? parseFloat(formData.budget_min) : undefined,
        budget_max: formData.budget_max ? parseFloat(formData.budget_max) : undefined,
        location: formData.location || undefined,
        deadline: formData.deadline || new Date()
      });

      const { error } = await supabase
        .from('projects')
        .insert({
          created_by: user.id,
          title: validatedData.title,
          description: validatedData.description,
          category: validatedData.category,
          priority: validatedData.priority,
          budget_min: validatedData.budget_min,
          budget_max: validatedData.budget_max,
          location: validatedData.location,
          preferred_start_date: formData.preferred_start_date?.toISOString() || undefined,
          deadline: formData.deadline?.toISOString() || undefined,
          status: "open"
        });

      if (error) throw error;

      toast.success("Project created successfully!");
      onSuccess?.();
      onClose?.();
    } catch (error) {
      toast.error("Failed to create project");
      logger.error("Error creating project:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-primary" />
          Create New Project
        </CardTitle>
        <CardDescription>
          Create a new project for vendors to bid on (Admin Only)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="title">Project Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => updateFormData("title", e.target.value)}
                placeholder="e.g., Kitchen Plumbing Repair"
                className={errors.title ? 'border-red-500' : ''}
                required
                aria-invalid={!!errors.title}
                aria-describedby={errors.title ? 'title-error' : undefined}
              />
              {errors.title && (
                <p id="title-error" className="text-sm text-red-500 mt-1">{errors.title}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Project Category</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => updateFormData("category", value)}
                required
              >
                <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select project category" />
                </SelectTrigger>
                <SelectContent>
                  {projectTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-sm text-red-500 mt-1">{errors.category}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select 
                value={formData.priority} 
                onValueChange={(value) => updateFormData("priority", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map(priority => (
                    <SelectItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget_min">Minimum Budget</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="budget_min"
                  type="number"
                  value={formData.budget_min}
                  onChange={(e) => updateFormData("budget_min", e.target.value)}
                  placeholder="0"
                  className="pl-9"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget_max">Maximum Budget</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="budget_max"
                  type="number"
                  value={formData.budget_max}
                  onChange={(e) => updateFormData("budget_max", e.target.value)}
                  placeholder="0"
                  className="pl-9"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => updateFormData("location", e.target.value)}
                placeholder="e.g., Building A, Apt 101"
              />
            </div>

            <div className="space-y-2">
              <Label>Preferred Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.preferred_start_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.preferred_start_date ? format(formData.preferred_start_date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.preferred_start_date}
                    onSelect={(date) => updateFormData("preferred_start_date", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Deadline</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.deadline && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.deadline ? format(formData.deadline, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.deadline}
                    onSelect={(date) => updateFormData("deadline", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Project Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => updateFormData("description", e.target.value)}
              placeholder="Provide a detailed description of the work needed..."
              className="min-h-[120px]"
              required
            />
          </div>

          <div className="flex gap-2 justify-end">
            {onClose && (
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Project"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}