import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  Plus,
  Search,
  MoreVertical,
  Mail,
  Phone,
  Eye,
  Pencil,
  Trash2,
  LayoutGrid,
  List,
  Building2,
  UserCheck,
  UserX,
  Clock,
} from "lucide-react";
import { useTeamMembers, TeamMember, CreateTeamMemberInput } from "@/hooks/useTeamMembers";
import TeamMemberModal from "@/components/admin/TeamMemberModal";
import LoadingSpinner from "@/components/LoadingSpinner";
import PageHero from "@/components/shared/PageHero";
import StatsCard from "@/components/shared/StatsCard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const DEPARTMENTS = [
  "All Departments",
  "Operations",
  "Leasing",
  "Maintenance",
  "Administration",
  "Finance",
  "IT",
  "Customer Service",
];

export default function TeamManagement() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("All Departments");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [deletingMember, setDeletingMember] = useState<TeamMember | null>(null);

  const {
    members,
    loading,
    createMember,
    updateMember,
    deleteMember,
    isCreating,
    isUpdating,
    isDeleting,
  } = useTeamMembers({
    department: department !== "All Departments" ? department : undefined,
    search: search || undefined,
  });

  const handleSave = async (data: CreateTeamMemberInput) => {
    if (editingMember) {
      await updateMember({ id: editingMember.id, ...data });
    } else {
      await createMember(data);
    }
    setEditingMember(null);
  };

  const handleDelete = async () => {
    if (deletingMember) {
      await deleteMember(deletingMember.id);
      setDeletingMember(null);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusBadge = (status: TeamMember["status"]) => {
    const variants = {
      active: "bg-success/10 text-success border-success/30",
      inactive: "bg-muted text-muted-foreground border-muted",
      on_leave: "bg-warning/10 text-warning border-warning/30",
    };
    const labels = {
      active: "Active",
      inactive: "Inactive",
      on_leave: "On Leave",
    };
    return (
      <Badge variant="outline" className={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  // Stats calculations
  const activeCount = members.filter(m => m.status === 'active').length;
  const inactiveCount = members.filter(m => m.status === 'inactive').length;
  const onLeaveCount = members.filter(m => m.status === 'on_leave').length;

  return (
    <>
      <Helmet>
        <title>Team Management | Monarch Admin</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
        <div className="container mx-auto px-4 py-8 space-y-6">
          {/* Hero Section */}
          <PageHero
            title="Team Management"
            description="Manage your team members and their roles across departments"
            icon={Users}
            variant="gradient"
            actions={[
              { label: 'Add Team Member', href: '#', variant: 'default' },
            ]}
          />

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Total Members"
              value={members.length}
              icon={Users}
              color="info"
            />
            <StatsCard
              title="Active"
              value={activeCount}
              icon={UserCheck}
              color="success"
            />
            <StatsCard
              title="On Leave"
              value={onLeaveCount}
              icon={Clock}
              color="warning"
            />
            <StatsCard
              title="Inactive"
              value={inactiveCount}
              icon={UserX}
              color="error"
            />
          </div>

          {/* Filters */}
          <Card variant="glass" className="border-l-4 border-l-primary">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                  <Input
                    placeholder="Search by name or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    variant="colorful"
                    className="pl-10"
                  />
                </div>
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger className="w-full sm:w-48 border-2 border-secondary/30 focus:border-secondary">
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-1 border-2 border-primary/20 rounded-lg p-1 bg-primary/5">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="icon"
                    onClick={() => setViewMode("grid")}
                    className={viewMode === "grid" ? "bg-primary shadow-md" : ""}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="icon"
                    onClick={() => setViewMode("list")}
                    className={viewMode === "list" ? "bg-primary shadow-md" : ""}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
                <Button 
                  onClick={() => setModalOpen(true)} 
                  className="bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary shadow-lg shadow-primary/30 border-2 border-primary/50"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Member
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Loading */}
          {loading && (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          )}

          {/* Empty State */}
          {!loading && members.length === 0 && (
            <Card variant="gradient" className="text-center py-16">
              <CardContent>
                <div className="p-4 rounded-full bg-muted/50 w-fit mx-auto mb-4">
                  <Building2 className="h-16 w-16 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No team members found</h3>
                <p className="text-muted-foreground mb-6">
                  Add your first team member to get started
                </p>
                <Button onClick={() => setModalOpen(true)} className="shadow-md">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Team Member
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Grid View */}
          {!loading && members.length > 0 && viewMode === "grid" && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {members.map((member, index) => (
                <Card 
                  key={member.id} 
                  variant="interactive"
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 border-2 border-primary/20 shadow-md">
                          <AvatarImage src={member.avatar_url || ""} />
                          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-primary font-semibold">
                            {getInitials(member.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-base">{member.full_name}</CardTitle>
                          <CardDescription className="text-sm">
                            {member.title || member.role}
                          </CardDescription>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => navigate(`/admin/team/${member.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingMember(member);
                              setModalOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeletingMember(member)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(member.status)}
                      {member.department && (
                        <Badge variant="secondary" className="bg-secondary/10">
                          {member.department}
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5" />
                        <span className="truncate">{member.email}</span>
                      </div>
                      {member.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5" />
                          <span>{member.phone}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* List View */}
          {!loading && members.length > 0 && viewMode === "list" && (
            <Card variant="interactive">
              <div className="divide-y">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors border-l-2 border-l-transparent hover:border-l-primary"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10 border border-border shadow-sm">
                        <AvatarImage src={member.avatar_url || ""} />
                        <AvatarFallback className="bg-gradient-to-br from-primary/10 to-secondary/10 text-primary text-sm font-medium">
                          {getInitials(member.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.full_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {member.title || member.role}
                          {member.department && ` • ${member.department}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {getStatusBadge(member.status)}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/admin/team/${member.id}`)}
                      >
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <TeamMemberModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setEditingMember(null);
        }}
        member={editingMember}
        onSave={handleSave}
        isLoading={isCreating || isUpdating}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingMember}
        onOpenChange={() => setDeletingMember(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {deletingMember?.full_name}? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
