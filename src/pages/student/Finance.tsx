import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, DollarSign, CheckCircle, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/layout/BottomNav";
import { useRequireAuth } from "@/lib/auth";
import { studentApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function StudentFinance() {
  const { user, loading: authLoading } = useRequireAuth("student");
  const navigate = useNavigate();
  const { toast } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;
    studentApi.getFinance()
      .then((r) => setData(r.data))
      .catch((e) => toast({ title: "Error", description: e.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [authLoading, user]);

  const feePercent = data?.totalFees > 0 ? Math.min(100, Math.round((data.amountPaid / data.totalFees) * 100)) : 100;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-primary-foreground px-4 pt-10 pb-5 sm:px-6">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/student")} className="text-white hover:bg-white/20 -ml-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">My Finance</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5 space-y-4">
        {loading ? [...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />) : (<>
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Total Fees", value: `KSH ${data?.totalFees?.toLocaleString() ?? 0}`, icon: DollarSign, color: "text-blue-500" },
              { label: "Paid", value: `KSH ${data?.amountPaid?.toLocaleString() ?? 0}`, icon: CheckCircle, color: "text-green-500" },
              { label: "Balance", value: `KSH ${data?.balance?.toLocaleString() ?? 0}`, icon: AlertCircle, color: "text-orange-500" },
            ].map(({ label, value, icon: Icon, color }) => (
              <Card key={label} className="p-3 text-center">
                <Icon className={`h-4 w-4 mx-auto mb-1 ${color}`} />
                <p className="text-xs sm:text-sm font-bold leading-tight">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </Card>
            ))}
          </div>

          {/* Progress */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Payment Progress</span>
                <Badge variant={data?.feeStatus === "cleared" ? "default" : data?.feeStatus === "partial" ? "secondary" : "destructive"}>
                  {data?.feeStatus}
                </Badge>
              </div>
              <Progress value={feePercent} className="h-3" />
              <p className="text-xs text-right text-muted-foreground">{feePercent}% paid</p>
            </CardContent>
          </Card>

          {/* Payment history */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              {!data?.payments?.length ? (
                <p className="text-sm text-muted-foreground text-center py-4">No payments yet</p>
              ) : (
                <div className="space-y-2">
                  {data.payments.map((p: any) => (
                    <div key={p._id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="text-sm font-medium">KSH {p.amount?.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{p.method} · {new Date(p.date).toLocaleDateString()}</p>
                        {p.reference && <p className="text-xs text-muted-foreground">Ref: {p.reference}</p>}
                      </div>
                      <Badge variant="outline" className="text-xs">{p.receipt || "—"}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>)}
      </div>
      <BottomNav role="student" />
    </div>
  );
}
