import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, TrendingUp, Award, BookOpen, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/layout/BottomNav";
import { useRequireAuth } from "@/lib/auth";
import { studentApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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
  s >= 80 ? "Excellent" : s >= 65 ? "Good" : s >= 50 ? "Average" : s >= 40 ? "Below Average" : "Failing";

export default function StudentGrades() {
  const { user, loading: authLoading } = useRequireAuth("student");
  const navigate = useNavigate();
  const { toast } = useToast();
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [term, setTerm] = useState("all");
  const [subject, setSubject] = useState("all");

  useEffect(() => {
    if (authLoading || !user) return;
    setLoading(true);
    const params = [
      term !== "all" && `term=${term}`,
      subject !== "all" && `subject=${encodeURIComponent(subject)}`
    ].filter(Boolean).join("&");
    studentApi.getGrades(params)
      .then((r) => setGrades(r.data ?? []))
      .catch((e) => toast({ title: "Error", description: e.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [authLoading, user, term, subject]);

  const subjects = [...new Set(grades.map((g) => g.subject))].sort();
  const avg = grades.length ? Math.round(grades.reduce((a, g) => a + g.score, 0) / grades.length) : 0;
  const best = grades.length ? Math.max(...grades.map((g) => g.score)) : 0;
  const passing = grades.filter((g) => g.score >= 50).length;

  // group by subject for summary row
  const bySubject: Record<string, number[]> = {};
  grades.forEach((g) => {
    if (!bySubject[g.subject]) bySubject[g.subject] = [];
    bySubject[g.subject].push(g.score);
  });

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="bg-gradient-to-r gradient-student text-primary-foreground px-4 pt-10 pb-6 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost" size="icon"
              onClick={() => navigate("/student")}
              className="text-primary-foreground hover:bg-white/20 -ml-2 min-h-[44px] min-w-[44px]"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">My Grades</h1>
              <p className="text-primary-foreground/70 text-xs">{grades.length} records</p>
            </div>
          </div>

          {/* Stats strip */}
          {!loading && grades.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Average", value: `${avg}%` },
                { label: "Best", value: `${best}%` },
                { label: "Passing", value: `${passing}/${grades.length}` },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white/15 rounded-xl px-3 py-2 text-center backdrop-blur-sm">
                  <p className="text-lg font-bold">{value}</p>
                  <p className="text-primary-foreground/70 text-xs">{label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5 space-y-4">
        {/* Filters */}
        <div className="flex gap-2">
          <Select value={term} onValueChange={(v) => { setTerm(v); setLoading(true); }}>
            <SelectTrigger className="flex-1 h-10">
              <SelectValue placeholder="Term" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Terms</SelectItem>
              {["Term 1", "Term 2", "Term 3"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={subject} onValueChange={(v) => { setSubject(v); setLoading(true); }}>
            <SelectTrigger className="flex-1 h-10">
              <SelectValue placeholder="Subject" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {subjects.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Subject summary cards (only when no filter) */}
        {!loading && term === "all" && subject === "all" && Object.keys(bySubject).length > 1 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Subject Averages</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(bySubject).map(([sub, scores]) => {
                const subAvg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
                return (
                  <div key={sub} className={cn("rounded-xl border p-3 flex items-center justify-between gap-2", gradeBg(subAvg))}>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">{sub}</p>
                      <p className="text-[10px] text-muted-foreground">{scores.length} record{scores.length > 1 ? "s" : ""}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className={cn("text-base font-bold", gradeColor(subAvg))}>{subAvg}%</span>
                      <p className={cn("text-[10px]", gradeColor(subAvg))}>{gradeLetter(subAvg)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Grade list */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        ) : grades.length === 0 ? (
          <Card>
            <CardContent className="py-14 text-center space-y-2">
              <GraduationCap className="h-10 w-10 text-muted-foreground/40 mx-auto" />
              <p className="text-muted-foreground font-medium">No grades yet</p>
              <p className="text-sm text-muted-foreground">Your teacher hasn't entered any grades yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {grades.map((g) => (
              <Card key={g._id} className={cn("border overflow-hidden", gradeBg(g.score))}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    {/* Grade circle */}
                    <div className={cn(
                      "flex-shrink-0 w-14 h-14 rounded-full border-2 flex flex-col items-center justify-center",
                      gradeBg(g.score)
                    )}>
                      <span className={cn("text-lg font-bold leading-none", gradeColor(g.score))}>
                        {gradeLetter(g.score)}
                      </span>
                      <span className={cn("text-[10px] leading-none mt-0.5", gradeColor(g.score))}>
                        {g.score}%
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-sm">{g.subject}</p>
                          <p className={cn("text-xs font-medium mt-0.5", gradeColor(g.score))}>
                            {gradeLabel(g.score)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{g.examType}</Badge>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{g.term} {g.year}</Badge>
                      </div>
                      {g.remarks && (
                        <p className="text-xs text-muted-foreground italic mt-1.5 border-t border-border/50 pt-1.5">
                          💬 {g.remarks}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <BottomNav role="student" />
    </div>
  );
}
