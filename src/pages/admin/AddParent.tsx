import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useRequireAuth } from "@/lib/auth";
import { auth as authApi, parentCrudApi, studentCrudApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { X, Search } from "lucide-react";

export default function AddParentPage() {
  const { user, loading: authLoading } = useRequireAuth("admin");
  const { toast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: "", lastName: "", gender: "Male", age: "",
    email: "", password: "", phone: "",
    nationalId: "", relationship: "Father",
    notificationMethod: "app",
  });

  const [loading, setLoading] = useState(false);

  // Student search & selection
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<any[]>([]);

  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  // Load all students on mount for linking
  useEffect(() => {
    studentCrudApi.getAll()
      .then(r => setAllStudents(Array.isArray(r) ? r : r.data || []))
      .catch(() => {});
  }, []);

  const filteredStudents = allStudents.filter(s =>
    !selectedStudents.find(sel => sel._id === s._id) &&
    (
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.admissionNo?.toLowerCase().includes(studentSearch.toLowerCase())
    )
  );

  const addStudent = (student: any) => {
    setSelectedStudents(prev => [...prev, student]);
    setStudentSearch("");
  };

  const removeStudent = (id: string) => {
    setSelectedStudents(prev => prev.filter(s => s._id !== id));
  };

  const handleCreate = async () => {
    if (!form.firstName || !form.lastName || !form.email || !form.password || !form.nationalId || !form.age || !form.gender || !form.relationship) {
      toast({ title: "Missing fields", description: "All starred fields are required.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      // 1. Create login account (User) — parent needs a login
      await authApi.register({
        name: `${form.firstName} ${form.lastName}`,
        email: form.email,
        password: form.password,
        role: "parent",
      });

      // 2. Create Parent profile with linked students
      await parentCrudApi.create({
        firstName: form.firstName,
        lastName: form.lastName,
        gender: form.gender,
        age: Number(form.age),
        email: form.email,
        phone: form.phone || undefined,
        nationalId: Number(form.nationalId),
        relationship: form.relationship,
        notificationMethod: form.notificationMethod,
        // ✅ Send array of student MongoDB _ids
        linkedStudents: selectedStudents.map(s => s._id),
      });

      toast({ title: "Parent added!", description: `${form.firstName} ${form.lastName} created and linked to ${selectedStudents.length} student(s).` });
      navigate("/admin/parents");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Add Parent">
      <Card className="max-w-lg">
        <CardHeader><CardTitle className="text-base">New Parent</CardTitle></CardHeader>
        <CardContent className="space-y-4">

          {/* Name */}
          <div className="grid grid-cols-2 gap-3">
            <div><Label>First Name *</Label><Input value={form.firstName} onChange={e => f("firstName", e.target.value)} /></div>
            <div><Label>Last Name *</Label><Input value={form.lastName} onChange={e => f("lastName", e.target.value)} /></div>
          </div>

          {/* Gender & Age */}
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

          {/* Email & Password */}
          <div><Label>Email * (used for login)</Label><Input type="email" value={form.email} onChange={e => f("email", e.target.value)} placeholder="parent@example.com" /></div>
          <div><Label>Login Password *</Label><Input type="password" value={form.password} onChange={e => f("password", e.target.value)} placeholder="Min 8 characters" /></div>

          {/* Phone & National ID */}
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Phone</Label><Input value={form.phone} onChange={e => f("phone", e.target.value)} /></div>
            <div><Label>National ID *</Label><Input type="number" value={form.nationalId} onChange={e => f("nationalId", e.target.value)} /></div>
          </div>

          {/* Relationship & Notification */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Relationship *</Label>
              <Select value={form.relationship} onValueChange={v => f("relationship", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["Father","Mother","Guardian","Other"].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notification Method</Label>
              <Select value={form.notificationMethod} onValueChange={v => f("notificationMethod", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["app","sms","email"].map(n => <SelectItem key={n} value={n} className="capitalize">{n}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          {/* ✅ Student linking — search and select */}
          <div>
            <Label>Link Students</Label>
            <p className="text-[11px] text-muted-foreground mb-1">Search by name or admission number</p>

            {/* Selected students */}
            {selectedStudents.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {selectedStudents.map(s => (
                  <Badge key={s._id} variant="secondary" className="flex items-center gap-1 text-xs">
                    {s.firstName} {s.lastName} ({s.admissionNo})
                    <button onClick={() => removeStudent(s._id)} className="ml-1 hover:text-red-500">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search student..."
                value={studentSearch}
                onChange={e => setStudentSearch(e.target.value)}
              />
            </div>

            {/* Dropdown results */}
            {studentSearch && filteredStudents.length > 0 && (
              <div className="border rounded-md mt-1 max-h-40 overflow-y-auto bg-background shadow-sm z-10">
                {filteredStudents.slice(0, 8).map(s => (
                  <button
                    key={s._id}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                    onClick={() => addStudent(s)}
                  >
                    {s.firstName} {s.lastName}
                    <span className="text-muted-foreground ml-2 text-xs">#{s.admissionNo}</span>
                  </button>
                ))}
              </div>
            )}
            {studentSearch && filteredStudents.length === 0 && (
              <p className="text-xs text-muted-foreground mt-1 px-1">No students found</p>
            )}
          </div>

          <Button className="w-full" onClick={handleCreate} disabled={loading}>
            {loading ? "Creating..." : "Create Parent"}
          </Button>

        </CardContent>
      </Card>
    </AdminLayout>
  );
}
