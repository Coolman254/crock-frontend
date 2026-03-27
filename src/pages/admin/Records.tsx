import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Search, Plus, Trash2, GraduationCap, UserCheck, Users,
  Phone, Mail, BookOpen, Hash,
} from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useRequireAuth } from "@/lib/auth";
import { studentCrudApi, teacherCrudApi, parentCrudApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type RecordType = "students" | "teachers" | "parents";

const CONFIG: Record<RecordType, {
  title: string;
  addPath: string;
  icon: React.ElementType;
}> = {
  students: { title: "Students", addPath: "/admin/add-student", icon: GraduationCap },
  teachers: { title: "Teachers", addPath: "/admin/add-teacher", icon: UserCheck },
  parents:  { title: "Parents",  addPath: "/admin/add-parent",  icon: Users },
};

function StudentCard({ s, onDelete }: { s: any; onDelete: () => void }) {
  const balance = (s.totalFees ?? 0) - (s.amountPaid ?? 0);
  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
              <span className="text-purple-700 dark:text-purple-400 font-bold text-sm">
                {s.firstName?.[0]}{s.lastName?.[0]}
              </span>
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{s.firstName} {s.lastName}</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Hash className="h-3 w-3" />Adm {s.admissionNo}
                </span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">{s.class}</Badge>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">{s.gender}</Badge>
              </div>
              {s.email && (
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  <Mail className="h-3 w-3" />{s.email}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <Button variant="ghost" size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={onDelete}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
            <p className={cn("text-xs font-semibold", balance > 0 ? "text-orange-600" : "text-green-600")}>
              {balance > 0 ? `Owe KSH ${balance.toLocaleString()}` : "Cleared"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TeacherCard({ t, onDelete }: { t: any; onDelete: () => void }) {
  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
              <span className="text-blue-700 dark:text-blue-400 font-bold text-sm">
                {t.firstName?.[0]}{t.lastName?.[0]}
              </span>
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{t.firstName} {t.lastName}</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Hash className="h-3 w-3" />ID {t.teacherId}
                </span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">{t.subject}</Badge>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize">{t.employmentType}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                <Mail className="h-3 w-3" />{t.email}
              </p>
              {t.classesAssigned && (
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />{t.classesAssigned}
                </p>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
            onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ParentCard({ p, onDelete }: { p: any; onDelete: () => void }) {
  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
              <span className="text-green-700 dark:text-green-400 font-bold text-sm">
                {p.firstName?.[0]}{p.lastName?.[0]}
              </span>
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{p.firstName} {p.lastName}</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">{p.relationship}</Badge>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">{p.gender}</Badge>
              </div>
              {p.email && (
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  <Mail className="h-3 w-3" />{p.email}
                </p>
              )}
              {p.phone && (
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  <Phone className="h-3 w-3" />{p.phone}
                </p>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
            onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function RecordsPage() {
  useRequireAuth("admin");
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const type = (location.pathname.split("/admin/")[1] as RecordType) || "students";
  const cfg  = CONFIG[type] || CONFIG.students;
  const Icon = cfg.icon;

  const [records, setRecords]           = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting]         = useState(false);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      let res: any;
      if (type === "students")      res = await studentCrudApi.getAll();
      else if (type === "teachers") res = await teacherCrudApi.getAll();
      else                          res = await parentCrudApi.getAll();
      setRecords(Array.isArray(res) ? res : res.data ?? res.students ?? res.teachers ?? res.parents ?? []);
    } catch (e: any) {
      toast({ title: "Error loading records", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSearch("");
    fetchRecords();
  }, [type]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      // All three types now wired up correctly
      if (type === "students")      await studentCrudApi.delete(deleteTarget._id);
      else if (type === "teachers") await teacherCrudApi.delete(deleteTarget._id);
      else                          await parentCrudApi.delete(deleteTarget._id);

      toast({ title: "Deleted", description: `${deleteTarget.firstName} ${deleteTarget.lastName} removed.` });
      setDeleteTarget(null);
      fetchRecords();
    } catch (e: any) {
      toast({ title: "Delete failed", description: e.message, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const filtered = records.filter((r) => {
    const q    = search.toLowerCase();
    const name = `${r.firstName ?? ""} ${r.lastName ?? ""}`.toLowerCase();
    return (
      name.includes(q) ||
      r.email?.toLowerCase().includes(q) ||
      String(r.admissionNo ?? "").includes(q) ||
      String(r.teacherId  ?? "").includes(q) ||
      r.class?.toLowerCase().includes(q) ||
      r.subject?.toLowerCase().includes(q)
    );
  });

  return (
    <AdminLayout title={cfg.title}>
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-2 justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${cfg.title.toLowerCase()}…`}
              className="pl-9 h-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button onClick={() => navigate(cfg.addPath)} size="sm" className="h-10 shrink-0">
            <Plus className="h-4 w-4 mr-1.5" />Add {cfg.title.slice(0, -1)}
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          {loading ? "Loading…" : `${filtered.length} ${cfg.title.toLowerCase()} found`}
        </p>

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-14 text-center space-y-3">
              <Icon className="h-10 w-10 text-muted-foreground/40 mx-auto" />
              <p className="text-muted-foreground font-medium">No {cfg.title.toLowerCase()} found</p>
              {!search && (
                <Button size="sm" onClick={() => navigate(cfg.addPath)}>
                  <Plus className="h-4 w-4 mr-1.5" />Add First {cfg.title.slice(0, -1)}
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map((r) =>
              type === "students" ? (
                <StudentCard key={r._id} s={r} onDelete={() => setDeleteTarget(r)} />
              ) : type === "teachers" ? (
                <TeacherCard key={r._id} t={r} onDelete={() => setDeleteTarget(r)} />
              ) : (
                <ParentCard key={r._id} p={r} onDelete={() => setDeleteTarget(r)} />
              )
            )}
          </div>
        )}
      </div>

      {/* Delete confirm dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete record?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <b>{deleteTarget?.firstName} {deleteTarget?.lastName}</b>'s
              profile. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}