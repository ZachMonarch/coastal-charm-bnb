import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface TeamMember {
  id: string;
  user_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  role: string;
  department: string | null;
  title: string | null;
  avatar_url: string | null;
  bio: string | null;
  hire_date: string | null;
  status: "active" | "inactive" | "on_leave";
  skills: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTeamMemberInput {
  full_name: string;
  email: string;
  phone?: string;
  role: string;
  department?: string;
  title?: string;
  avatar_url?: string;
  bio?: string;
  hire_date?: string;
  status?: "active" | "inactive" | "on_leave";
  skills?: string[];
}

interface TeamMembersFilters {
  department?: string;
  status?: string;
  search?: string;
}

export function useTeamMembers(filters?: TeamMembersFilters) {
  const queryClient = useQueryClient();

  const { data: members, isLoading, error } = useQuery({
    queryKey: ["team-members", filters],
    queryFn: async () => {
      let query = supabase
        .from("team_members")
        .select("id, user_id, full_name, email, phone, role, department, title, avatar_url, bio, hire_date, status, skills, created_at, updated_at")
        .order("full_name", { ascending: true });

      if (filters?.department) {
        query = query.eq("department", filters.department);
      }
      if (filters?.status) {
        query = query.eq("status", filters.status);
      }
      if (filters?.search) {
        query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as TeamMember[];
    },
  });

  const createMember = useMutation({
    mutationFn: async (input: CreateTeamMemberInput) => {
      const { data, error } = await supabase
        .from("team_members")
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      toast.success("Team member added successfully");
    },
    onError: (error) => {
      toast.error(`Failed to add team member: ${error.message}`);
    },
  });

  const updateMember = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TeamMember> & { id: string }) => {
      const { data, error } = await supabase
        .from("team_members")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      toast.success("Team member updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update team member: ${error.message}`);
    },
  });

  const deleteMember = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("team_members")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      toast.success("Team member removed");
    },
    onError: (error) => {
      toast.error(`Failed to remove team member: ${error.message}`);
    },
  });

  return {
    members: members || [],
    loading: isLoading,
    error,
    createMember: createMember.mutateAsync,
    updateMember: updateMember.mutateAsync,
    deleteMember: deleteMember.mutateAsync,
    isCreating: createMember.isPending,
    isUpdating: updateMember.isPending,
    isDeleting: deleteMember.isPending,
  };
}

export function useTeamMember(memberId: string | undefined) {
  return useQuery({
    queryKey: ["team-member", memberId],
    queryFn: async () => {
      if (!memberId) return null;
      
      const { data, error } = await supabase
        .from("team_members")
        .select("id, user_id, full_name, email, phone, role, department, title, avatar_url, bio, hire_date, status, skills, created_at, updated_at")
        .eq("id", memberId)
        .single();

      if (error) throw error;
      return data as TeamMember;
    },
    enabled: !!memberId,
  });
}