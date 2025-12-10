import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Building2,
  Briefcase,
  Clock,
  FileText,
  Activity,
  Pencil,
} from "lucide-react";
import { useTeamMember, useTeamMembers } from "@/hooks/useTeamMembers";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import LoadingSpinner from "@/components/LoadingSpinner";
import TeamMemberModal from "@/components/admin/TeamMemberModal";
import { useState } from "react";
import { format } from "date-fns";

export default function TeamMemberProfile() {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const [editModalOpen, setEditModalOpen] = useState(false);

  const { data: member, isLoading } = useTeamMember(memberId);
  const { updateMember, isUpdating } = useTeamMembers();

  // Fetch activity history (audit logs for this user)
  const { data: activityLogs } = useQuery({
    queryKey: ["team-member-activity", member?.user_id],
    queryFn: async () => {
      if (!member?.user_id) return [];
      
      const { data, error } = await supabase
        .from("audit_logs")
        .select("id, action, table_name, record_id, created_at, new_values")
        .eq("user_id", member.user_id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
    enabled: !!member?.user_id,
  });

  // Fetch project assignments
  const { data: projectAssignments } = useQuery({
    queryKey: ["team-member-projects", member?.user_id],
    queryFn: async () => {
      if (!member?.user_id) return [];
      
      const { data, error } = await supabase
        .from("project_assignments")
        .select(`
          id, status, assigned_at,
          project:projects(id, title, status, category)
        `)
        .eq("vendor_id", member.user_id)
        .order("assigned_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
    enabled: !!member?.user_id,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Team Member Not Found</h1>
        <Button onClick={() => navigate("/admin/team")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Team
        </Button>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      active: "bg-success/10 text-success border-success/30",
      inactive: "bg-muted text-muted-foreground",
      on_leave: "bg-warning/10 text-warning border-warning/30",
    };
    return (
      <Badge variant="outline" className={variants[status] || ""}>
        {status.replace("_", " ").charAt(0).toUpperCase() + status.slice(1).replace("_", " ")}
      </Badge>
    );
  };

  return (
    <>
      <Helmet>
        <title>{member.full_name} | Team Member Profile</title>
      </Helmet>

      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => navigate("/admin/team")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Team
        </Button>

        {/* Profile Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <Avatar className="h-24 w-24 border-4 border-primary/20">
                <AvatarImage src={member.avatar_url || ""} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                  {getInitials(member.full_name)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2">
                  <h1 className="text-2xl font-bold">{member.full_name}</h1>
                  {getStatusBadge(member.status)}
                </div>
                <p className="text-lg text-muted-foreground mb-4">
                  {member.title || member.role}
                  {member.department && ` • ${member.department}`}
                </p>

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <a href={`mailto:${member.email}`} className="hover:text-primary">
                      {member.email}
                    </a>
                  </div>
                  {member.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <a href={`tel:${member.phone}`} className="hover:text-primary">
                        {member.phone}
                      </a>
                    </div>
                  )}
                  {member.hire_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Hired {format(new Date(member.hire_date), "MMM d, yyyy")}</span>
                    </div>
                  )}
                </div>
              </div>

              <Button onClick={() => setEditModalOpen(true)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </div>

            {member.bio && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold mb-2">About</h3>
                <p className="text-muted-foreground">{member.bio}</p>
              </div>
            )}

            {member.skills && member.skills.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {member.skills.map((skill, i) => (
                    <Badge key={i} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="activity" className="space-y-4">
          <TabsList variant="default">
            <TabsTrigger variant="default" value="activity" className="gap-2">
              <Activity className="h-4 w-4" />
              Activity History
            </TabsTrigger>
            <TabsTrigger variant="default" value="projects" className="gap-2">
              <Briefcase className="h-4 w-4" />
              Project Assignments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Track actions and updates from this team member
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!activityLogs || activityLogs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No activity recorded yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activityLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-start gap-4 pb-4 border-b last:border-0"
                      >
                        <div className="p-2 rounded-full bg-primary/10">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">
                            {log.action.replace(/_/g, " ")}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {log.table_name && `on ${log.table_name}`}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(log.created_at), "MMM d, yyyy 'at' h:mm a")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projects">
            <Card>
              <CardHeader>
                <CardTitle>Project Assignments</CardTitle>
                <CardDescription>
                  Projects this team member is assigned to
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!projectAssignments || projectAssignments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No project assignments yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {projectAssignments.map((assignment: any) => (
                      <div
                        key={assignment.id}
                        className="flex items-center justify-between p-4 rounded-lg border"
                      >
                        <div>
                          <p className="font-medium">
                            {assignment.project?.title || "Unknown Project"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {assignment.project?.category}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {assignment.status}
                          </Badge>
                          {assignment.project && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                navigate(`/dashboard/projects/${assignment.project.id}`)
                              }
                            >
                              View
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Modal */}
      <TeamMemberModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        member={member}
        onSave={async (data) => {
          await updateMember({ id: member.id, ...data });
        }}
        isLoading={isUpdating}
      />
    </>
  );
}