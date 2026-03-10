import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen, TrendingUp, ClipboardList, Bell, LogOut,
  GraduationCap, DollarSign, FileText, Package,
  ChevronRight, Award, Zap
} from "lucide-react";
import { BottomNav } from "@/components/layout/BottomNav";
import { useRequireAuth, useSignOut } from "@/lib/auth";
import { studentApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function StudentDashboard() {
  const { user, loading: authLoading } = useRequireAuth("student");
  const signOut = useSignOut();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;
    studentApi.getDashboard()
      .then((r) => setData(r.data))
      .catch((e) => toast({ title: "Error", description: e.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [authLoading, user]);

  if (authLoading || loading) return (
    <div className="min-h-screen mesh-bg p-4 pb-20">
      <div className="max-w-2xl mx-auto space-y-4 pt-6">
        <Skeleton className="h-32 w-full rounded-2xl" />
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
      </div>
    </div>
  );

  const student = data?.student;
  const stats = data?.stats;
  const finance = data?.finance;
  const announcements = data?.announcements || [];
  const assignments = data?.upcomingAssignments || [];
  const feePercent = finance?.totalFees > 0 ? Math.min(100, Math.round((finance.amountPaid / finance.totalFees) * 100)) : 100;

  return (
    <div className="min-h-screen mesh-bg pb-24">
      {/* ── Hero Header ── */}
      <div className="gradient-student text-white px-4 pt-10 pb-8 sm:px-6 relative overflow-hidden">
        {/* decorative circles */}
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute top-4 right-16 w-20 h-20 rounded-full bg-white/5" />
        <div className="absolute -bottom-6 left-8 w-28 h-28 rounded-full bg-white/8" />

        <div className="max-w-2xl mx-auto relative">
          <div className="flex items-start justify-between">
            <div className="animate-slide-up">
              <p className="text-white/70 text-sm font-medium">Good day,</p>
              <h1 className="text-2xl sm:text-3xl font-bold mt-0.5 tracking-tight">
                {student?.fullName || user?.name} 👋
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <span className="bg-white/20 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                  {student?.class}
                </span>
                <span className="bg-white/20 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                  Adm #{student?.admissionNo}
                </span>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={signOut}
              className="text-white hover:bg-white/20 rounded-xl">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>

          {/* Quick stats in header */}
          <div className="grid grid-cols-3 gap-2 mt-5">
            {[
              { label: "Average", value: `${stats?.average ?? 0}%`, icon: TrendingUp },
              { label: "Pending", value: stats?.pendingAssignments ?? 0, icon: ClipboardList },
              { label: "Subjects", value: stats?.subjectCount ?? 0, icon: BookOpen },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="bg-white/15 backdrop-blur-sm rounded-xl px-3 py-2.5 text-center">
                <Icon className="h-4 w-4 mx-auto mb-1 text-white/80" />
                <p className="text-lg font-bold text-white">{value}</p>
                <p className="text-white/65 text-[11px]">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5 space-y-4">

        {/* ── Quick Actions ── */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "My Grades", icon: Award, to: "/student/grades", gradient: "from-violet-500 to-purple-600" },
            { label: "Assignments", icon: ClipboardList, to: "/student/assignments", gradient: "from-blue-500 to-cyan-500" },
            { label: "Materials", icon: Package, to: "/student/materials", gradient: "from-emerald-500 to-teal-500" },
            { label: "Finance", icon: DollarSign, to: "/student/finance", gradient: "from-orange-500 to-amber-500" },
          ].map(({ label, icon: Icon, to, gradient }) => (
            <Link key={label} to={to}>
              <div className={`bg-gradient-to-br ${gradient} text-white rounded-2xl p-4 flex items-center gap-3 card-lift shadow-md`}>
                <div className="bg-white/20 rounded-xl p-2">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="font-semibold text-sm">{label}</span>
                <ChevronRight className="h-4 w-4 ml-auto opacity-70" />
              </div>
            </Link>
          ))}
        </div>

        {/* ── Fee Status ── */}
        <Card className="border-0 shadow-card overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <DollarSign className="h-4 w-4" />
                <span className="font-semibold text-sm">Fee Status</span>
              </div>
              <span className="text-white font-bold text-sm">{feePercent}% paid</span>
            </div>
            <div className="px-4 py-3 space-y-2">
              <Progress value={feePercent} className="h-2.5 rounded-full" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Paid: <span className="font-semibold text-foreground">KSH {finance?.amountPaid?.toLocaleString() ?? 0}</span></span>
                <span>Balance: <span className={`font-semibold ${feePercent < 100 ? "text-orange-600" : "text-emerald-600"}`}>
                  KSH {((finance?.totalFees ?? 0) - (finance?.amountPaid ?? 0)).toLocaleString()}
                </span></span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Upcoming Assignments ── */}
        {assignments.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-sm flex items-center gap-2">
                <Zap className="h-4 w-4 text-violet-500" />Due Soon
              </h2>
              <Link to="/student/assignments" className="text-xs text-violet-600 font-medium">View all</Link>
            </div>
            <div className="space-y-2">
              {assignments.slice(0, 3).map((a: any) => (
                <Card key={a._id} className="border-0 shadow-card card-lift">
                  <CardContent className="p-3.5 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{a.title}</p>
                      <p className="text-xs text-muted-foreground">{a.subject}</p>
                    </div>
                    <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-0 text-[10px] shrink-0">
                      {new Date(a.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ── Announcements ── */}
        {announcements.length > 0 && (
          <div>
            <h2 className="font-bold text-sm flex items-center gap-2 mb-3">
              <Bell className="h-4 w-4 text-blue-500" />Announcements
            </h2>
            <div className="space-y-2">
              {announcements.slice(0, 3).map((a: any) => (
                <Card key={a._id} className="border-0 shadow-card border-l-4 border-l-blue-500">
                  <CardContent className="p-3.5">
                    <p className="font-semibold text-sm">{a.title}</p>
                    {a.body && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.body}</p>}
                    <p className="text-[10px] text-muted-foreground mt-1.5">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
      <BottomNav role="student" />
    </div>
  );
}
