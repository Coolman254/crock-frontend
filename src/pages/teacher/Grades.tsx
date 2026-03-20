import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, Plus, Search, Users, BookOpen,
  GraduationCap, Award, Loader2, CheckCircle2, AlertCircle
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BottomNav } from "@/components/layout/BottomNav";
import { useRequireAuth } from "@/lib/auth";
import { teacherApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ── Helpers ───────────────────────────────────────────────────
const gradeColor = (s: number) =>
  s >= 80 ? "text-green-600 dark:text-green-400"
  : s >= 65 ? "text-blue-600 dark:text-blue-400"
  : s >= 50 ? "text-yellow-600 dark:text-yellow-400"
  : s >= 40 ? "text-orange-500"
  : "text-red-500";

const gradeBg = (s: number) =>
  s >= 80 ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
  : s >= 65 ? "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800"
  : s >= 50 ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800"
  : s >= 40 ? "bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800"
  : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800";

const gradeLetter = (s: number) =>
  s >= 90 ? "A" : s >= 80 ? "A-" : s >= 75 ? "B+" : s >= 70 ? "B"
  : s >= 65 ? "B-" : s >= 60 ? "C+" : s >= 55 ? "C" : s >= 50 ? "C-"
  : s >= 45 ? "D+" : s >= 40 ? "D" : "E";

const gradeLabel = (s: number) =>
  s >= 80 ? "Excellent" : s >= 65 ? "Good" : s >= 50 ? "Average"
  : s >= 40 ? "Below Average" : "Failing";

const TERMS      = ["Term 1", "Term 2", "Term 3"];
const EXAM_TYPES = ["End Term", "Mid Term", "CAT", "Assignment", "Project"];
const YEAR       = String(new Date().getFullYear());

const emptyForm = () => ({
  admissionNo: "", studentId: "",
  subject: "", score: "",
  term: "Term 1", year: YEAR,
  examType: "End Term", remarks: "",
});

export default function TeacherGrades() {
  const { user, loading: authLoading } = useRequireAuth("teacher");
  const navigate     = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast }    = useToast();

  const [grades, setGrades]           = useState<any[]>([]);
  const [students, setStudents]       = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);
  const [savedStudent, setSavedStudent] = useState<any>(null);
  const [showDialog, setShowDialog]   = useState(false);
  const [form, setForm]               = useState(emptyForm());
  const [inputMode, setInputMode]     = useState<"admission" | "select">("admission");
  const [admissionError, setAdmissionError] = useState("");
  const [filterTerm, setFilterTerm]   = useState("all");
  const [filterClass, setFilterClass] = useState(searchParams.get("class") || "all");
  const [search, setSearch]           = useState("");
  const [activeTab, setActiveTab]     = useState<"list" | "by-student">("list");

  const classes = [...new Set(students.map(s => s.class).filter(Boolean))].sort();

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [gradeRes, studentRes] = await Promise.all([
        teacherApi.getGrades(),
        teacherApi.getStudents(),
      ]);
      setGrades(gradeRes.data   ?? []);
      setStudents(studentRes.data ?? []);
    } catch (e: any) {
      toast({ title: "Error loading data", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) fetchAll();
  }, [authLoading, user, fetchAll]);

  const filtered = grades.filter(g => {
    const name = `${g.student?.firstName ?? ""} ${g.student?.lastName ?? ""}`.toLowerCase();
    const cls  = g.student?.class ?? "";
    if (filterTerm  !== "all" && g.term !== filterTerm) return false;
    if (filterClass !== "all" && cls   !== filterClass) return false;
    if (search &&
        !name.includes(search.toLowerCase()) &&
        !g.subject?.toLowerCase().includes(search.toLowerCase()) &&
        !g.student?.admissionNo?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const byStudent: Record<string, { student: any; grades: any[] }> = {};
  filtered.forEach(g => {
    const id = g.student?._id ?? "unknown";
    if (!byStudent[id]) byStudent[id] = { student: g.student, grades: [] };
    byStudent[id].grades.push(g);
  });

  const avg     = filtered.length ? Math.round(filtered.reduce((a, g) => a + g.score, 0) / filtered.length) : 0;
  const passing = filtered.filter(g => g.score >= 50).length;

  // ── Save grade ─────────────────────────────────────────────
  // The backend already scopes grades to the specific student via
  // studentId / admissionNo — students only see their own grades
  // because studentDashboardController filters by req.user._id.
  const handleSave = async () => {
    if (!form.subject || !form.score || !form.term || !form.year) {
      toast({ title: "Fill in all required fields", variant: "destructive" });
      return;
    }
    if (inputMode === "admission" && !form.admissionNo.trim()) {
      setAdmissionError("Admission number is required");
      return;
    }
    if (inputMode === "select" && !form.studentId) {
      toast({ title: "Please select a student", variant: "destructive" });
      return;
    }
    setSaving(true);
    setAdmissionError("");
    try {
      let result: any;
      if (inputMode === "admission") {
        result = await teacherApi.enterGradeByAdmission({
          admissionNo: form.admissionNo.trim(),
          subject:     form.subject,
          score:       Number(form.score),
          term:        form.term,
          year:        form.year,
          examType:    form.examType,
          remarks:     form.remarks,
        });
        setSavedStudent({
          name:        result.data?.studentName,
          admissionNo: result.data?.admissionNo,
          class:       result.data?.class,
        });
      } else {
        result = await teacherApi.enterGrade({
          studentId: form.studentId,
          subject:   form.subject,
          score:     Number(form.score),
          term:      form.term,
          year:      form.year,
          examType:  form.examType,
          remarks:   form.remarks,
        });
        const s = students.find(s => s._id === form.studentId);
        setSavedStudent(s ? {
          name:        `${s.firstName} ${s.lastName}`,
          admissionNo: s.admissionNo,
          class:       s.class,
        } : null);
      }
      setSaved(true);
      fetchAll();
      setTimeout(() => {
        setSaved(false);
        setSavedStudent(null);
        setForm(emptyForm());
        setShowDialog(false);
      }, 2000);
    } catch (e: any) {
      if (e.message?.includes("No student found")) {
        setAdmissionError(`No student with admission number "${form.admissionNo}"`);
      } else {
        toast({ title: "Error", description: e.message, variant: "destructive" });
      }
    } finally {
      setSaving(false);
    }
  };

  const selectedStudent = students.find(s => s._id === form.studentId);
  const sf = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="min-h-screen bg-background pb-24">

      {/* ── Header ── */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-3 pt-10 pb-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon"
                onClick={() => navigate("/teacher")}
                className="text-white hover:bg-white/20 -ml-1 h-9 w-9">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-lg font-bold leading-tight">Grades</h1>
                <p className="text-white/70 text-xs">{grades.length} records</p>
              </div>
            </div>
            <Button size="sm"
              onClick={() => { setForm(emptyForm()); setSaved(false); setAdmissionError(""); setShowDialog(true); }}
              className="bg-white text-emerald-700 hover:bg-white/90 font-semibold h-9 px-3 text-xs">
              <Plus className="h-3.5 w-3.5 mr-1" />Enter Grade
            </Button>
          </div>

          {/* Stats row — compact */}
          {!loading && grades.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-3">
              {[
                { label: "Shown",   value: filtered.length },
                { label: "Avg",     value: `${avg}%`       },
                { label: "Passing", value: `${filtered.length ? Math.round((passing / filtered.length) * 100) : 0}%` },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white/15 rounded-lg px-2 py-1.5 text-center">
                  <p className="text-base font-bold leading-tight">{value}</p>
                  <p className="text-white/70 text-[10px]">{label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-3 sm:px-6 py-4 space-y-3">

        {/* ── Search + filters — stacked on mobile ── */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9 h-10 text-sm"
              placeholder="Search name, adm no, subject…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Select value={filterTerm} onValueChange={setFilterTerm}>
              <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Term" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Terms</SelectItem>
                {TERMS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterClass} onValueChange={setFilterClass}>
              <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Class" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── Tabs ── */}
        <Tabs value={activeTab} onValueChange={v => setActiveTab(v as any)}>
          <TabsList className="w-full h-9">
            <TabsTrigger value="list" className="flex-1 text-xs">
              <BookOpen className="h-3 w-3 mr-1" />All Grades
            </TabsTrigger>
            <TabsTrigger value="by-student" className="flex-1 text-xs">
              <Users className="h-3 w-3 mr-1" />By Student
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* ── Content ── */}
        {loading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center space-y-2">
              <GraduationCap className="h-8 w-8 text-muted-foreground/40 mx-auto" />
              <p className="text-sm text-muted-foreground font-medium">No grades found</p>
              {grades.length === 0 && (
                <Button size="sm" onClick={() => { setForm(emptyForm()); setShowDialog(true); }}>
                  <Plus className="h-3.5 w-3.5 mr-1" />Enter First Grade
                </Button>
              )}
            </CardContent>
          </Card>
        ) : activeTab === "list" ? (
          <div className="space-y-2">
            {filtered.map(g => (
              <Card key={g._id} className={cn("border", gradeBg(g.score))}>
                <CardContent className="p-3 flex items-center gap-3">
                  {/* Grade circle */}
                  <div className={cn("flex-shrink-0 w-10 h-10 rounded-full border-2 flex flex-col items-center justify-center", gradeBg(g.score))}>
                    <span className={cn("text-sm font-bold leading-none", gradeColor(g.score))}>{gradeLetter(g.score)}</span>
                    <span className={cn("text-[9px] leading-none mt-0.5", gradeColor(g.score))}>{g.score}%</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate leading-tight">
                      {g.student?.firstName} {g.student?.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {g.subject} · {g.student?.admissionNo}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">{g.term}</Badge>
                      <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">{g.examType}</Badge>
                      {g.student?.class && (
                        <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">{g.student.class}</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {Object.values(byStudent).map(({ student, grades: sg }) => {
              const studentAvg = Math.round(sg.reduce((a, g) => a + g.score, 0) / sg.length);
              return (
                <Card key={student?._id} className="overflow-hidden">
                  <div className="bg-muted/40 px-3 py-2.5 flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">
                        {student?.firstName} {student?.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {student?.class} · #{student?.admissionNo}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <span className={cn("text-lg font-bold", gradeColor(studentAvg))}>{studentAvg}%</span>
                      <p className="text-[10px] text-muted-foreground">avg</p>
                    </div>
                  </div>
                  <CardContent className="p-0 divide-y">
                    {sg.map(g => (
                      <div key={g._id} className="px-3 py-2 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{g.subject}</p>
                          <p className="text-xs text-muted-foreground">{g.examType} · {g.term} {g.year}</p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className={cn("text-sm font-bold", gradeColor(g.score))}>{g.score}%</span>
                          <Badge variant="outline" className={cn("text-xs", gradeColor(g.score))}>
                            {gradeLetter(g.score)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Enter Grade Dialog — compact for mobile ── */}
      <Dialog open={showDialog} onOpenChange={v => {
        if (!saving) { setShowDialog(v); if (!v) { setForm(emptyForm()); setSaved(false); setAdmissionError(""); } }
      }}>
        {/* max-h + overflow so it scrolls on small screens */}
        <DialogContent className="w-[95vw] max-w-sm rounded-2xl p-0 gap-0 max-h-[90vh] flex flex-col">
          <DialogHeader className="px-4 pt-4 pb-2 flex-shrink-0">
            <DialogTitle className="flex items-center gap-2 text-base">
              <GraduationCap className="h-4 w-4 text-emerald-600" />
              Enter Grade
            </DialogTitle>
            <DialogDescription className="text-xs">
              Only the selected student will see this grade.
            </DialogDescription>
          </DialogHeader>

          {saved ? (
            <div className="py-8 flex flex-col items-center gap-3 text-center px-4">
              <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="h-7 w-7 text-green-600" />
              </div>
              <p className="font-semibold text-green-700 dark:text-green-400">Grade Saved!</p>
              {savedStudent && (
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">{savedStudent.name}</p>
                  <p className="text-xs">#{savedStudent.admissionNo} · {savedStudent.class}</p>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Scrollable body */}
              <div className="overflow-y-auto flex-1 px-4 py-2 space-y-3">

                {/* Mode toggle */}
                <div className="flex rounded-lg border overflow-hidden text-xs">
                  {(["admission", "select"] as const).map(mode => (
                    <button key={mode}
                      className={cn(
                        "flex-1 py-2 font-medium transition-colors",
                        inputMode === mode
                          ? "bg-emerald-600 text-white"
                          : "bg-background text-muted-foreground hover:bg-muted"
                      )}
                      onClick={() => { setInputMode(mode); setAdmissionError(""); }}>
                      {mode === "admission" ? "By Adm No." : "Select Student"}
                    </button>
                  ))}
                </div>

                {/* Student input */}
                {inputMode === "admission" ? (
                  <div className="space-y-1">
                    <Label className="text-xs">Admission No. *</Label>
                    <Input className={cn("h-9 text-sm uppercase", admissionError && "border-destructive")}
                      placeholder="e.g. ADM001"
                      value={form.admissionNo}
                      onChange={e => { sf("admissionNo", e.target.value); setAdmissionError(""); }} />
                    {admissionError && (
                      <p className="text-destructive text-xs flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />{admissionError}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Label className="text-xs">Student *</Label>
                    <Select value={form.studentId} onValueChange={v => sf("studentId", v)}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select student…" /></SelectTrigger>
                      <SelectContent>
                        {students.map(s => (
                          <SelectItem key={s._id} value={s._id}>
                            {s.firstName} {s.lastName}
                            <span className="text-muted-foreground text-xs ml-1">· {s.admissionNo}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedStudent && (
                      <p className="text-xs text-muted-foreground">
                        {selectedStudent.class} · #{selectedStudent.admissionNo}
                      </p>
                    )}
                  </div>
                )}

                {/* Subject + Score on same row */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Subject *</Label>
                    <Input className="h-9 text-sm" placeholder="Mathematics"
                      value={form.subject} onChange={e => sf("subject", e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Score (%) *</Label>
                    <Input className="h-9 text-sm" type="number" min={0} max={100} placeholder="0–100"
                      value={form.score} onChange={e => sf("score", e.target.value)} />
                  </div>
                </div>

                {/* Grade preview — compact */}
                {form.score !== "" && Number(form.score) >= 0 && (
                  <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg border text-sm", gradeBg(Number(form.score)))}>
                    <span className={cn("text-xl font-bold", gradeColor(Number(form.score)))}>{gradeLetter(Number(form.score))}</span>
                    <span className={cn("font-medium", gradeColor(Number(form.score)))}>{gradeLabel(Number(form.score))}</span>
                    <span className="text-muted-foreground text-xs ml-auto">{form.score}%</span>
                  </div>
                )}

                {/* Term + Year */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Term *</Label>
                    <Select value={form.term} onValueChange={v => sf("term", v)}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>{TERMS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Year *</Label>
                    <Input className="h-9 text-sm" value={form.year} onChange={e => sf("year", e.target.value)} />
                  </div>
                </div>

                {/* Exam type */}
                <div className="space-y-1">
                  <Label className="text-xs">Exam Type</Label>
                  <Select value={form.examType} onValueChange={v => sf("examType", v)}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>{EXAM_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>

                {/* Remarks */}
                <div className="space-y-1">
                  <Label className="text-xs">Remarks <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <Input className="h-9 text-sm" placeholder="e.g. Keep it up!"
                    value={form.remarks} onChange={e => sf("remarks", e.target.value)} />
                </div>
              </div>

              {/* Footer — always visible */}
              <DialogFooter className="px-4 py-3 border-t flex-shrink-0 flex gap-2">
                <Button variant="outline" className="flex-1 h-9 text-sm"
                  onClick={() => setShowDialog(false)} disabled={saving}>
                  Cancel
                </Button>
                <Button className="flex-1 h-9 text-sm bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={handleSave}
                  disabled={saving || !form.subject || !form.score ||
                    (inputMode === "admission" ? !form.admissionNo : !form.studentId)}>
                  {saving
                    ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Saving…</>
                    : <><CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />Save Grade</>}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <BottomNav role="teacher" />
    </div>
  );
}
