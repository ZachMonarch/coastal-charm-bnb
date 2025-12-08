import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, User } from "lucide-react";
import { TeamMember, CreateTeamMemberInput } from "@/hooks/useTeamMembers";
import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const teamMemberSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  role: z.string().min(1, "Role is required"),
  department: z.string().optional(),
  title: z.string().optional(),
  bio: z.string().optional(),
  hire_date: z.string().optional(),
  status: z.enum(["active", "inactive", "on_leave"]).default("active"),
});

type FormData = z.infer<typeof teamMemberSchema>;

const ROLES = [
  "Property Manager",
  "Maintenance Technician",
  "Leasing Agent",
  "Administrator",
  "Accountant",
  "Customer Support",
  "IT Specialist",
  "Operations Manager",
];

const DEPARTMENTS = [
  "Operations",
  "Leasing",
  "Maintenance",
  "Administration",
  "Finance",
  "IT",
  "Customer Service",
];

interface TeamMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member?: TeamMember | null;
  onSave: (data: CreateTeamMemberInput) => Promise<void>;
  isLoading?: boolean;
}

export default function TeamMemberModal({
  open,
  onOpenChange,
  member,
  onSave,
  isLoading,
}: TeamMemberModalProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(member?.avatar_url || null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(teamMemberSchema),
    defaultValues: {
      full_name: member?.full_name || "",
      email: member?.email || "",
      phone: member?.phone || "",
      role: member?.role || "",
      department: member?.department || "",
      title: member?.title || "",
      bio: member?.bio || "",
      hire_date: member?.hire_date || "",
      status: member?.status || "active",
    },
  });

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const fileExt = file.name.split(".").pop();
      const fileName = `team/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      setAvatarUrl(data.publicUrl);
      toast.success("Avatar uploaded");
    } catch (error: any) {
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    await onSave({
      full_name: data.full_name,
      email: data.email,
      role: data.role,
      phone: data.phone,
      department: data.department,
      title: data.title,
      bio: data.bio,
      hire_date: data.hire_date,
      status: data.status,
      avatar_url: avatarUrl || undefined,
    });
    reset();
    setAvatarUrl(null);
    onOpenChange(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {member ? "Edit Team Member" : "Add Team Member"}
          </DialogTitle>
          <DialogDescription>
            {member
              ? "Update team member information"
              : "Add a new member to your team"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Avatar Upload */}
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-border">
              <AvatarImage src={avatarUrl || ""} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {watch("full_name") ? getInitials(watch("full_name")) : <User className="h-6 w-6" />}
              </AvatarFallback>
            </Avatar>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? "Uploading..." : "Upload Photo"}
              </Button>
            </div>
          </div>

          {/* Name & Email */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                {...register("full_name")}
                placeholder="John Doe"
              />
              {errors.full_name && (
                <p className="text-xs text-destructive">{errors.full_name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="john@example.com"
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>
          </div>

          {/* Phone & Title */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                {...register("phone")}
                placeholder="(555) 123-4567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                {...register("title")}
                placeholder="Senior Manager"
              />
            </div>
          </div>

          {/* Role & Department */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Role *</Label>
              <Select
                value={watch("role")}
                onValueChange={(value) => setValue("role", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="text-xs text-destructive">{errors.role.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Select
                value={watch("department") || ""}
                onValueChange={(value) => setValue("department", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Hire Date & Status */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="hire_date">Hire Date</Label>
              <Input
                id="hire_date"
                type="date"
                {...register("hire_date")}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={watch("status")}
                onValueChange={(value) =>
                  setValue("status", value as "active" | "inactive" | "on_leave")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="on_leave">On Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              {...register("bio")}
              placeholder="Brief description about the team member..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : member ? "Update" : "Add Member"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}