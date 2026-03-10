import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Search, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/layout/BottomNav";
import { useRequireAuth } from "@/lib/auth";
import { teacherApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function TeacherStudents() {
  const { user, loading: authLoading } = useRequireAuth("teacher");
  const navigate = useNavigate();
  const { toast } = useToast();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (authLoading || !user) return;
    teacherApi.getStudents()
      .then((r) => setStudents(r.data))
      .catch((e) => toast({ title: "Error", description: e.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [authLoading, user]);

  const filtered = students.filter(s =>
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    s.admissionNo?.toLowerCase().includes(search.toLowerCase())
  );

  const classes = [...new Set(students.map(s => s.class))];

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-4 pt-10 pb-5 sm:px-6">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/teacher")} className="text-white hover:bg-white/20 -ml-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">My Students</h1>
            <p className="text-white/70 text-sm">{students.length} students · {classes.join(", ")}</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search students..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {loading ? [...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />) :
          filtered.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No students found</CardContent></Card>
          ) : filtered.map((s) => (
            <Card key={s._id}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-semibold text-sm flex-shrink-0">
                  {s.firstName?.[0]}{s.lastName?.[0]}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm">{s.firstName} {s.lastName}</p>
                  <p className="text-xs text-muted-foreground">{s.admissionNo}</p>
                </div>
                <Badge variant="outline" className="ml-auto flex-shrink-0 text-xs">{s.class}</Badge>
              </CardContent>
            </Card>
          ))
        }
      </div>
      <BottomNav role="teacher" />
    </div>
  );
}
