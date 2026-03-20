import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Plus, FileText, Clock, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/layout/BottomNav";
import { useRequireAuth } from "@/lib/auth";
import { teacherApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

function toArr(res: any): any[] {
  if (Array.isArray(res))             return res;
  if (Array.isArray(res?.data))       return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  return [];
}

// Build a display name from however the backend populates the student field
function studentName(s: any): string {
  // populated object from controller: { firstName, lastName, admissionNo }
  if (s.student?.firstName) return `${s.student.firstName} ${s.student.lastName}`;
  // fallback flat fields
  if (s.studentName)        return s.studentName;
  if (s.student?.name)      return s.student.name;
  return "Unknown";
}

export default function TeacherAssignments() {
  // useRequireAuth returns a generic user object — cast to any to avoid
  // TS complaining about unknown properties like classesAssigned
  const { user, loading: authLoading } = useRequireAuth("teacher") as {
    user: any;
    loading: boolean;
  };
  const navigate = useNavigate();
  const { toast } = useToast();

  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [creating, setCreating]       = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [viewSubs, setViewSubs]       = useState<any>(null);
  const [subsLoading, setSubsLoading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    subject: "",
    class: "",
    dueDate: "",
    description: "",
    term: "Term 1",
    year: String(new Date().getFullYear()),
  });

  // ── Fetch assignments ──────────────────────────────────────
  const fetchAssignments = () => {
    setLoading(true);
    teacherApi
      .getAssignments()
      .then(r => setAssignments(toArr(r)))
      .catch(e => toast({ title: "Error", description: e.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!authLoading && user) fetchAssignments();
  }, [authLoading, user]);

  // ── Create assignment ──────────────────────────────────────
  const handleCreate = async () => {
    if (!form.title || !form.subject || !form.class || !form.dueDate) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await teacherApi.createAssignment(form);
      toast({ title: "Assignment created!", description: `Sent to class ${form.class}` });
      setCreating(false);
      setForm({
        title: "", subject: "", class: "", dueDate: "",
        description: "", term: "Term 1",
        year: String(new Date().getFullYear()),
      });
      fetchAssignments();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  // ── View submissions ───────────────────────────────────────
  const openSubmissions = async (a: any) => {
    setViewSubs(a);
    setSubsLoading(true);
    setSubmissions([]);
    try {
      const r = await teacherApi.getSubmissions(a._id);
      setSubmissions(toArr(r));
    } catch (e: any) {
      toast({ title: "Could not load submissions", description: e.message, variant: "destructive" });
    } finally {
      setSubsLoading(false);
    }
  };

  const isOverdue = (d: string) => new Date(d) < new Date();

  // classesAssigned is a comma-separated string from the Teacher model
  // e.g. "Form 1, Form 2"
  const classLabel: string = user?.classesAssigned ?? user?.class ?? "";

  return (
    <div className="min-h-screen bg-background pb-24">

      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-4 pt-10 pb-5 sm:px-6">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/teacher")}
              className="text-white hover:bg-white/20 -ml-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Assignments</h1>
              {/* ✅ fixed: was user?.class which doesn't exist on the JWT user type */}
              {classLabel && (
                <p className="text-white/70 text-xs flex items-center gap-1 mt-0.5">
                  <Users className="h-3 w-3" /> {classLabel}
                </p>
              )}
            </div>
          </div>
          <Button size="sm" onClick={() => setCreating(true)}
            className="bg-white/20 hover:bg-white/30 text-white border-0">
            <Plus className="h-4 w-4 mr-1" /> New
          </Button>
        </div>
      </div>

      {/* Assignment list */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5 space-y-3">
        {loading ? (
          [...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)
        ) : assignments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No assignments yet. Tap <strong>+ New</strong> to create one.
            </CardContent>
          </Card>
        ) : (
          assignments.map(a => (
            <Card key={a._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{a.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.subject} · Class {a.class}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Clock className="h-3 w-3" />
                    Due {new Date(a.dueDate).toLocaleDateString()}
                    {a.submissionCount != null && ` · ${a.submissionCount} submitted`}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant={isOverdue(a.dueDate) ? "secondary" : "outline"} className="text-xs">
                    {isOverdue(a.dueDate) ? "Past" : "Active"}
                  </Badge>
                  <Button size="sm" variant="outline" onClick={() => openSubmissions(a)}>
                    <FileText className="h-3.5 w-3.5 sm:mr-1" />
                    <span className="hidden sm:inline">Submissions</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create dialog */}
      <Dialog open={creating} onOpenChange={o => !o && setCreating(false)}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader><DialogTitle>New Assignment</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Title *</Label>
              <Input value={form.title} placeholder="e.g. Chapter 5 Questions"
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Subject *</Label>
                <Input value={form.subject} placeholder="e.g. Mathematics"
                  onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
              </div>
              <div>
                <Label>Class *</Label>
                <Input value={form.class} placeholder="e.g. Form 2"
                  onChange={e => setForm(f => ({ ...f, class: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Due Date *</Label>
                <Input type="date" value={form.dueDate}
                  onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
              </div>
              <div>
                <Label>Term</Label>
                <Select value={form.term} onValueChange={v => setForm(f => ({ ...f, term: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Term 1", "Term 2", "Term 3"].map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Instructions (optional)</Label>
              <Textarea value={form.description} rows={3}
                placeholder="Describe the assignment..."
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <Button className="w-full" onClick={handleCreate}
              disabled={submitting || !form.title || !form.subject || !form.class || !form.dueDate}>
              {submitting ? "Creating..." : "Create Assignment"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Submissions dialog */}
      <Dialog open={!!viewSubs} onOpenChange={o => !o && setViewSubs(null)}>
        <DialogContent className="w-[95vw] max-w-lg">
          <DialogHeader>
            <DialogTitle>Submissions — {viewSubs?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {subsLoading ? (
              [...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)
            ) : submissions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No submissions yet.
              </p>
            ) : (
              submissions.map(s => (
                <div key={s._id} className="border rounded-lg p-3 space-y-1">
                  <div className="flex justify-between items-center">
                    {/* ✅ fixed: controller populates firstName+lastName, not name */}
                    <span className="font-medium text-sm">{studentName(s)}</span>
                    <Badge className="text-xs">Submitted</Badge>
                  </div>
                  {s.student?.admissionNo && (
                    <p className="text-xs text-muted-foreground">
                      Adm: {s.student.admissionNo} · {s.student.class}
                    </p>
                  )}
                  {s.answer && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{s.answer}</p>
                  )}
                  {s.fileUrl && (
                    <a href={s.fileUrl} target="_blank" rel="noreferrer"
                      className="text-xs text-blue-500 underline">
                      View attached file
                    </a>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {new Date(s.submittedAt ?? s.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav role="teacher" />
    </div>
  );
}
