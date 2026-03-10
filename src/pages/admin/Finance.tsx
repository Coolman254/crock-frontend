import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Search, Plus, DollarSign } from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useRequireAuth } from "@/lib/auth";
import { financeApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function AdminFinance() {
  const { user, loading: authLoading } = useRequireAuth("admin");
  const { toast } = useToast();
  const [stats, setStats] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [feeStructures, setFeeStructures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showFeeStructureDialog, setShowFeeStructureDialog] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ admNo: "", amount: "", method: "cash", reference: "", date: new Date().toISOString().split("T")[0], notes: "" });
  const [feeForm, setFeeForm] = useState({ class: "", term: "Term 1", year: String(new Date().getFullYear()), tuition: "", boarding: "", activity: "", other: "" });

  const fetchAll = () => {
    Promise.all([
      financeApi.getStats(),
      financeApi.getStudents(),
      financeApi.getPayments(),
      financeApi.getFeeStructures(),
    ]).then(([s, stu, p, fs]) => {
      setStats(s.data);
      setStudents(stu.data);
      setPayments(p.data);
      setFeeStructures(fs.data);
    }).catch(e => toast({ title: "Error", description: e.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (!authLoading && user) fetchAll(); }, [authLoading, user]);

  const handleRecordPayment = async () => {
    try {
      const r = await financeApi.recordPayment({ ...paymentForm, amount: Number(paymentForm.amount) });
      toast({ title: "Payment recorded!", description: r.message });
      setShowPaymentDialog(false);
      setPaymentForm({ admNo: "", amount: "", method: "cash", reference: "", date: new Date().toISOString().split("T")[0], notes: "" });
      fetchAll();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleCreateFeeStructure = async () => {
    try {
      await financeApi.createFeeStructure({
        ...feeForm,
        tuition: Number(feeForm.tuition) || 0,
        boarding: Number(feeForm.boarding) || 0,
        activity: Number(feeForm.activity) || 0,
        other: Number(feeForm.other) || 0,
      });
      toast({ title: "Fee structure created!" });
      setShowFeeStructureDialog(false);
      fetchAll();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const filteredStudents = students.filter(s => {
    const nameMatch = s.name?.toLowerCase().includes(search.toLowerCase()) || s.admNo?.toLowerCase().includes(search.toLowerCase());
    const statusMatch = statusFilter === "all" || s.status === statusFilter;
    return nameMatch && statusMatch;
  });

  const statusColor: Record<string, any> = { cleared: "default", partial: "secondary", pending: "destructive" };

  return (
    <AdminLayout title="Finance">
      <div className="space-y-5">
        {/* Stats */}
        {loading ? <Skeleton className="h-32 rounded-xl" /> : stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: "Expected", value: `KSH ${stats.totalExpected?.toLocaleString()}`, color: "text-foreground" },
              { label: "Collected", value: `KSH ${stats.totalCollected?.toLocaleString()}`, color: "text-green-600" },
              { label: "Balance", value: `KSH ${stats.totalBalance?.toLocaleString()}`, color: "text-red-500" },
            ].map(({ label, value, color }) => (
              <Card key={label}>
                <CardContent className="p-4">
                  <p className={`text-lg font-bold ${color}`}>{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          <Button onClick={() => setShowPaymentDialog(true)}><Plus className="h-4 w-4 mr-1" />Record Payment</Button>
          <Button variant="outline" onClick={() => setShowFeeStructureDialog(true)}><Plus className="h-4 w-4 mr-1" />Fee Structure</Button>
        </div>

        <Tabs defaultValue="students">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="structures">Fee Structures</TabsTrigger>
          </TabsList>

          <TabsContent value="students" className="space-y-3 mt-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["all","cleared","partial","pending"].map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {loading ? [...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />) :
              filteredStudents.map((s) => {
                const pct = s.totalFees > 0 ? Math.min(100, Math.round((s.amountPaid / s.totalFees) * 100)) : 100;
                return (
                  <Card key={s._id}>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{s.name}</p>
                          <p className="text-xs text-muted-foreground">{s.admNo} · {s.class}</p>
                        </div>
                        <Badge variant={statusColor[s.status] || "outline"} className="capitalize text-xs flex-shrink-0">{s.status}</Badge>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                      <p className="text-xs text-muted-foreground">KSH {s.amountPaid?.toLocaleString()} / {s.totalFees?.toLocaleString()}</p>
                    </CardContent>
                  </Card>
                );
              })
            }
          </TabsContent>

          <TabsContent value="payments" className="space-y-2 mt-3">
            {loading ? [...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />) :
              payments.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No payments recorded</p> :
              payments.slice(0, 50).map((p) => (
                <Card key={p._id}>
                  <CardContent className="p-4 flex justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{p.studentName}</p>
                      <p className="text-xs text-muted-foreground">{p.method} · {new Date(p.date).toLocaleDateString()} · {p.reference}</p>
                    </div>
                    <p className="font-bold text-green-600 flex-shrink-0">KSH {p.amount?.toLocaleString()}</p>
                  </CardContent>
                </Card>
              ))
            }
          </TabsContent>

          <TabsContent value="structures" className="space-y-2 mt-3">
            {loading ? [...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />) :
              feeStructures.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No fee structures defined</p> :
              feeStructures.map((f) => (
                <Card key={f._id}>
                  <CardContent className="p-4 flex justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm">{f.class} · {f.term} {f.year}</p>
                      <p className="text-xs text-muted-foreground">
                        Tuition: {f.tuition?.toLocaleString()} · Boarding: {f.boarding?.toLocaleString()}
                      </p>
                    </div>
                    <p className="font-bold flex-shrink-0">KSH {((f.tuition||0)+(f.boarding||0)+(f.activity||0)+(f.other||0))?.toLocaleString()}</p>
                  </CardContent>
                </Card>
              ))
            }
          </TabsContent>
        </Tabs>
      </div>

      {/* Record Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Adm No</Label><Input value={paymentForm.admNo} onChange={e => setPaymentForm(f => ({ ...f, admNo: e.target.value }))} placeholder="e.g. GT001" /></div>
              <div><Label>Amount (KSH)</Label><Input type="number" value={paymentForm.amount} onChange={e => setPaymentForm(f => ({ ...f, amount: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Method</Label>
                <Select value={paymentForm.method} onValueChange={v => setPaymentForm(f => ({ ...f, method: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["cash","mpesa","bank","cheque"].map(m => <SelectItem key={m} value={m} className="capitalize">{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Date</Label><Input type="date" value={paymentForm.date} onChange={e => setPaymentForm(f => ({ ...f, date: e.target.value }))} /></div>
            </div>
            <div><Label>Reference</Label><Input value={paymentForm.reference} onChange={e => setPaymentForm(f => ({ ...f, reference: e.target.value }))} /></div>
            <Button className="w-full" onClick={handleRecordPayment} disabled={!paymentForm.admNo || !paymentForm.amount || !paymentForm.reference}>Record Payment</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fee Structure Dialog */}
      <Dialog open={showFeeStructureDialog} onOpenChange={setShowFeeStructureDialog}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader><DialogTitle>New Fee Structure</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Class</Label><Input value={feeForm.class} placeholder="e.g. Form 1" onChange={e => setFeeForm(f => ({ ...f, class: e.target.value }))} /></div>
              <div>
                <Label>Term</Label>
                <Select value={feeForm.term} onValueChange={v => setFeeForm(f => ({ ...f, term: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["Term 1","Term 2","Term 3"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Tuition (KSH)</Label><Input type="number" value={feeForm.tuition} onChange={e => setFeeForm(f => ({ ...f, tuition: e.target.value }))} /></div>
              <div><Label>Boarding (KSH)</Label><Input type="number" value={feeForm.boarding} onChange={e => setFeeForm(f => ({ ...f, boarding: e.target.value }))} /></div>
              <div><Label>Activity (KSH)</Label><Input type="number" value={feeForm.activity} onChange={e => setFeeForm(f => ({ ...f, activity: e.target.value }))} /></div>
              <div><Label>Other (KSH)</Label><Input type="number" value={feeForm.other} onChange={e => setFeeForm(f => ({ ...f, other: e.target.value }))} /></div>
            </div>
            <Button className="w-full" onClick={handleCreateFeeStructure} disabled={!feeForm.class}>Create Fee Structure</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
