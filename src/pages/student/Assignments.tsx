import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ClipboardList, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/layout/BottomNav";
import { useRequireAuth } from "@/lib/auth";
import { studentApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function StudentAssignments() {
  const { user, loading: authLoading } = useRequireAuth("student");
  const navigate = useNavigate();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [answer, setAnswer] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchAssignments = () => {
    studentApi.getAssignments()
      .then((r) => setAssignments(r.data))
      .catch((e) => toast({ title: "Error", description: e.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (!authLoading && user) fetchAssignments(); }, [authLoading, user]);

  const handleSubmit = async () => {
    if (!selected) return;
    setSubmitting(true);
    const fd = new FormData();
    fd.append("answer", answer);
    if (file) fd.append("file", file);
    try {
      const r = await studentApi.submitAssignment(selected._id, fd);
      if (r.success) {
        toast({ title: "Submitted!", description: "Assignment submitted successfully." });
        setSelected(null); setAnswer(""); setFile(null);
        fetchAssignments();
      } else {
        toast({ title: "Error", description: r.message, variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const overdue = assignments.filter(a => !a.submitted && new Date(a.dueDate) < new Date());
  const upcoming = assignments.filter(a => !a.submitted && new Date(a.dueDate) >= new Date());
  const submitted = assignments.filter(a => a.submitted);

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-primary-foreground px-4 pt-10 pb-5 sm:px-6">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/student")} className="text-white hover:bg-white/20 -ml-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Assignments</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5 space-y-5">
        {loading ? [...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />) : (<>
          {overdue.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-red-500 mb-2">Overdue ({overdue.length})</h2>
              <div className="space-y-2">
                {overdue.map(a => <AssignmentCard key={a._id} a={a} onSelect={setSelected} />)}
              </div>
            </section>
          )}
          {upcoming.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground mb-2">Upcoming ({upcoming.length})</h2>
              <div className="space-y-2">
                {upcoming.map(a => <AssignmentCard key={a._id} a={a} onSelect={setSelected} />)}
              </div>
            </section>
          )}
          {submitted.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground mb-2">Submitted ({submitted.length})</h2>
              <div className="space-y-2">
                {submitted.map(a => <AssignmentCard key={a._id} a={a} onSelect={setSelected} />)}
              </div>
            </section>
          )}
          {assignments.length === 0 && (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No assignments found</CardContent></Card>
          )}
        </>)}
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="w-[95vw] max-w-lg">
          <DialogHeader><DialogTitle className="pr-6">{selected?.title}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground space-y-1">
              <p><b>Subject:</b> {selected?.subject} · <b>Class:</b> {selected?.class}</p>
              <p><b>Due:</b> {selected && new Date(selected.dueDate).toLocaleDateString()}</p>
              {selected?.description && <p><b>Instructions:</b> {selected.description}</p>}
            </div>
            {selected?.submitted ? (
              <Badge>Already Submitted</Badge>
            ) : (<>
              <Textarea placeholder="Your answer..." value={answer} onChange={e => setAnswer(e.target.value)} rows={4} />
              <label className="flex items-center gap-2 text-sm cursor-pointer border rounded-lg p-2 hover:bg-muted/50">
                <Upload className="h-4 w-4" />
                {file ? file.name : "Attach file (optional)"}
                <input type="file" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
              </label>
              <Button className="w-full" onClick={handleSubmit} disabled={submitting || (!answer.trim() && !file)}>
                {submitting ? "Submitting..." : "Submit Assignment"}
              </Button>
            </>)}
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav role="student" />
    </div>
  );
}

function AssignmentCard({ a, onSelect }: { a: any; onSelect: (a: any) => void }) {
  const isOverdue = !a.submitted && new Date(a.dueDate) < new Date();
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onSelect(a)}>
      <CardContent className="p-4 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{a.title}</p>
          <p className="text-xs text-muted-foreground">{a.subject} · Due {new Date(a.dueDate).toLocaleDateString()}</p>
        </div>
        <Badge variant={a.submitted ? "default" : isOverdue ? "destructive" : "secondary"} className="flex-shrink-0">
          {a.submitted ? "Done" : isOverdue ? "Overdue" : "Pending"}
        </Badge>
      </CardContent>
    </Card>
  );
}
