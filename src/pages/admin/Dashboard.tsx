import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Users, GraduationCap, UserCheck, Bell, TrendingUp, DollarSign, ArrowUpRight } from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useRequireAuth } from "@/lib/auth";
import { auth as authApi, financeApi, announcementApi, studentCrudApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function AdminDashboard() {
  const { user, loading: authLoading } = useRequireAuth("admin");
  const { toast } = useToast();
  const [counts, setCounts] = useState({ students: 0, teachers: 0, parents: 0, announcements: 0 });
  const [finStats, setFinStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;
    Promise.all([
      studentCrudApi.getAll(),
      authApi.getUsers("teacher"),
      authApi.getUsers("parent"),
      announcementApi.getAll(),
      financeApi.getStats(),
    ]).then(([s, t, p, a, f]) => {
      const students = Array.isArray(s) ? s : s.data ?? [];
      setCounts({
        students: students.length,
        teachers: t.data?.length || 0,
        parents: p.data?.length || 0,
        announcements: a.data?.length || 0,
      });
      setFinStats(f.data);
    }).catch((e) => toast({ title: "Error", description: e.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [authLoading, user]);

  const statCards = [
    { label: "Students",      value: counts.students,      icon: GraduationCap, gradient: "from-blue-500 to-indigo-600",   link: "/admin/students" },
    { label: "Teachers",      value: counts.teachers,      icon: UserCheck,     gradient: "from-emerald-500 to-teal-600",  link: "/admin/teachers" },
    { label: "Parents",       value: counts.parents,       icon: Users,         gradient: "from-orange-500 to-amber-500",  link: "/admin/parents" },
    { label: "Announcements", value: counts.announcements, icon: Bell,          gradient: "from-violet-500 to-purple-600", link: "/admin/announcements" },
  ];

  const collected   = finStats?.totalCollected ?? 0;
  const expected    = finStats?.totalExpected ?? 1;
  const feePercent  = Math.min(100, Math.round((collected / expected) * 100));

  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-6 animate-fade-in">

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {loading
            ? [...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
            : statCards.map(({ label, value, icon: Icon, gradient, link }) => (
              <Link key={label} to={link}>
                <Card className="border-0 shadow-card card-lift overflow-hidden">
                  <CardContent className="p-4">
                    <div className={`inline-flex p-2.5 rounded-xl bg-gradient-to-br ${gradient} mb-3`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <p className="text-2xl font-bold">{value}</p>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-sm text-muted-foreground">{label}</p>
                      <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
        </div>

        {/* ── Finance Summary ── */}
        {!loading && finStats && (
          <Card className="border-0 shadow-card overflow-hidden">
            <div className="gradient-admin px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <DollarSign className="h-5 w-5" />
                <h2 className="font-bold">Finance Overview</h2>
              </div>
              <Link to="/admin/finance" className="text-white/80 hover:text-white text-xs font-medium flex items-center gap-1">
                Details <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Expected",    value: finStats.totalExpected,  color: "text-foreground" },
                  { label: "Collected",   value: finStats.totalCollected, color: "text-emerald-600" },
                  { label: "Outstanding", value: finStats.totalBalance,   color: "text-red-500" },
                ].map(({ label, value, color }) => (
                  <div key={label}>
                    <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
                    <p className={cn("font-bold text-base", color)}>
                      KSH {(value ?? 0).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Collection Rate</span>
                  <span className="font-semibold text-foreground">{feePercent}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-700"
                    style={{ width: `${feePercent}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Quick Links ── */}
        <div>
          <h2 className="font-bold text-sm text-muted-foreground uppercase tracking-wide mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: "Add Student",  to: "/admin/add-student",  gradient: "from-blue-500 to-indigo-500" },
              { label: "Add Teacher",  to: "/admin/add-teacher",  gradient: "from-emerald-500 to-teal-500" },
              { label: "Add User",     to: "/admin/add-user",     gradient: "from-violet-500 to-purple-500" },
              { label: "Announcements",to: "/admin/announcements",gradient: "from-orange-500 to-amber-500" },
              { label: "Finance",      to: "/admin/finance",      gradient: "from-red-500 to-rose-500" },
              { label: "Reports",      to: "/admin/reports",      gradient: "from-pink-500 to-fuchsia-500" },
            ].map(({ label, to, gradient }) => (
              <Link key={label} to={to}>
                <div className={`bg-gradient-to-br ${gradient} text-white rounded-xl px-4 py-3 text-sm font-semibold card-lift shadow-sm flex items-center justify-between`}>
                  {label}
                  <ArrowUpRight className="h-4 w-4 opacity-70" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
