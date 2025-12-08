import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PortfolioItem {
  id: string;
  vendor_id: string;
  title: string;
  description: string | null;
  category: string;
  before_image_url: string | null;
  after_image_url: string | null;
  project_id: string | null;
  client_name: string | null;
  completion_date: string | null;
  tags: string[] | null;
  is_featured: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreatePortfolioItemInput {
  title: string;
  description?: string;
  category: string;
  before_image_url?: string;
  after_image_url?: string;
  project_id?: string;
  client_name?: string;
  completion_date?: string;
  tags?: string[];
  is_featured?: boolean;
}

export function useVendorPortfolio(vendorId: string | undefined) {
  const queryClient = useQueryClient();

  const { data: items, isLoading, error } = useQuery({
    queryKey: ["vendor-portfolio", vendorId],
    queryFn: async () => {
      if (!vendorId) return [];
      
      const { data, error } = await supabase
        .from("vendor_portfolio_items")
        .select("id, vendor_id, title, description, category, before_image_url, after_image_url, project_id, client_name, completion_date, tags, is_featured, display_order, created_at, updated_at")
        .eq("vendor_id", vendorId)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as PortfolioItem[];
    },
    enabled: !!vendorId,
  });

  const addItem = useMutation({
    mutationFn: async (input: CreatePortfolioItemInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("vendor_portfolio_items")
        .insert({ ...input, vendor_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-portfolio"] });
      toast.success("Portfolio item added");
    },
    onError: (error) => {
      toast.error(`Failed to add item: ${error.message}`);
    },
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PortfolioItem> & { id: string }) => {
      const { data, error } = await supabase
        .from("vendor_portfolio_items")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-portfolio"] });
      toast.success("Portfolio item updated");
    },
    onError: (error) => {
      toast.error(`Failed to update item: ${error.message}`);
    },
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("vendor_portfolio_items")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-portfolio"] });
      toast.success("Portfolio item deleted");
    },
    onError: (error) => {
      toast.error(`Failed to delete item: ${error.message}`);
    },
  });

  const uploadImage = async (file: File, type: "before" | "after"): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/${type}_${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("vendor_portfolio")
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from("vendor_portfolio")
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  return {
    items: items || [],
    loading: isLoading,
    error,
    addItem: addItem.mutateAsync,
    updateItem: updateItem.mutateAsync,
    deleteItem: deleteItem.mutateAsync,
    uploadImage,
    isAdding: addItem.isPending,
    isUpdating: updateItem.isPending,
    isDeleting: deleteItem.isPending,
  };
}