import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useRequireAuth } from "@/lib/auth";
import { auth as authApi, parentCrudApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export default function AddParentPage() {
  const { user, loading: authLoading } = useRequireAuth("admin");
  const { toast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "", phone: "", relationship: "parent", linkedStudentIds: "" });
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    try {
      await authApi.register({ name: `${form.firstName} ${form.lastName}`, email: form.email, password: form.password, role: "parent" });
      await parentCrudApi.create({
        firstName: form.firstName, lastName: form.lastName, email: form.email,
        phone: form.phone, relationship: form.relationship,
        linkedStudents: form.linkedStudentIds ? form.linkedStudentIds.split(",").map(s => s.trim()) : [],
      });
      toast({ title: "Parent added!" });
      navigate("/admin/parents");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  return (
    <AdminLayout title="Add Parent">
      <Card className="max-w-lg">
        <CardHeader><CardTitle className="text-base">New Parent</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>First Name</Label><Input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} /></div>
            <div><Label>Last Name</Label><Input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} /></div>
          </div>
          <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
          <div><Label>Password</Label><Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
            <div><Label>Relationship</Label><Input value={form.relationship} onChange={e => setForm(f => ({ ...f, relationship: e.target.value }))} /></div>
          </div>
          <div><Label>Linked Student IDs (comma-separated MongoDB _ids)</Label><Input value={form.linkedStudentIds} onChange={e => setForm(f => ({ ...f, linkedStudentIds: e.target.value }))} placeholder="id1, id2" /></div>
          <Button className="w-full" onClick={handleCreate} disabled={!form.firstName || !form.email || !form.password || loading}>
            {loading ? "Creating..." : "Create Parent"}
          </Button>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
