-- Create projects table for project management (fixed data types)
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'in_progress', 'completed', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  category TEXT NOT NULL,
  skills_required TEXT[],
  budget_min DECIMAL(10,2),
  budget_max DECIMAL(10,2),
  deadline TIMESTAMP WITH TIME ZONE,
  preferred_start_date TIMESTAMP WITH TIME ZONE,
  location TEXT,
  property_id BIGINT REFERENCES public.properties(id), -- Fixed: using BIGINT instead of UUID
  created_by UUID NOT NULL REFERENCES auth.users(id),
  assigned_vendor_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Create policies for projects
CREATE POLICY "Admins can view all projects" 
ON public.projects 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Property managers can view projects they created" 
ON public.projects 
FOR SELECT 
USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Vendors can view assigned projects" 
ON public.projects 
FOR SELECT 
USING (auth.uid() = assigned_vendor_id OR auth.uid() = created_by OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create projects" 
ON public.projects 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'property_manager'));

CREATE POLICY "Admins and creators can update projects" 
ON public.projects 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin') OR auth.uid() = created_by);

CREATE POLICY "Admins can delete projects" 
ON public.projects 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'));

-- Create project_assignments table for vendor assignments
CREATE TABLE public.project_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES auth.users(id),
  assigned_by UUID NOT NULL REFERENCES auth.users(id),
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  hourly_rate DECIMAL(10,2),
  estimated_hours INTEGER,
  UNIQUE(project_id, vendor_id)
);

-- Enable RLS on project_assignments
ALTER TABLE public.project_assignments ENABLE ROW LEVEL SECURITY;

-- Create policies for project_assignments
CREATE POLICY "Users can view their assignments" 
ON public.project_assignments 
FOR SELECT 
USING (vendor_id = auth.uid() OR assigned_by = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create assignments" 
ON public.project_assignments 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'property_manager'));

CREATE POLICY "Admins can update assignments" 
ON public.project_assignments 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin') OR assigned_by = auth.uid());

-- Create trigger for automatic timestamp updates on projects
CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to get project statistics
CREATE OR REPLACE FUNCTION get_project_stats()
RETURNS TABLE (
  total_projects BIGINT,
  open_projects BIGINT,
  in_progress_projects BIGINT,
  completed_projects BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_projects,
    COUNT(*) FILTER (WHERE status = 'open') as open_projects,
    COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_projects,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_projects
  FROM public.projects;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;