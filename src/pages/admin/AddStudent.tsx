import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useRequireAuth } from "@/lib/auth";
import { studentCrudApi, auth as authApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export default function AddStudentPage() {
  const { user, loading: authLoading } = useRequireAuth("admin");
  const { toast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: "", lastName: "", gender: "Male", age: "",
    email: "", admissionNo: "", class: "", phone: "",
    totalFees: "", studentPassword: "",
  });
  const [loading, setLoading] = useState(false);

  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleCreate = async () => {
    if (!form.firstName || !form.lastName || !form.gender || !form.age || !form.admissionNo || !form.class) {
      toast({ title: "Missing fields", description: "First name, last name, gender, age, admission number and class are required.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      // 1. Create student profile record
      await studentCrudApi.create({
        firstName: form.firstName,
        lastName: form.lastName,
        gender: form.gender,
        age: Number(form.age),
        email: form.email || undefined,
        admissionNo: form.admissionNo,
        class: form.class,
        phone: form.phone || undefined,
        totalFees: Number(form.totalFees) || 0,
      });

      // 2. If a portal password is provided, set it via student-auth
      if (form.studentPassword) {
        await authApi.setStudentPassword(form.admissionNo, form.studentPassword);
      }

      toast({ title: "Student added!", description: `${form.firstName} ${form.lastName} (Adm: ${form.admissionNo}) created.` });
      navigate("/admin/students");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  return (
    <AdminLayout title="Add Student">
      <Card className="max-w-lg">
        <CardHeader><CardTitle className="text-base">New Student</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>Students log in with their <b>Admission Number</b> and password (set below). No email account is needed.</AlertDescription>
          </Alert>

          <div className="grid grid-cols-2 gap-3">
            <div><Label>First Name *</Label><Input value={form.firstName} onChange={e => f("firstName", e.target.value)} /></div>
            <div><Label>Last Name *</Label><Input value={form.lastName} onChange={e => f("lastName", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Gender *</Label>
              <Select value={form.gender} onValueChange={v => f("gender", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Male","Female","Other"].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Age *</Label><Input type="number" value={form.age} onChange={e => f("age", e.target.value)} min={1} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Admission No *</Label><Input value={form.admissionNo} onChange={e => f("admissionNo", e.target.value)} placeholder="12345" /></div>
            <div><Label>Class *</Label><Input value={form.class} onChange={e => f("class", e.target.value)} placeholder="Form 1" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Email (optional)</Label><Input type="email" value={form.email} onChange={e => f("email", e.target.value)} /></div>
            <div><Label>Phone (optional)</Label><Input value={form.phone} onChange={e => f("phone", e.target.value)} /></div>
          </div>
          <div><Label>Total Fees (KSH)</Label><Input type="number" value={form.totalFees} onChange={e => f("totalFees", e.target.value)} /></div>

          <div className="border-t pt-4">
            <Label>Portal Password <span className="text-muted-foreground font-normal">(optional — set so student can log in now)</span></Label>
            <Input type="password" value={form.studentPassword} onChange={e => f("studentPassword", e.target.value)} placeholder="Min 6 characters" className="mt-1" />
          </div>

          <Button className="w-full" onClick={handleCreate} disabled={loading}>
            {loading ? "Creating..." : "Create Student"}
          </Button>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
