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

// ── Grade colour helpers ────────────────────────────────────────────────────
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

const TERMS = ["Term 1", "Term 2", "Term 3"];
const EXAM_TYPES = ["End Term", "Mid Term", "CAT", "Assignment", "Project"];
const CURRENT_YEAR = String(new Date().getFullYear());

const emptyForm = () => ({
  // admission number mode
  admissionNo: "",
  // fallback dropdown mode
  studentId: "",
  subject: "", score: "",
  term: "Term 1", year: CURRENT_YEAR,
  examType: "End Term", remarks: ""
});

export default function TeacherGrades() {
  const { user, loading: authLoading } = useRequireAuth("teacher");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [grades, setGrades] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedStudent, setSavedStudent] = useState<any>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState(emptyForm());

  // ✅ Toggle between admission number input and dropdown select
  const [inputMode, setInputMode] = useState<"admission" | "select">("admission");
  const [admissionError, setAdmissionError] = useState("");

  const [filterTerm, setFilterTerm] = useState("all");
  const [filterClass, setFilterClass] = useState(searchParams.get("class") || "all");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"list" | "by-student">("list");

  const classes = [...new Set(students.map((s) => s.class).filter(Boolean))].sort();

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [gradeRes, studentRes] = await Promise.all([
        teacherApi.getGrades(),
        teacherApi.getStudents(),
      ]);
      setGrades(gradeRes.data ?? []);
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

  const filtered = grades.filter((g) => {
    const name = `${g.student?.firstName ?? ""} ${g.student?.lastName ?? ""}`.toLowerCase();
    const cls  = g.student?.class ?? "";
    if (filterTerm  !== "all" && g.term !== filterTerm)   return false;
    if (filterClass !== "all" && cls   !== filterClass)   return false;
    if (search && !name.includes(search.toLowerCase()) &&
        !g.subject?.toLowerCase().includes(search.toLowerCase()) &&
        !g.student?.admissionNo?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const byStudent: Record<string, { student: any; grades: any[] }> = {};
  filtered.forEach((g) => {
    const id = g.student?._id ?? "unknown";
    if (!byStudent[id]) byStudent[id] = { student: g.student, grades: [] };
    byStudent[id].grades.push(g);
  });

  const avg = filtered.length
    ? Math.round(filtered.reduce((a, g) => a + g.score, 0) / filtered.length) : 0;
  const passing = filtered.filter((g) => g.score >= 50).length;

  const handleSave = async () => {
    if (!form.subject || !form.score || !form.term || !form.year) {
      toast({ title: "Fill in all required fields", variant: "destructive" });
      return;
    }

    // Validate based on mode
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
        // ✅ Use admission number endpoint
        result = await teacherApi.enterGradeByAdmission({
          admissionNo: form.admissionNo.trim(),
          subject: form.subject,
          score: Number(form.score),
          term: form.term,
          year: form.year,
          examType: form.examType,
          remarks: form.remarks,
        });
        setSavedStudent({
          name: result.data?.studentName,
          admissionNo: result.data?.admissionNo,
          class: result.data?.class,
        });
      } else {
        // Use MongoDB _id endpoint
        result = await teacherApi.enterGrade({
          studentId: form.studentId,
          subject: form.subject,
          score: Number(form.score),
          term: form.term,
          year: form.year,
          examType: form.examType,
          remarks: form.remarks,
        });
        const student = students.find(s => s._id === form.studentId);
        setSavedStudent(student ? {
          name: `${student.firstName} ${student.lastName}`,
          admissionNo: student.admissionNo,
          class: student.class,
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
      // ✅ Show clear error if admission number not found
      if (e.message?.includes("No student found")) {
        setAdmissionError(`No student found with admission number "${form.admissionNo}"`);
      } else {
        toast({ title: "Error", description: e.message, variant: "destructive" });
      }
    } finally {
      setSaving(false);
    }
  };

  const selectedStudent = students.find((s) => s._id === form.studentId);

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-4 pt-10 pb-6 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost" size="icon"
                onClick={() => navigate("/teacher")}
                className="text-white hover:bg-white/20 -ml-2 min-h-[44px] min-w-[44px]"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">Grades</h1>
                <p className="text-white/70 text-xs">{grades.length} records total</p>
              </div>
            </div>
            <Button
              onClick={() => { setForm(emptyForm()); setSaved(false); setAdmissionError(""); setShowDialog(true); }}
              className="bg-white text-emerald-700 hover:bg-white/90 font-semibold min-h-[44px]"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1.5" />Enter Grade
            </Button>
          </div>

          {!loading && grades.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-2">
              {[
                { label: "Records", value: filtered.length, icon: BookOpen },
                { label: "Avg Score", value: `${avg}%`, icon: Award },
                { label: "Passing", value: `${filtered.length ? Math.round((passing / filtered.length) * 100) : 0}%`, icon: GraduationCap },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white/15 rounded-xl px-3 py-2 text-center backdrop-blur-sm">
                  <p className="text-lg font-bold">{value}</p>
                  <p className="text-white/70 text-xs">{label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5 space-y-4">
        {/* Filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9 h-11"
              placeholder="Search student, admission no, or subject…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Select value={filterTerm} onValueChange={setFilterTerm}>
              <SelectTrigger className="flex-1 h-10"><SelectValue placeholder="Term" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Terms</SelectItem>
                {TERMS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterClass} onValueChange={setFilterClass}>
              <SelectTrigger className="flex-1 h-10"><SelectValue placeholder="Class" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="w-full">
            <TabsTrigger value="list" className="flex-1 text-xs sm:text-sm">
              <BookOpen className="h-3.5 w-3.5 mr-1.5" />All Grades
            </TabsTrigger>
            <TabsTrigger value="by-student" className="flex-1 text-xs sm:text-sm">
              <Users className="h-3.5 w-3.5 mr-1.5" />By Student
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-14 text-center space-y-3">
              <GraduationCap className="h-10 w-10 text-muted-foreground/40 mx-auto" />
              <p className="text-muted-foreground font-medium">No grades found</p>
              <p className="text-muted-foreground text-sm">
                {grades.length === 0 ? "Start by entering your first grade." : "Try adjusting your filters."}
              </p>
              {grades.length === 0 && (
                <Button size="sm" onClick={() => { setForm(emptyForm()); setShowDialog(true); }} className="mt-2">
                  <Plus className="h-4 w-4 mr-1.5" />Enter First Grade
                </Button>
              )}
            </CardContent>
          </Card>
        ) : activeTab === "list" ? (
          <div className="space-y-2">
            {filtered.map((g) => (
              <Card key={g._id} className={cn("border overflow-hidden transition-shadow hover:shadow-md", gradeBg(g.score))}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("flex-shrink-0 w-12 h-12 rounded-full border-2 flex flex-col items-center justify-center", gradeBg(g.score))}>
                      <span className={cn("text-base font-bold leading-none", gradeColor(g.score))}>{gradeLetter(g.score)}</span>
                      <span className={cn("text-[10px] leading-none mt-0.5", gradeColor(g.score))}>{g.score}%</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{g.student?.firstName} {g.student?.lastName}</p>
                      <p className="text-xs text-muted-foreground">Adm: {g.student?.admissionNo} · {g.subject}</p>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{g.term} {g.year}</Badge>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{g.examType}</Badge>
                        {g.student?.class && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{g.student.class}</Badge>}
                      </div>
                      {g.remarks && <p className="text-[11px] text-muted-foreground italic mt-1 truncate">"{g.remarks}"</p>}
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
                  <div className="bg-muted/40 px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">{student?.firstName} {student?.lastName}</p>
                      <p className="text-xs text-muted-foreground">{student?.class} · Adm {student?.admissionNo}</p>
                    </div>
                    <div className="text-right">
                      <span className={cn("text-xl font-bold", gradeColor(studentAvg))}>{studentAvg}%</span>
                      <p className="text-[10px] text-muted-foreground">avg</p>
                    </div>
                  </div>
                  <CardContent className="p-0 divide-y divide-border/50">
                    {sg.map((g) => (
                      <div key={g._id} className="px-4 py-2.5 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{g.subject}</p>
                          <p className="text-xs text-muted-foreground">{g.examType} · {g.term} {g.year}</p>
                          {g.remarks && <p className="text-xs text-muted-foreground italic truncate">"{g.remarks}"</p>}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={cn("text-base font-bold", gradeColor(g.score))}>{g.score}%</span>
                          <Badge variant="outline" className={cn("text-xs", gradeColor(g.score))}>{gradeLetter(g.score)}</Badge>
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

      {/* Enter Grade Dialog */}
      <Dialog open={showDialog} onOpenChange={(v) => { if (!saving) { setShowDialog(v); if (!v) { setForm(emptyForm()); setSaved(false); setAdmissionError(""); } } }}>
        <DialogContent className="w-[95vw] max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-emerald-600" />
              Enter Grade
            </DialogTitle>
            <DialogDescription>
              Grade will be immediately visible to the student in their portal.
            </DialogDescription>
          </DialogHeader>

          {saved ? (
            <div className="py-8 flex flex-col items-center gap-3 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <p className="font-semibold text-green-700 dark:text-green-400">Grade Saved!</p>
              {savedStudent && (
                <div className="text-sm text-muted-foreground space-y-0.5">
                  <p className="font-medium text-foreground">{savedStudent.name}</p>
                  <p>Adm: {savedStudent.admissionNo} · {savedStudent.class}</p>
                </div>
              )}
              <p className="text-sm text-muted-foreground">Student can now view this in their portal.</p>
            </div>
          ) : (
            <>
              <div className="space-y-4 py-1">

                {/* ✅ Toggle: Admission Number vs Select from list */}
                <div className="flex rounded-lg border overflow-hidden">
                  <button
                    className={cn(
                      "flex-1 py-2 text-sm font-medium transition-colors",
                      inputMode === "admission"
                        ? "bg-emerald-600 text-white"
                        : "bg-background text-muted-foreground hover:bg-muted"
                    )}
                    onClick={() => { setInputMode("admission"); setAdmissionError(""); }}
                  >
                    By Admission No.
                  </button>
                  <button
                    className={cn(
                      "flex-1 py-2 text-sm font-medium transition-colors",
                      inputMode === "select"
                        ? "bg-emerald-600 text-white"
                        : "bg-background text-muted-foreground hover:bg-muted"
                    )}
                    onClick={() => { setInputMode("select"); setAdmissionError(""); }}
                  >
                    Select Student
                  </button>
                </div>

                {/* Student input */}
                {inputMode === "admission" ? (
                  <div className="space-y-1.5">
                    <Label>Admission Number <span className="text-destructive">*</span></Label>
                    <Input
                      className={cn("h-11 uppercase", admissionError && "border-destructive focus-visible:ring-destructive")}
                      placeholder="e.g. ADM001"
                      value={form.admissionNo}
                      onChange={(e) => { setForm(f => ({ ...f, admissionNo: e.target.value })); setAdmissionError(""); }}
                    />
                    {admissionError && (
                      <div className="flex items-center gap-1.5 text-destructive text-xs">
                        <AlertCircle className="h-3.5 w-3.5" />
                        {admissionError}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Label>Student <span className="text-destructive">*</span></Label>
                    <Select value={form.studentId} onValueChange={(v) => setForm((f) => ({ ...f, studentId: v }))}>
                      <SelectTrigger className="h-11"><SelectValue placeholder="Select a student…" /></SelectTrigger>
                      <SelectContent>
                        {classes.length > 1
                          ? classes.map((cls) => (
                            <div key={cls}>
                              <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{cls}</div>
                              {students.filter((s) => s.class === cls).map((s) => (
                                <SelectItem key={s._id} value={s._id}>
                                  {s.firstName} {s.lastName}
                                  <span className="text-muted-foreground text-xs ml-1">· {s.admissionNo}</span>
                                </SelectItem>
                              ))}
                            </div>
                          ))
                          : students.map((s) => (
                            <SelectItem key={s._id} value={s._id}>
                              {s.firstName} {s.lastName}
                              <span className="text-muted-foreground text-xs ml-1">· {s.admissionNo}</span>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    {selectedStudent && (
                      <p className="text-xs text-muted-foreground pl-1">
                        Class: <span className="font-medium">{selectedStudent.class}</span> · Adm: {selectedStudent.admissionNo}
                      </p>
                    )}
                  </div>
                )}

                {/* Subject + Score */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Subject <span className="text-destructive">*</span></Label>
                    <Input className="h-11" placeholder="e.g. Mathematics" value={form.subject}
                      onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Score (%) <span className="text-destructive">*</span></Label>
                    <Input className="h-11" type="number" min={0} max={100} placeholder="0–100"
                      value={form.score} onChange={(e) => setForm((f) => ({ ...f, score: e.target.value }))} />
                  </div>
                </div>

                {/* Score preview */}
                {form.score !== "" && Number(form.score) >= 0 && (
                  <div className={cn("flex items-center gap-3 p-3 rounded-xl border", gradeBg(Number(form.score)))}>
                    <div className={cn("text-2xl font-bold", gradeColor(Number(form.score)))}>{gradeLetter(Number(form.score))}</div>
                    <div>
                      <p className={cn("text-sm font-semibold", gradeColor(Number(form.score)))}>
                        {Number(form.score) >= 80 ? "Excellent" : Number(form.score) >= 65 ? "Good" : Number(form.score) >= 50 ? "Average" : Number(form.score) >= 40 ? "Below Average" : "Failing"}
                      </p>
                      <p className="text-xs text-muted-foreground">Grade preview</p>
                    </div>
                  </div>
                )}

                {/* Term + Year */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Term <span className="text-destructive">*</span></Label>
                    <Select value={form.term} onValueChange={(v) => setForm((f) => ({ ...f, term: v }))}>
                      <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                      <SelectContent>{TERMS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Year <span className="text-destructive">*</span></Label>
                    <Input className="h-11" value={form.year} onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))} />
                  </div>
                </div>

                {/* Exam type */}
                <div className="space-y-1.5">
                  <Label>Exam Type</Label>
                  <Select value={form.examType} onValueChange={(v) => setForm((f) => ({ ...f, examType: v }))}>
                    <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>{EXAM_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>

                {/* Remarks */}
                <div className="space-y-1.5">
                  <Label>Remarks <span className="text-muted-foreground font-normal text-xs">(optional — shown to student)</span></Label>
                  <Input className="h-11" placeholder="e.g. Excellent performance, keep it up!"
                    value={form.remarks} onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))} />
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setShowDialog(false)} disabled={saving}>Cancel</Button>
                <Button
                  onClick={handleSave}
                  disabled={saving || !form.subject || !form.score || (inputMode === "admission" ? !form.admissionNo : !form.studentId)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[120px]"
                >
                  {saving
                    ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</>
                    : <><CheckCircle2 className="h-4 w-4 mr-2" />Save Grade</>}
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
