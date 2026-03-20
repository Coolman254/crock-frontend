import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, CreditCard, CheckCircle2, Loader2, Receipt } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/layout/BottomNav";
import { useRequireAuth } from "@/lib/auth";
import { parentApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const PAYMENT_METHODS = ["M-Pesa", "Bank Transfer", "Cash", "Cheque"];

export default function ParentFinance() {
  const { user, loading: authLoading } = useRequireAuth("parent");
  const navigate  = useNavigate();
  const { toast } = useToast();

  const [children, setChildren]         = useState<any[]>([]);
  const [selectedChildId, setSelectedChildId] = useState("");
  const [financeData, setFinanceData]   = useState<any>(null);
  const [loading, setLoading]           = useState(true);
  const [finLoading, setFinLoading]     = useState(false);

  // Payment dialog
  const [showPay, setShowPay]           = useState(false);
  const [paying, setPaying]             = useState(false);
  const [paid, setPaid]                 = useState(false);
  const [receipt, setReceipt]           = useState<string | null>(null);
  const [form, setForm] = useState({
    amount: "", method: "M-Pesa", reference: "", notes: "",
  });

  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  // Load children
  useEffect(() => {
    if (authLoading || !user) return;
    parentApi.getDashboard()
      .then(r => {
        const kids = r.data?.children ?? [];
        setChildren(kids);
        if (kids.length) setSelectedChildId(kids[0]._id);
      })
      .catch(e => toast({ title: "Error", description: e.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [authLoading, user]);

  // Load finance for selected child
  useEffect(() => {
    if (!selectedChildId) return;
    setFinLoading(true);
    parentApi.getChildFinance(selectedChildId)
      .then(r => setFinanceData(r.data))
      .catch(e => toast({ title: "Error", description: e.message, variant: "destructive" }))
      .finally(() => setFinLoading(false));
  }, [selectedChildId]);

  const feePercent = financeData?.finance?.totalFees > 0
    ? Math.min(100, Math.round((financeData.finance.amountPaid / financeData.finance.totalFees) * 100))
    : 100;

  const balance = financeData?.finance?.balance ?? 0;
  const child   = children.find(c => c._id === selectedChildId);

  // Submit payment
  const handlePay = async () => {
    if (!form.amount || Number(form.amount) <= 0) {
      toast({ title: "Enter a valid amount", variant: "destructive" }); return;
    }
    if (!form.reference.trim()) {
      toast({ title: "Reference number is required", variant: "destructive" }); return;
    }
    if (Number(form.amount) > balance) {
      toast({ title: "Amount exceeds balance", description: `Maximum payable is KSH ${balance.toLocaleString()}`, variant: "destructive" });
      return;
    }
    setPaying(true);
    try {
      const r = await (parentApi as any).makePayment(selectedChildId, {
        amount:    Number(form.amount),
        method:    form.method,
        reference: form.reference.trim(),
        notes:     form.notes.trim(),
      });
      const data = r?.data ?? r;
      setReceipt(data?.receipt ?? null);
      setPaid(true);
      // Refresh finance data
      parentApi.getChildFinance(selectedChildId)
        .then(r => setFinanceData(r.data))
        .catch(() => {});
    } catch (e: any) {
      toast({ title: "Payment failed", description: e.message, variant: "destructive" });
    } finally {
      setPaying(false);
    }
  };

  const resetDialog = () => {
    setShowPay(false);
    setPaid(false);
    setReceipt(null);
    setForm({ amount: "", method: "M-Pesa", reference: "", notes: "" });
  };

  return (
    <div className="min-h-screen bg-background pb-24">

      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-500 text-white px-4 pt-10 pb-5 sm:px-6">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/parent")}
            className="text-white hover:bg-white/20 -ml-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Finance</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5 space-y-4">

        {/* Child selector */}
        {loading ? <Skeleton className="h-12 rounded-lg" /> : (
          <Select value={selectedChildId} onValueChange={setSelectedChildId}>
            <SelectTrigger><SelectValue placeholder="Select child" /></SelectTrigger>
            <SelectContent>
              {children.map(c => (
                <SelectItem key={c._id} value={c._id}>
                  {c.fullName} ({c.class})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {finLoading ? (
          [...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)
        ) : financeData && (
          <>
            {/* Fee summary cards */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Total",   value: financeData.finance?.totalFees,   color: "text-foreground"  },
                { label: "Paid",    value: financeData.finance?.amountPaid,  color: "text-emerald-600" },
                { label: "Balance", value: financeData.finance?.balance,     color: "text-red-500"     },
              ].map(({ label, value, color }) => (
                <Card key={label} className="p-3 text-center">
                  <p className={`text-xs sm:text-sm font-bold leading-tight ${color}`}>
                    KSH {(value ?? 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                </Card>
              ))}
            </div>

            {/* Progress */}
            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Payment Progress</span>
                  <Badge variant={
                    financeData.finance?.feeStatus === "cleared"  ? "default"     :
                    financeData.finance?.feeStatus === "partial"  ? "secondary"   : "destructive"
                  }>
                    {financeData.finance?.feeStatus}
                  </Badge>
                </div>
                <Progress value={feePercent} className="h-3" />
                <p className="text-xs text-muted-foreground text-right">{feePercent}% paid</p>
              </CardContent>
            </Card>

            {/* Pay button — only show if there's a balance */}
            {balance > 0 && (
              <Button className="w-full h-11 font-semibold" onClick={() => setShowPay(true)}>
                <CreditCard className="h-4 w-4 mr-2" />
                Make Payment
              </Button>
            )}

            {balance <= 0 && (
              <div className="flex items-center justify-center gap-2 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-medium">Fees fully paid</span>
              </div>
            )}

            {/* Payment history */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Receipt className="h-4 w-4" /> Payment History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!financeData.payments?.length ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No payments recorded</p>
                ) : (
                  financeData.payments.map((p: any) => (
                    <div key={p._id} className="flex justify-between py-2.5 border-b last:border-0 text-sm">
                      <div>
                        <p className="font-semibold text-emerald-600">KSH {p.amount?.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.method} · {new Date(p.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium">{p.receipt}</p>
                        <p className="text-xs text-muted-foreground">{p.reference}</p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Payment dialog */}
      <Dialog open={showPay} onOpenChange={o => !o && resetDialog()}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-purple-600" /> Make Payment
            </DialogTitle>
            <DialogDescription>
              {child?.fullName} · {child?.class} · Balance: KSH {balance.toLocaleString()}
            </DialogDescription>
          </DialogHeader>

          {paid ? (
            // Success screen
            <div className="py-8 flex flex-col items-center gap-3 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <p className="font-semibold text-green-700 dark:text-green-400 text-lg">Payment Recorded!</p>
              <p className="text-sm text-muted-foreground">
                KSH {Number(form.amount).toLocaleString()} via {form.method}
              </p>
              {receipt && (
                <div className="bg-muted rounded-lg px-4 py-2 text-sm">
                  Receipt: <span className="font-bold">{receipt}</span>
                </div>
              )}
              <Button className="mt-2" onClick={resetDialog}>Done</Button>
            </div>
          ) : (
            <div className="space-y-4">

              {/* Amount */}
              <div className="space-y-1.5">
                <Label>Amount (KSH) *</Label>
                <Input
                  type="number" min={1} max={balance}
                  placeholder={`Max: KSH ${balance.toLocaleString()}`}
                  value={form.amount}
                  onChange={e => f("amount", e.target.value)}
                />
                {/* Quick fill buttons */}
                <div className="flex gap-2 flex-wrap">
                  {[balance, Math.ceil(balance / 2), 5000, 10000]
                    .filter((v, i, a) => v > 0 && a.indexOf(v) === i)
                    .slice(0, 4)
                    .map(v => (
                      <button key={v} type="button"
                        onClick={() => f("amount", String(v))}
                        className="text-xs border rounded-md px-2 py-1 hover:bg-muted transition-colors">
                        KSH {v.toLocaleString()}
                      </button>
                    ))}
                </div>
              </div>

              {/* Payment method */}
              <div className="space-y-1.5">
                <Label>Payment Method *</Label>
                <Select value={form.method} onValueChange={v => f("method", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Reference */}
              <div className="space-y-1.5">
                <Label>
                  {form.method === "M-Pesa" ? "M-Pesa Transaction Code *" :
                   form.method === "Bank Transfer" ? "Bank Reference No. *" :
                   form.method === "Cheque" ? "Cheque Number *" : "Reference *"}
                </Label>
                <Input
                  placeholder={
                    form.method === "M-Pesa" ? "e.g. QHX7Y2ABCD" :
                    form.method === "Bank Transfer" ? "e.g. TRN2024001" :
                    form.method === "Cheque" ? "e.g. CHQ001234" : "Reference number"
                  }
                  value={form.reference}
                  onChange={e => f("reference", e.target.value)}
                />
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <Label>Notes <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
                <Textarea rows={2} placeholder="Any additional notes..."
                  value={form.notes} onChange={e => f("notes", e.target.value)} />
              </div>

              <Button className="w-full h-11 font-semibold" onClick={handlePay}
                disabled={paying || !form.amount || !form.reference.trim()}>
                {paying
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing…</>
                  : <><CreditCard className="h-4 w-4 mr-2" />Submit Payment</>
                }
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Payment will be recorded and a receipt generated automatically.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <BottomNav role="parent" />
    </div>
  );
}
