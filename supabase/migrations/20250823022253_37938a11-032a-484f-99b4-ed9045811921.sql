-- Fix security warnings by setting proper search path for functions
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix search path for get_project_stats function
CREATE OR REPLACE FUNCTION public.get_project_stats()
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;