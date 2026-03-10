import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LogOut, Bell, DollarSign, TrendingUp, MessageSquare, FileText, Calendar } from "lucide-react";
import { BottomNav } from "@/components/layout/BottomNav";
import { useRequireAuth, useSignOut } from "@/lib/auth";
import { parentApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function ParentDashboard() {
  const { user, loading: authLoading } = useRequireAuth("parent");
  const signOut = useSignOut();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState<any>(null);
  const [reportCard, setReportCard] = useState<any>(null);
  const [attendance, setAttendance] = useState<any>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [attendanceOpen, setAttendanceOpen] = useState(false);

  useEffect(() => {
    if (authLoading || !user) return;
    parentApi.getDashboard()
      .then((r) => setData(r.data))
      .catch((e) => toast({ title: "Error", description: e.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [authLoading, user]);

  const openReportCard = async (child: any) => {
    setSelectedChild(child); setReportOpen(true);
    try {
      const r = await parentApi.getReportCard(child._id);
      setReportCard(r.data);
    } catch { setReportCard({}); }
  };

  const openAttendance = async (child: any) => {
    setSelectedChild(child); setAttendanceOpen(true);
    try {
      const r = await parentApi.getAttendance(child._id);
      setAttendance(r.data);
    } catch { setAttendance({ summary: {}, records: [] }); }
  };

  if (authLoading || loading) return (
    <div className="min-h-screen bg-background p-4 pb-20">
      <div className="max-w-2xl mx-auto space-y-4">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
      </div>
    </div>
  );

  const parent = data?.parent;
  const children = data?.children || [];
  const announcements = data?.announcements || [];

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-gradient-to-r from-purple-600 to-purple-500 text-white px-4 pt-10 pb-6 sm:px-6">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-white/70 text-sm">Parent Portal</p>
            <h1 className="text-xl sm:text-2xl font-bold">{parent?.fullName || user?.name}</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={signOut} className="text-white hover:bg-white/20">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5 space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="h-16 flex-col gap-1 text-sm" onClick={() => navigate("/parent/finance")}>
            <DollarSign className="h-5 w-5" />Finance
          </Button>
          <Button variant="outline" className="h-16 flex-col gap-1 text-sm" onClick={() => navigate("/parent/messages")}>
            <MessageSquare className="h-5 w-5" />Messages
          </Button>
        </div>

        {/* Children */}
        {children.map((child: any) => {
          const feePercent = child.fee?.totalFees > 0
            ? Math.min(100, Math.round((child.fee.amountPaid / child.fee.totalFees) * 100)) : 100;
          return (
            <Card key={child._id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{child.fullName}</CardTitle>
                  <Badge variant="outline">{child.class}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Adm: {child.admissionNo}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span>Average: <b>{child.avgScore}%</b></span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Fees: KSH {child.fee?.amountPaid?.toLocaleString()} / {child.fee?.totalFees?.toLocaleString()}</span>
                    <Badge variant={child.fee?.feeStatus === "cleared" ? "default" : child.fee?.feeStatus === "partial" ? "secondary" : "destructive"} className="text-xs">
                      {child.fee?.feeStatus}
                    </Badge>
                  </div>
                  <Progress value={feePercent} className="h-2" />
                </div>
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => openReportCard(child)}>
                    <FileText className="h-3 w-3 mr-1" />Report Card
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => openAttendance(child)}>
                    <Calendar className="h-3 w-3 mr-1" />Attendance
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {announcements.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><Bell className="h-4 w-4" />Announcements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {announcements.slice(0, 3).map((a: any) => (
                <div key={a._id} className="py-2 border-b last:border-0">
                  <p className="font-medium text-sm">{a.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{a.body || a.content}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Report Card Dialog */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="w-[95vw] max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Report Card — {selectedChild?.fullName}</DialogTitle></DialogHeader>
          {!reportCard ? <p className="text-sm text-muted-foreground text-center py-4">Loading...</p> :
            Object.keys(reportCard).length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">No grades recorded yet</p> :
            Object.entries(reportCard).map(([term, gs]: any) => (
              <div key={term} className="mb-4">
                <h3 className="font-semibold text-sm mb-2 text-muted-foreground uppercase tracking-wide">{term}</h3>
                <div className="space-y-1">
                  {gs.map((g: any) => (
                    <div key={g._id} className="flex justify-between text-sm py-1 border-b last:border-0">
                      <span>{g.subject}</span>
                      <span className="font-medium">{g.score}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          }
        </DialogContent>
      </Dialog>

      {/* Attendance Dialog */}
      <Dialog open={attendanceOpen} onOpenChange={setAttendanceOpen}>
        <DialogContent className="w-[95vw] max-w-lg">
          <DialogHeader><DialogTitle>Attendance — {selectedChild?.fullName}</DialogTitle></DialogHeader>
          {!attendance ? <p className="text-sm text-muted-foreground text-center py-4">Loading...</p> : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Present", value: attendance.summary?.presentDays ?? 0, color: "text-green-600" },
                  { label: "Absent", value: attendance.summary?.absentDays ?? 0, color: "text-red-500" },
                  { label: "Late", value: attendance.summary?.lateDays ?? 0, color: "text-orange-500" },
                  { label: "Rate", value: `${attendance.summary?.percentage ?? 0}%`, color: "text-blue-600" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="text-center p-3 border rounded-lg">
                    <p className={`text-xl font-bold ${color}`}>{value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
              {attendance.records?.length === 0 && <p className="text-sm text-muted-foreground text-center py-2">No attendance records found</p>}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <BottomNav role="parent" />
    </div>
  );
}
