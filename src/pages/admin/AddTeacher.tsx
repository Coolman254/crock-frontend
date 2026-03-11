import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useRequireAuth } from "@/lib/auth";
import { teacherCrudApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export default function AddTeacherPage() {
  const { user, loading: authLoading } = useRequireAuth("admin");
  const { toast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: "", lastName: "", gender: "Male", age: "",
    email: "", password: "", phone: "",
    teacherId: "", subject: "", salaryKsh: "", employmentType: "fulltime", classesAssigned: "",
  });
  const [loading, setLoading] = useState(false);

  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleCreate = async () => {
    if (!form.firstName || !form.lastName || !form.email || !form.password || !form.teacherId || !form.subject || !form.salaryKsh || !form.age || !form.gender) {
      toast({ title: "Missing fields", description: "All starred fields are required.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      // ✅ Single call to /api/teachers — backend handles both User + Teacher creation
      await teacherCrudApi.create({
        firstName: form.firstName,
        lastName: form.lastName,
        gender: form.gender,
        age: Number(form.age),
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
        teacherId: form.teacherId,
        subject: form.subject,
        salaryKsh: Number(form.salaryKsh),
        employmentType: form.employmentType,
        classesAssigned: form.classesAssigned || undefined,
      });
      toast({ title: "Teacher added!", description: `${form.firstName} ${form.lastName} created.` });
      navigate("/admin/teachers");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Add Teacher">
      <Card className="max-w-lg">
        <CardHeader><CardTitle className="text-base">New Teacher</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>First Name *</Label><Input value={form.firstName} onChange={e => f("firstName", e.target.value)} /></div>
            <div><Label>Last Name *</Label><Input value={form.lastName} onChange={e => f("lastName", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Gender *</Label>
              <Select value={form.gender} onValueChange={v => f("gender", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["Male","Female","Other"].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Age *</Label><Input type="number" value={form.age} onChange={e => f("age", e.target.value)} /></div>
          </div>
          <div><Label>Email * (used for login)</Label><Input type="email" value={form.email} onChange={e => f("email", e.target.value)} placeholder="teacher@globaltech.ac.ke" /></div>
          <div><Label>Login Password *</Label><Input type="password" value={form.password} onChange={e => f("password", e.target.value)} placeholder="Min 8 characters" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Employee ID *</Label>
              <Input value={form.teacherId} onChange={e => f("teacherId", e.target.value)} placeholder="e.g. T001 or 1236" />
              <p className="text-[11px] text-muted-foreground mt-1">Letters and numbers allowed (e.g. T1236)</p>
            </div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={e => f("phone", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Subject *</Label><Input value={form.subject} onChange={e => f("subject", e.target.value)} placeholder="Mathematics" /></div>
            <div><Label>Salary (KSH) *</Label><Input type="number" value={form.salaryKsh} onChange={e => f("salaryKsh", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Employment Type</Label>
              <Select value={form.employmentType} onValueChange={v => f("employmentType", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["fulltime","parttime","contract"].map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Classes (comma-separated)</Label><Input value={form.classesAssigned} onChange={e => f("classesAssigned", e.target.value)} placeholder="Form 1, Form 2" /></div>
          </div>
          <Button className="w-full" onClick={handleCreate} disabled={loading}>
            {loading ? "Creating..." : "Create Teacher"}
          </Button>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
