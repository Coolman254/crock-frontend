import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/layout/BottomNav";
import { useRequireAuth } from "@/lib/auth";
import { parentApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function ParentFinance() {
  const { user, loading: authLoading } = useRequireAuth("parent");
  const navigate = useNavigate();
  const { toast } = useToast();
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChildId, setSelectedChildId] = useState("");
  const [financeData, setFinanceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [finLoading, setFinLoading] = useState(false);

  useEffect(() => {
    if (authLoading || !user) return;
    parentApi.getDashboard()
      .then((r) => {
        setChildren(r.data.children || []);
        if (r.data.children?.length) {
          setSelectedChildId(r.data.children[0]._id);
        }
      })
      .catch((e) => toast({ title: "Error", description: e.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [authLoading, user]);

  useEffect(() => {
    if (!selectedChildId) return;
    setFinLoading(true);
    parentApi.getChildFinance(selectedChildId)
      .then((r) => setFinanceData(r.data))
      .catch((e) => toast({ title: "Error", description: e.message, variant: "destructive" }))
      .finally(() => setFinLoading(false));
  }, [selectedChildId]);

  const feePercent = financeData?.finance?.totalFees > 0
    ? Math.min(100, Math.round((financeData.finance.amountPaid / financeData.finance.totalFees) * 100)) : 100;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-gradient-to-r from-purple-600 to-purple-500 text-white px-4 pt-10 pb-5 sm:px-6">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/parent")} className="text-white hover:bg-white/20 -ml-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Finance</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5 space-y-4">
        {loading ? <Skeleton className="h-12 rounded-lg" /> : (
          <Select value={selectedChildId} onValueChange={setSelectedChildId}>
            <SelectTrigger><SelectValue placeholder="Select child" /></SelectTrigger>
            <SelectContent>
              {children.map(c => <SelectItem key={c._id} value={c._id}>{c.fullName} ({c.class})</SelectItem>)}
            </SelectContent>
          </Select>
        )}

        {finLoading ? [...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />) : financeData && (
          <>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Total", value: `KSH ${financeData.finance?.totalFees?.toLocaleString() ?? 0}` },
                { label: "Paid", value: `KSH ${financeData.finance?.amountPaid?.toLocaleString() ?? 0}` },
                { label: "Balance", value: `KSH ${financeData.finance?.balance?.toLocaleString() ?? 0}` },
              ].map(({ label, value }) => (
                <Card key={label} className="p-3 text-center">
                  <p className="text-xs sm:text-sm font-bold leading-tight">{value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                </Card>
              ))}
            </div>
            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Payment Progress</span>
                  <Badge variant={financeData.finance?.feeStatus === "cleared" ? "default" : financeData.finance?.feeStatus === "partial" ? "secondary" : "destructive"}>
                    {financeData.finance?.feeStatus}
                  </Badge>
                </div>
                <Progress value={feePercent} className="h-3" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Payment History</CardTitle></CardHeader>
              <CardContent>
                {!financeData.payments?.length ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No payments recorded</p>
                ) : financeData.payments.map((p: any) => (
                  <div key={p._id} className="flex justify-between py-2 border-b last:border-0 text-sm">
                    <div>
                      <p className="font-medium">KSH {p.amount?.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{p.method} · {new Date(p.date).toLocaleDateString()}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{p.reference}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        )}
      </div>
      <BottomNav role="parent" />
    </div>
  );
}
