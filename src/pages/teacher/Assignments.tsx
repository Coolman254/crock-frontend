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
import { ArrowLeft, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/layout/BottomNav";
import { useRequireAuth } from "@/lib/auth";
import { teacherApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function TeacherAssignments() {
  const { user, loading: authLoading } = useRequireAuth("teacher");
  const navigate = useNavigate();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({ title: "", subject: "", class: "", dueDate: "", description: "", term: "Term 1", year: String(new Date().getFullYear()) });

  const fetchAssignments = () => {
    teacherApi.getAssignments()
      .then(r => setAssignments(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (!authLoading && user) fetchAssignments(); }, [authLoading, user]);

  const handleCreate = async () => {
    try {
      await teacherApi.createAssignment(form);
      toast({ title: "Assignment created!" });
      setShowDialog(false);
      setForm({ title: "", subject: "", class: "", dueDate: "", description: "", term: "Term 1", year: String(new Date().getFullYear()) });
      fetchAssignments();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-4 pt-10 pb-5 sm:px-6">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/teacher")} className="text-white hover:bg-white/20 -ml-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Assignments</h1>
          </div>
          <Button size="sm" onClick={() => setShowDialog(true)} className="bg-white/20 hover:bg-white/30 text-white border-0">
            <Plus className="h-4 w-4 mr-1" />New
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5 space-y-3">
        {loading ? [...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />) :
          assignments.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No assignments yet. Create one!</CardContent></Card>
          ) : assignments.map((a) => (
            <Card key={a._id}>
              <CardContent className="p-4 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{a.subject} · {a.class}</p>
                  <p className="text-xs text-muted-foreground">Due: {new Date(a.dueDate).toLocaleDateString()}</p>
                </div>
                <Badge variant={new Date(a.dueDate) < new Date() ? "secondary" : "outline"} className="flex-shrink-0 text-xs">
                  {new Date(a.dueDate) < new Date() ? "Past" : "Active"}
                </Badge>
              </CardContent>
            </Card>
          ))
        }
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader><DialogTitle>New Assignment</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Title</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Subject</Label><Input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} /></div>
              <div><Label>Class</Label><Input value={form.class} placeholder="e.g. Form 2" onChange={e => setForm(f => ({ ...f, class: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Due Date</Label><Input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} /></div>
              <div>
                <Label>Term</Label>
                <Select value={form.term} onValueChange={v => setForm(f => ({ ...f, term: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["Term 1","Term 2","Term 3"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Description (optional)</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} /></div>
            <Button className="w-full" onClick={handleCreate} disabled={!form.title || !form.subject || !form.class || !form.dueDate}>Create Assignment</Button>
          </div>
        </DialogContent>
      </Dialog>
      <BottomNav role="teacher" />
    </div>
  );
}
