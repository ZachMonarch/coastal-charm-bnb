-- Create project milestones table
CREATE TABLE public.project_milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue')),
  order_index INTEGER NOT NULL DEFAULT 0,
  completion_date TIMESTAMP WITH TIME ZONE,
  completed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create milestone deliverables table
CREATE TABLE public.milestone_deliverables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  milestone_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_url TEXT,
  file_size BIGINT,
  mime_type TEXT,
  uploaded_by UUID NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_approved BOOLEAN DEFAULT false,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestone_deliverables ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for project_milestones
CREATE POLICY "project_milestones_vendor_access" ON public.project_milestones
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = project_milestones.project_id 
    AND p.assigned_vendor_id = auth.uid()
  ) OR is_admin_user(auth.uid())
);

-- Create RLS policies for milestone_deliverables  
CREATE POLICY "milestone_deliverables_vendor_access" ON public.milestone_deliverables
FOR ALL USING (
  uploaded_by = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.project_milestones pm
    JOIN public.projects p ON p.id = pm.project_id
    WHERE pm.id = milestone_deliverables.milestone_id 
    AND (p.assigned_vendor_id = auth.uid() OR is_admin_user(auth.uid()))
  )
);

-- Add foreign key constraints
ALTER TABLE public.project_milestones 
ADD CONSTRAINT project_milestones_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

ALTER TABLE public.milestone_deliverables 
ADD CONSTRAINT milestone_deliverables_milestone_id_fkey 
FOREIGN KEY (milestone_id) REFERENCES public.project_milestones(id) ON DELETE CASCADE;

-- Add update trigger for milestones
CREATE TRIGGER update_project_milestones_updated_at
BEFORE UPDATE ON public.project_milestones
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for performance
CREATE INDEX idx_project_milestones_project_id ON public.project_milestones(project_id);
CREATE INDEX idx_project_milestones_status ON public.project_milestones(status);
CREATE INDEX idx_milestone_deliverables_milestone_id ON public.milestone_deliverables(milestone_id);

-- Insert sample milestones for existing projects
INSERT INTO public.project_milestones (project_id, name, description, due_date, amount, order_index, status)
SELECT 
  id as project_id,
  'Project Planning' as name,
  'Initial project planning and requirements gathering' as description,
  created_at + INTERVAL '1 week' as due_date,
  COALESCE(budget_min, 1000) * 0.2 as amount,
  1 as order_index,
  CASE 
    WHEN status = 'completed' THEN 'completed'
    WHEN status = 'in_progress' THEN 'in_progress' 
    ELSE 'pending'
  END as status
FROM public.projects 
WHERE assigned_vendor_id IS NOT NULL;

INSERT INTO public.project_milestones (project_id, name, description, due_date, amount, order_index, status)
SELECT 
  id as project_id,
  'Development Phase' as name,
  'Main development and implementation work' as description,
  created_at + INTERVAL '3 weeks' as due_date,
  COALESCE(budget_min, 1000) * 0.6 as amount,
  2 as order_index,
  CASE 
    WHEN status = 'completed' THEN 'completed'
    ELSE 'pending'
  END as status
FROM public.projects 
WHERE assigned_vendor_id IS NOT NULL;

INSERT INTO public.project_milestones (project_id, name, description, due_date, amount, order_index, status)
SELECT 
  id as project_id,
  'Final Delivery' as name,
  'Project completion and final deliverables' as description,
  COALESCE(deadline, created_at + INTERVAL '4 weeks') as due_date,
  COALESCE(budget_min, 1000) * 0.2 as amount,
  3 as order_index,
  CASE 
    WHEN status = 'completed' THEN 'completed'
    ELSE 'pending'
  END as status
FROM public.projects 
WHERE assigned_vendor_id IS NOT NULL;