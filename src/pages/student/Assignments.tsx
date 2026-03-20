import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Upload, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/layout/BottomNav";
import { useRequireAuth } from "@/lib/auth";
import { studentApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

function toArr(res: any): any[] {
  if (Array.isArray(res))             return res;
  if (Array.isArray(res?.data))       return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  return [];
}

export default function StudentAssignments() {
  const { user, loading: authLoading } = useRequireAuth("student");
  const navigate = useNavigate();
  const { toast } = useToast();

  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [selected, setSelected]       = useState<any>(null);
  const [answer, setAnswer]           = useState("");
  const [file, setFile]               = useState<File | null>(null);
  const [submitting, setSubmitting]   = useState(false);

  // ── Fetch assignments ──────────────────────────────────────
  // calls GET /api/student-dashboard/assignments
  // backend auto-filters by the logged-in student's class
  const fetchAssignments = () => {
    setLoading(true);
    studentApi
      .getAssignments()
      .then(r => setAssignments(toArr(r)))
      .catch(e => toast({ title: "Error", description: e.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!authLoading && user) fetchAssignments();
  }, [authLoading, user]);

  // ── Submit assignment ──────────────────────────────────────
  // calls POST /api/student-dashboard/assignments/:id/submit (multipart)
  const handleSubmit = async () => {
    if (!selected) return;
    setSubmitting(true);
    const fd = new FormData();
    fd.append("answer", answer);
    if (file) fd.append("file", file);

    try {
      const r = await studentApi.submitAssignment(selected._id, fd);
      // Accept: { success: true } | { _id: "..." } | any non-error object
      const failed =
        r?.success === false ||
        (r?.message && !r?._id && r?.success !== true);

      if (failed) {
        toast({ title: "Error", description: r?.message ?? "Submission failed", variant: "destructive" });
      } else {
        toast({ title: "Submitted!", description: "Assignment submitted successfully." });
        setSelected(null);
        setAnswer("");
        setFile(null);
        fetchAssignments();
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Group assignments ──────────────────────────────────────
  const now = new Date();
  const overdue   = assignments.filter(a => !a.submitted && new Date(a.dueDate) < now);
  const upcoming  = assignments.filter(a => !a.submitted && new Date(a.dueDate) >= now);
  const submitted = assignments.filter(a => a.submitted);

  return (
    <div className="min-h-screen bg-background pb-24">

      {/* Header */}
      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white px-4 pt-10 pb-5 sm:px-6">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/student")}
            className="text-white hover:bg-white/20 -ml-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Assignments</h1>
        </div>
      </div>

      {/* List */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5 space-y-5">
        {loading ? (
          [...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)
        ) : (
          <>
            {overdue.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-red-500 mb-2 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" /> Overdue ({overdue.length})
                </h2>
                <div className="space-y-2">
                  {overdue.map(a => <AssignmentCard key={a._id} a={a} onSelect={setSelected} />)}
                </div>
              </section>
            )}

            {upcoming.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> Upcoming ({upcoming.length})
                </h2>
                <div className="space-y-2">
                  {upcoming.map(a => <AssignmentCard key={a._id} a={a} onSelect={setSelected} />)}
                </div>
              </section>
            )}

            {submitted.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Submitted ({submitted.length})
                </h2>
                <div className="space-y-2">
                  {submitted.map(a => <AssignmentCard key={a._id} a={a} onSelect={setSelected} />)}
                </div>
              </section>
            )}

            {assignments.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No assignments found for your class yet.
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      {/* Detail / Submit dialog */}
      <Dialog open={!!selected} onOpenChange={o => !o && setSelected(null)}>
        <DialogContent className="w-[95vw] max-w-lg">
          <DialogHeader>
            <DialogTitle className="pr-6">{selected?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground space-y-1">
              <p>
                <span className="font-medium text-foreground">Subject:</span>{" "}
                {selected?.subject}
                {selected?.class && (
                  <> · <span className="font-medium text-foreground">Class:</span> {selected.class}</>
                )}
              </p>
              <p>
                <span className="font-medium text-foreground">Due:</span>{" "}
                {selected && new Date(selected.dueDate).toLocaleDateString("en-KE", {
                  weekday: "short", day: "numeric", month: "short", year: "numeric",
                })}
              </p>
              {selected?.term && (
                <p>
                  <span className="font-medium text-foreground">Term:</span> {selected.term}
                </p>
              )}
              {selected?.description && (
                <div className="mt-2 p-3 bg-muted rounded-lg">
                  <p className="font-medium text-foreground mb-1">Instructions</p>
                  <p>{selected.description}</p>
                </div>
              )}
            </div>

            {selected?.submitted ? (
              <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 rounded-lg p-3">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-medium">Already submitted</span>
              </div>
            ) : (
              <>
                <Textarea
                  placeholder="Type your answer here..."
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  rows={4}
                />
                <label className="flex items-center gap-2 text-sm cursor-pointer border rounded-lg p-2 hover:bg-muted/50 transition-colors">
                  <Upload className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground truncate">
                    {file ? file.name : "Attach file (optional)"}
                  </span>
                  <input type="file" className="hidden"
                    onChange={e => setFile(e.target.files?.[0] ?? null)} />
                </label>
                <Button className="w-full" onClick={handleSubmit}
                  disabled={submitting || (!answer.trim() && !file)}>
                  {submitting ? "Submitting..." : "Submit Assignment"}
                </Button>
              </>
            )}
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
          <p className="text-xs text-muted-foreground">
            {a.subject} · Due {new Date(a.dueDate).toLocaleDateString()}
          </p>
          {a.term && <p className="text-xs text-muted-foreground">{a.term}</p>}
        </div>
        <Badge
          variant={a.submitted ? "default" : isOverdue ? "destructive" : "secondary"}
          className="flex-shrink-0"
        >
          {a.submitted ? "Done" : isOverdue ? "Overdue" : "Pending"}
        </Badge>
      </CardContent>
    </Card>
  );
}
