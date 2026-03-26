import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useRequireAuth } from "@/lib/auth";
import { studentCrudApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Loader2, GraduationCap } from "lucide-react";

export default function AddStudentPage() {
  useRequireAuth("admin");
  const { toast }  = useToast();
  const navigate   = useNavigate();
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);
  const [created, setCreated] = useState<any>(null);

  const [form, setForm] = useState({
    // Required
    firstName:   "",
    lastName:    "",
    gender:      "Male",
    age:         "",
    admissionNo: "",
    class:       "",
    // Optional personal
    email:       "",
    subjects:    "",
    // Optional parent info
    parentName:  "",
    parentPhone: "",
    parentEmail: "",
    // Optional finance
    totalFees:   "",
    amountPaid:  "",
  });

  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleCreate = async () => {
    // Validate required fields (matches backend: firstName, lastName, gender, age, admissionNo, class)
    if (!form.firstName || !form.lastName || !form.gender || !form.age || !form.admissionNo || !form.class) {
      toast({ title: "Missing fields", description: "First name, last name, gender, age, admission number and class are required.", variant: "destructive" });
      return;
    }

    const age         = Number(form.age);
    const admissionNo = Number(form.admissionNo);
    const totalFees   = form.totalFees   ? Number(form.totalFees)   : 0;
    const amountPaid  = form.amountPaid  ? Number(form.amountPaid)  : 0;

    if (isNaN(age) || age <= 0) {
      toast({ title: "Invalid age", description: "Age must be a positive number.", variant: "destructive" });
      return;
    }
    if (isNaN(admissionNo) || admissionNo <= 0) {
      toast({ title: "Invalid admission number", description: "Admission number must be a positive number.", variant: "destructive" });
      return;
    }
    if (amountPaid > totalFees && totalFees > 0) {
      toast({ title: "Invalid fees", description: "Amount paid cannot exceed total fees.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Single call — backend handles everything, no auth account needed for students
      const res = await studentCrudApi.create({
        firstName:   form.firstName.trim(),
        lastName:    form.lastName.trim(),
        gender:      form.gender,
        age,
        admissionNo,
        class:       form.class.trim(),
        email:       form.email.trim()       || undefined,
        subjects:    form.subjects.trim()    || undefined,
        parentName:  form.parentName.trim()  || undefined,
        parentPhone: form.parentPhone.trim() || undefined,
        parentEmail: form.parentEmail.trim() || undefined,
        totalFees,
        amountPaid,
      });
      setCreated(res?.student || res);
      setDone(true);
      toast({ title: "Student registered!", description: `${form.firstName} ${form.lastName} added successfully.` });
    } catch (e: any) {
      toast({ title: "Failed to create student", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      firstName: "", lastName: "", gender: "Male", age: "", admissionNo: "",
      class: "", email: "", subjects: "", parentName: "", parentPhone: "",
      parentEmail: "", totalFees: "", amountPaid: "",
    });
    setDone(false);
    setCreated(null);
  };

  // ── Success screen ────────────────────────────────────────────────────────
  if (done) return (
    <AdminLayout title="Add Student">
      <Card className="max-w-lg">
        <CardContent className="py-12 flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <div>
            <p className="font-semibold text-green-700 dark:text-green-400 text-lg">Student Registered!</p>
            <p className="text-sm text-muted-foreground mt-1">
              {form.firstName} {form.lastName} has been added.
            </p>
          </div>
          {created && (
            <div className="w-full bg-muted/40 rounded-lg p-3 text-left space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Admission No</span>
                <span className="font-medium">#{created.admissionNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Class</span>
                <span className="font-medium">{created.class}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gender</span>
                <span className="font-medium">{created.gender}</span>
              </div>
              {created.email && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium">{created.email}</span>
                </div>
              )}
            </div>
          )}
          <div className="flex gap-2 mt-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/admin/students")}>
              View All Students
            </Button>
            <Button size="sm" onClick={resetForm}>
              Add Another
            </Button>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <AdminLayout title="Add Student">
      <Card className="max-w-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <GraduationCap className="h-4 w-4" /> New Student
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Required fields */}
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
                  {["Male", "Female", "Other"].map(g => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Age *</Label><Input type="number" min={1} value={form.age} onChange={e => f("age", e.target.value)} /></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Admission No *</Label>
              <Input type="number" value={form.admissionNo} onChange={e => f("admissionNo", e.target.value)} placeholder="e.g. 1001" />
              <p className="text-[11px] text-muted-foreground mt-1">Must be unique — numbers only</p>
            </div>
            <div>
              <Label>Class *</Label>
              <Input value={form.class} onChange={e => f("class", e.target.value)} placeholder="e.g. Form 2" />
            </div>
          </div>

          {/* Optional personal */}
          <div className="border-t pt-4 space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Optional Details</p>
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={e => f("email", e.target.value)} placeholder="student@example.com" />
            </div>
            <div>
              <Label>Subjects</Label>
              <Input value={form.subjects} onChange={e => f("subjects", e.target.value)} placeholder="Math, English, Science" />
              <p className="text-[11px] text-muted-foreground mt-1">Comma-separated list</p>
            </div>
          </div>

          {/* Parent info */}
          <div className="border-t pt-4 space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Parent / Guardian Info</p>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Parent Name</Label><Input value={form.parentName} onChange={e => f("parentName", e.target.value)} /></div>
              <div><Label>Parent Phone</Label><Input value={form.parentPhone} onChange={e => f("parentPhone", e.target.value)} placeholder="+254..." /></div>
            </div>
            <div>
              <Label>Parent Email</Label>
              <Input type="email" value={form.parentEmail} onChange={e => f("parentEmail", e.target.value)} />
            </div>
          </div>

          {/* Finance */}
          <div className="border-t pt-4 space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Fees</p>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Total Fees (KSH)</Label><Input type="number" min={0} value={form.totalFees} onChange={e => f("totalFees", e.target.value)} placeholder="0" /></div>
              <div><Label>Amount Paid (KSH)</Label><Input type="number" min={0} value={form.amountPaid} onChange={e => f("amountPaid", e.target.value)} placeholder="0" /></div>
            </div>
          </div>

          <Button className="w-full h-11 font-semibold mt-2" onClick={handleCreate} disabled={loading}>
            {loading
              ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Registering…</>
              : <><GraduationCap className="h-4 w-4 mr-2" />Register Student</>
            }
          </Button>

        </CardContent>
      </Card>
    </AdminLayout>
  );
}