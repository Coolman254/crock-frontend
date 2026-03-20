import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useRequireAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Search, Pencil, Trash2, Plus, CheckCircle2, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

// ── API helpers ───────────────────────────────────────────────────────────────
const BASE = (import.meta.env.VITE_API_URL as string) || "http://localhost:5000";
const token = () => localStorage.getItem("token") ?? "";
const authH = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${token()}` });

const attendanceApi = {
  get: (params: string) =>
    fetch(`${BASE}/api/admin-dashboard/attendance?${params}`, { headers: authH() }).then(r => r.json()),
  create: (data: any) =>
    fetch(`${BASE}/api/admin-dashboard/attendance`, { method: "POST", headers: authH(), body: JSON.stringify(data) }).then(r => r.json()),
  update: (id: string, data: any) =>
    fetch(`${BASE}/api/admin-dashboard/attendance/${id}`, { method: "PUT", headers: authH(), body: JSON.stringify(data) }).then(r => r.json()),
  delete: (id: string) =>
    fetch(`${BASE}/api/admin-dashboard/attendance/${id}`, { method: "DELETE", headers: authH() }).then(r => r.json()),
};

const STATUS_BADGE: Record<string, string> = {
  present: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  absent:  "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  late:    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
};

export default function AdminAttendance() {
  useRequireAuth("admin");
  const { toast } = useToast();

  const [records, setRecords]     = useState<any[]>([]);
  const [summary, setSummary]     = useState<any>(null);
  const [loading, setLoading]     = useState(false);
  const [search, setSearch]       = useState("");

  // Filters
  const [filterDate, setFilterDate]   = useState(new Date().toISOString().split("T")[0]);
  const [filterClass, setFilterClass] = useState("");

  // Edit dialog
  const [editRec, setEditRec]     = useState<any>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editRemarks, setEditRemarks] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  // Add dialog
  const [showAdd, setShowAdd]     = useState(false);
  const [addForm, setAddForm]     = useState({ studentId: "", date: new Date().toISOString().split("T")[0], status: "present", remarks: "" });
  const [addSaving, setAddSaving] = useState(false);

  const fetchRecords = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterDate)  params.append("date",  filterDate);
    if (filterClass) params.append("class", filterClass);

    attendanceApi.get(params.toString())
      .then(r => {
        setRecords(r.data?.records ?? []);
        setSummary(r.data?.summary ?? null);
      })
      .catch(e => toast({ title: "Error", description: e.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRecords(); }, [filterDate, filterClass]);

  // Filter by search
  const filtered = records.filter(r => {
    const name = `${r.student?.firstName ?? ""} ${r.student?.lastName ?? ""}`.toLowerCase();
    const adm  = String(r.student?.admissionNo ?? "").toLowerCase();
    const q    = search.toLowerCase();
    return !q || name.includes(q) || adm.includes(q);
  });

  // Unique classes from loaded records
  const classes = [...new Set(records.map(r => r.student?.class).filter(Boolean))].sort();

  // Edit
  const openEdit = (rec: any) => {
    setEditRec(rec);
    setEditStatus(rec.status);
    setEditRemarks(rec.remarks ?? "");
  };

  const handleEdit = async () => {
    if (!editRec) return;
    setEditSaving(true);
    try {
      const r = await attendanceApi.update(editRec._id, { status: editStatus, remarks: editRemarks });
      if (r.success) {
        toast({ title: "Updated!" });
        setEditRec(null);
        fetchRecords();
      } else {
        toast({ title: "Error", description: r.message, variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setEditSaving(false);
    }
  };

  // Delete
  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this attendance record?")) return;
    try {
      await attendanceApi.delete(id);
      toast({ title: "Deleted" });
      setRecords(prev => prev.filter(r => r._id !== id));
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  // Add
  const handleAdd = async () => {
    if (!addForm.studentId || !addForm.date || !addForm.status) {
      toast({ title: "Fill all required fields", variant: "destructive" }); return;
    }
    setAddSaving(true);
    try {
      const r = await attendanceApi.create(addForm);
      if (r.success) {
        toast({ title: "Record added!" });
        setShowAdd(false);
        setAddForm({ studentId: "", date: new Date().toISOString().split("T")[0], status: "present", remarks: "" });
        fetchRecords();
      } else {
        toast({ title: "Error", description: r.message, variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setAddSaving(false);
    }
  };

  return (
    <AdminLayout title="Attendance">
      <div className="space-y-5">

        {/* Summary cards */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total",      value: summary.total,   color: "text-foreground"  },
              { label: "Present",    value: summary.present, color: "text-emerald-600" },
              { label: "Absent",     value: summary.absent,  color: "text-red-500"     },
              { label: "Rate",       value: `${summary.rate}%`, color: "text-blue-600" },
            ].map(({ label, value, color }) => (
              <Card key={label}>
                <CardContent className="p-4 text-center">
                  <p className={`text-2xl font-bold ${color}`}>{value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Date</Label>
                <Input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Class</Label>
                <Select value={filterClass || "all"} onValueChange={v => setFilterClass(v === "all" ? "" : v)}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="All classes" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="relative">
                <Label className="text-xs">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input className="pl-8 h-9 text-sm" placeholder="Name or adm no…"
                    value={search} onChange={e => setSearch(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">{filtered.length} records</p>
              <Button size="sm" onClick={() => setShowAdd(true)} className="h-8 text-xs">
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Record
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Records table */}
        {loading ? (
          [...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground text-sm">
              No attendance records found for the selected filters.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {filtered.map(r => (
                  <div key={r._id} className="flex items-center justify-between px-4 py-3 gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {r.student?.firstName} {r.student?.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        #{r.student?.admissionNo} · {r.student?.class} · {new Date(r.date).toLocaleDateString()}
                      </p>
                      {r.remarks && <p className="text-xs text-muted-foreground italic mt-0.5">"{r.remarks}"</p>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full capitalize", STATUS_BADGE[r.status])}>
                        {r.status}
                      </span>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(r)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(r._id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editRec} onOpenChange={o => !o && setEditRec(null)}>
        <DialogContent className="w-[95vw] max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Attendance</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {editRec?.student?.firstName} {editRec?.student?.lastName} · {new Date(editRec?.date).toLocaleDateString()}
            </p>
            <div>
              <Label>Status *</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Remarks</Label>
              <Input placeholder="Optional remarks" value={editRemarks} onChange={e => setEditRemarks(e.target.value)} />
            </div>
            <Button className="w-full" onClick={handleEdit} disabled={editSaving}>
              {editSaving ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add dialog */}
      <Dialog open={showAdd} onOpenChange={o => !o && setShowAdd(false)}>
        <DialogContent className="w-[95vw] max-w-sm">
          <DialogHeader><DialogTitle>Add Attendance Record</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Student ID (MongoDB _id) *</Label>
              <Input placeholder="Paste student _id"
                value={addForm.studentId} onChange={e => setAddForm(f => ({ ...f, studentId: e.target.value }))} />
            </div>
            <div>
              <Label>Date *</Label>
              <Input type="date" value={addForm.date}
                onChange={e => setAddForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div>
              <Label>Status *</Label>
              <Select value={addForm.status} onValueChange={v => setAddForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Remarks</Label>
              <Input placeholder="Optional" value={addForm.remarks}
                onChange={e => setAddForm(f => ({ ...f, remarks: e.target.value }))} />
            </div>
            <Button className="w-full" onClick={handleAdd} disabled={addSaving}>
              {addSaving ? "Saving…" : "Add Record"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
