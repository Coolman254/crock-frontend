// Teacher Finance — shows student fee clearance status (no monetary values)
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Search, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/layout/BottomNav";
import { useRequireAuth } from "@/lib/auth";
import { teacherApi, financeApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function TeacherFinance() {
  const { user, loading: authLoading } = useRequireAuth("teacher");
  const navigate = useNavigate();
  const { toast } = useToast();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (authLoading || !user) return;
    teacherApi.getStudents()
      .then(r => {
        const studs = r.data;
        // Fetch fee status for each student's class
        return Promise.all(studs.map(async (s: any) => {
          try {
            const fin = await financeApi.getStudentById(s._id).catch(() => null);
            return { ...s, feeStatus: fin?.data?.status || "unknown" };
          } catch { return { ...s, feeStatus: "unknown" }; }
        }));
      })
      .then(setStudents)
      .catch(e => toast({ title: "Error", description: e.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [authLoading, user]);

  const filtered = students.filter(s =>
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    s.admissionNo?.toLowerCase().includes(search.toLowerCase())
  );

  const statusColor: Record<string, any> = { cleared: "default", partial: "secondary", pending: "destructive", unknown: "outline" };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-4 pt-10 pb-5 sm:px-6">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/teacher")} className="text-white hover:bg-white/20 -ml-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Finance Clearance</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5 space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>You can see fee clearance status for your students. For details, contact the admin.</AlertDescription>
        </Alert>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search students..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {loading ? [...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />) :
          filtered.map(s => (
            <Card key={s._id}>
              <CardContent className="p-4 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-sm">{s.firstName} {s.lastName}</p>
                  <p className="text-xs text-muted-foreground">{s.admissionNo} · {s.class}</p>
                </div>
                <Badge variant={statusColor[s.feeStatus] || "outline"} className="capitalize text-xs flex-shrink-0">
                  {s.feeStatus}
                </Badge>
              </CardContent>
            </Card>
          ))
        }
      </div>
      <BottomNav role="teacher" />
    </div>
  );
}
