import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, ClipboardList, BookOpen, Bell, LogOut, Package, TrendingUp } from "lucide-react";
import { BottomNav } from "@/components/layout/BottomNav";
import { useRequireAuth, useSignOut } from "@/lib/auth";
import { teacherApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function TeacherDashboard() {
  const { user, loading: authLoading } = useRequireAuth("teacher");
  const signOut = useSignOut();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;
    teacherApi.getDashboard()
      .then((r) => setData(r.data))
      .catch((e) => toast({ title: "Error", description: e.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [authLoading, user]);

  if (authLoading || loading) return (
    <div className="min-h-screen bg-background p-4 pb-20">
      <div className="max-w-2xl mx-auto space-y-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
      </div>
    </div>
  );

  const teacher = data?.teacher;
  const stats = data?.stats;
  const tasks = data?.upcomingTasks || [];
  const announcements = data?.announcements || [];

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-4 pt-10 pb-6 sm:px-6">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-white/70 text-sm">Welcome,</p>
            <h1 className="text-xl sm:text-2xl font-bold">{teacher?.fullName || user?.name}</h1>
            <p className="text-white/70 text-sm mt-0.5">{teacher?.subject} · {teacher?.classesAssigned?.join(", ")}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={signOut} className="text-white hover:bg-white/20">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5 space-y-5">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Students", value: stats?.totalStudents ?? 0, icon: Users, color: "text-blue-500" },
            { label: "Classes", value: stats?.totalClasses ?? 0, icon: BookOpen, color: "text-emerald-500" },
            { label: "Assignments", value: stats?.totalAssignments ?? 0, icon: ClipboardList, color: "text-orange-500" },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="text-center p-3">
              <Icon className={`h-5 w-5 mx-auto mb-1 ${color}`} />
              <p className="text-lg font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "My Students", icon: Users, to: "/teacher/students" },
            { label: "Grades", icon: TrendingUp, to: "/teacher/grades" },
            { label: "Assignments", icon: ClipboardList, to: "/teacher/assignments" },
            { label: "Materials", icon: Package, to: "/teacher/materials" },
          ].map(({ label, icon: Icon, to }) => (
            <Button key={label} variant="outline" className="h-16 flex-col gap-1 text-sm" onClick={() => navigate(to)}>
              <Icon className="h-5 w-5" />
              {label}
            </Button>
          ))}
        </div>

        {tasks.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Upcoming Tasks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {tasks.map((t: any) => (
                <div key={t._id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{t.title}</p>
                    <p className="text-xs text-muted-foreground">{t.subject} · {t.class}</p>
                  </div>
                  <Badge variant={t.priority === "high" ? "destructive" : "secondary"} className="flex-shrink-0 ml-2 text-xs">
                    {t.due}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {announcements.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><Bell className="h-4 w-4" />Announcements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {announcements.slice(0, 3).map((a: any) => (
                <div key={a._id} className="py-2 border-b last:border-0">
                  <p className="font-medium text-sm">{a.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{a.body || a.content}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
      <BottomNav role="teacher" />
    </div>
  );
}
