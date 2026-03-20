import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, CheckCircle2, XCircle, Clock, Save, Loader2, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/layout/BottomNav";
import { useRequireAuth } from "@/lib/auth";
import { teacherApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Status = "present" | "absent" | "late" | "";

const STATUS_CONFIG = {
  present: { label: "Present", color: "bg-emerald-500 text-white", icon: CheckCircle2 },
  absent:  { label: "Absent",  color: "bg-red-500 text-white",     icon: XCircle      },
  late:    { label: "Late",    color: "bg-orange-400 text-white",  icon: Clock        },
};

export default function TeacherAttendance() {
  const { user, loading: authLoading } = useRequireAuth("teacher");
  const navigate  = useNavigate();
  const { toast } = useToast();

  const [date, setDate]           = useState(() => new Date().toISOString().split("T")[0]);
  const [students, setStudents]   = useState<any[]>([]);
  const [records, setRecords]     = useState<Record<string, { status: Status; remarks: string }>>({});
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);

  // Fetch students + existing records for selected date
  const fetchData = useCallback(() => {
    setLoading(true);
    setSaved(false);
    (teacherApi as any).getAttendance(date)
      .then((r: any) => {
        const { students: studs, records: recs } = r.data ?? {};
        setStudents(studs ?? []);
        // Pre-fill records from existing DB data
        const init: Record<string, { status: Status; remarks: string }> = {};
        (studs ?? []).forEach((s: any) => {
          const existing = recs?.[s._id];
          init[s._id] = {
            status:  existing?.status  ?? "",
            remarks: existing?.remarks ?? "",
          };
        });
        setRecords(init);
      })
      .catch((e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [date]);

  useEffect(() => {
    if (!authLoading && user) fetchData();
  }, [authLoading, user, fetchData]);

  const setStatus = (studentId: string, status: Status) => {
    setRecords(prev => ({ ...prev, [studentId]: { ...prev[studentId], status } }));
  };

  const setRemarks = (studentId: string, remarks: string) => {
    setRecords(prev => ({ ...prev, [studentId]: { ...prev[studentId], remarks } }));
  };

  // Mark all present at once
  const markAllPresent = () => {
    setRecords(prev => {
      const updated = { ...prev };
      students.forEach(s => { updated[s._id] = { ...updated[s._id], status: "present" }; });
      return updated;
    });
  };

  const handleSave = async () => {
    const toSave = students
      .filter(s => records[s._id]?.status)
      .map(s => ({
        studentId: s._id,
        status:    records[s._id].status,
        remarks:   records[s._id].remarks,
      }));

    if (toSave.length === 0) {
      toast({ title: "No attendance marked", description: "Mark at least one student.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      await (teacherApi as any).markAttendance({ date, records: toSave });
      setSaved(true);
      toast({ title: "Attendance saved!", description: `${toSave.length} records saved for ${date}` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const markedCount  = students.filter(s => records[s._id]?.status).length;
  const presentCount = students.filter(s => records[s._id]?.status === "present").length;
  const absentCount  = students.filter(s => records[s._id]?.status === "absent").length;
  const lateCount    = students.filter(s => records[s._id]?.status === "late").length;

  return (
    <div className="min-h-screen bg-background pb-28">

      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-4 pt-10 pb-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => navigate("/teacher")}
                className="text-white hover:bg-white/20 -ml-1 h-9 w-9">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-lg font-bold">Attendance</h1>
                <p className="text-white/70 text-xs">{students.length} students</p>
              </div>
            </div>
            <Button size="sm" className="bg-white text-emerald-700 hover:bg-white/90 font-semibold h-9"
              onClick={handleSave} disabled={saving || markedCount === 0}>
              {saving
                ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Saving…</>
                : <><Save className="h-3.5 w-3.5 mr-1.5" />Save ({markedCount})</>
              }
            </Button>
          </div>

          {/* Date picker */}
          <div className="flex items-center gap-2 bg-white/15 rounded-lg px-3 py-2">
            <Calendar className="h-4 w-4 text-white/70 flex-shrink-0" />
            <Input type="date" value={date}
              onChange={e => setDate(e.target.value)}
              className="bg-transparent border-0 text-white p-0 h-auto text-sm focus-visible:ring-0 [color-scheme:dark]" />
          </div>

          {/* Stats */}
          {!loading && students.length > 0 && (
            <div className="grid grid-cols-4 gap-2 mt-3">
              {[
                { label: "Total",   value: students.length, color: "text-white"        },
                { label: "Present", value: presentCount,    color: "text-emerald-200"  },
                { label: "Absent",  value: absentCount,     color: "text-red-200"      },
                { label: "Late",    value: lateCount,       color: "text-orange-200"   },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-white/15 rounded-lg py-1.5 text-center">
                  <p className={`text-base font-bold ${color}`}>{value}</p>
                  <p className="text-white/60 text-[10px]">{label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-3 sm:px-6 py-4 space-y-3">

        {/* Mark all present shortcut */}
        {!loading && students.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{markedCount}/{students.length} marked</p>
            <Button size="sm" variant="outline" className="text-xs h-8" onClick={markAllPresent}>
              <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-500" />
              Mark All Present
            </Button>
          </div>
        )}

        {saved && (
          <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 text-sm">
            <CheckCircle2 className="h-4 w-4" />
            Attendance saved for {date}
          </div>
        )}

        {/* Student list */}
        {loading ? (
          [...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)
        ) : students.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground text-sm">
              No students found in your class.
            </CardContent>
          </Card>
        ) : (
          students.map(s => {
            const rec    = records[s._id] ?? { status: "", remarks: "" };
            const status = rec.status as Status;

            return (
              <Card key={s._id} className={cn("transition-all",
                status === "present" ? "border-emerald-200 dark:border-emerald-800" :
                status === "absent"  ? "border-red-200 dark:border-red-900"         :
                status === "late"    ? "border-orange-200 dark:border-orange-900"   : ""
              )}>
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">
                        {s.firstName} {s.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        #{s.admissionNo} · {s.class}
                      </p>
                    </div>
                    {/* Status buttons */}
                    <div className="flex gap-1.5 flex-shrink-0">
                      {(["present", "absent", "late"] as const).map(st => {
                        const cfg = STATUS_CONFIG[st];
                        const Icon = cfg.icon;
                        const active = status === st;
                        return (
                          <button key={st} type="button"
                            onClick={() => setStatus(s._id, active ? "" : st)}
                            className={cn(
                              "flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all",
                              active ? cfg.color : "bg-muted text-muted-foreground hover:bg-muted/80"
                            )}>
                            <Icon className="h-3 w-3" />
                            <span className="hidden sm:inline">{cfg.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {/* Remarks — only show when absent or late */}
                  {(status === "absent" || status === "late") && (
                    <Input
                      className="h-7 text-xs"
                      placeholder="Reason / remarks (optional)"
                      value={rec.remarks}
                      onChange={e => setRemarks(s._id, e.target.value)}
                    />
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <BottomNav role="teacher" />
    </div>
  );
}
