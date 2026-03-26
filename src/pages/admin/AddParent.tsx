import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useRequireAuth } from "@/lib/auth";
import { auth as authApi, parentCrudApi, studentCrudApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
  X, Search, Eye, EyeOff, UserPlus, GraduationCap,
  CheckCircle2, Loader2, Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Unwrap any API response shape into an array
function toArr(res: any): any[] {
  if (Array.isArray(res))             return res;
  if (Array.isArray(res?.data))       return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  return [];
}

export default function AddParentPage() {
  useRequireAuth("admin");
  const { toast }   = useToast();
  const navigate    = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    firstName: "", lastName: "", gender: "Male", age: "",
    email: "", password: "", confirmPassword: "", phone: "",
    nationalId: "", relationship: "Father", notificationMethod: "app",
  });
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);

  // Students
  const [allStudents, setAllStudents]           = useState<any[]>([]);
  const [studentsLoading, setStudentsLoading]   = useState(true);
  const [studentSearch, setStudentSearch]       = useState("");
  const [selectedStudents, setSelectedStudents] = useState<any[]>([]);
  const [dropdownOpen, setDropdownOpen]         = useState(false);

  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  // Password strength
  const pwStrength = (pw: string) => {
    if (!pw) return null;
    if (pw.length < 6) return { label: "Too short", color: "text-red-500",    pct: 20  };
    if (pw.length < 8) return { label: "Weak",      color: "text-orange-500", pct: 40  };
    if (!/[A-Z]/.test(pw) || !/[0-9]/.test(pw))
                       return { label: "Fair",      color: "text-yellow-600", pct: 65  };
    return             { label: "Strong",    color: "text-green-600",  pct: 100 };
  };
  const strength = pwStrength(form.password);

  // Load all students
  useEffect(() => {
    studentCrudApi.getAll()
      .then(r => {
        const students = toArr(r);
        setAllStudents(students);
        if (students.length === 0) {
          toast({
            title: "No students found",
            description: "Add students first before creating parent accounts.",
            variant: "destructive",
          });
        }
      })
      .catch(e => toast({ title: "Could not load students", description: e.message, variant: "destructive" }))
      .finally(() => setStudentsLoading(false));
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Filter students
  const filteredStudents = allStudents.filter(s =>
    !selectedStudents.find(sel => sel._id === s._id) &&
    (
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(studentSearch.toLowerCase()) ||
      String(s.admissionNo).toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.class?.toLowerCase().includes(studentSearch.toLowerCase())
    )
  );

  const addStudent    = (s: any) => { setSelectedStudents(p => [...p, s]); setStudentSearch(""); setDropdownOpen(false); };
  const removeStudent = (id: string) => setSelectedStudents(p => p.filter(s => s._id !== id));

  // Submit
  const handleCreate = async () => {
    // ── Validation ──────────────────────────────────────────────
    if (!form.firstName || !form.lastName || !form.email ||
        !form.password  || !form.nationalId || !form.age ||
        !form.gender    || !form.relationship) {
      toast({ title: "Missing fields", description: "All starred fields are required.", variant: "destructive" });
      return;
    }
    if (form.password.length < 8) {
      toast({ title: "Password too short", description: "Minimum 8 characters.", variant: "destructive" });
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (selectedStudents.length === 0) {
      toast({ title: "No students linked", description: "Link at least one student.", variant: "destructive" });
      return;
    }

    const age        = Number(form.age);
    const nationalId = Number(form.nationalId);

    if (isNaN(age) || age < 18) {
      toast({ title: "Invalid age", description: "Age must be 18 or older.", variant: "destructive" });
      return;
    }
    if (isNaN(nationalId) || nationalId <= 0) {
      toast({ title: "Invalid National ID", description: "Please enter a valid National ID number.", variant: "destructive" });
      return;
    }

    setLoading(true);
    let createdUserId: string | null = null;

    // ── Step 1: Register auth account ───────────────────────────
    // authApi.register returns { token: string, role: string, user: { _id, ... } }
    try {
      const registered = await authApi.register({
        name:     `${form.firstName.trim()} ${form.lastName.trim()}`,
        email:    form.email.trim().toLowerCase(),
        password: form.password,
        role:     "parent",
      });

      // authApi.register returns { token, role, user: { id, ... } }
      // Note: backend sends "id" not "_id" — see authController.js register()
      createdUserId = registered?.user?.id ?? null;

      if (!createdUserId) {
        // Log the full response so we can debug if the shape ever changes
        console.error("Could not extract user ID from register response:", registered);
        throw new Error("Registration succeeded but returned no user ID. Check backend response.");
      }
    } catch (e: any) {
      toast({
        title: "Account registration failed",
        description: e.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // ── Step 2: Create parent profile ───────────────────────────
    try {
      await parentCrudApi.create({
        firstName:          form.firstName.trim(),
        lastName:           form.lastName.trim(),
        gender:             form.gender,
        age,
        email:              form.email.trim().toLowerCase(),
        phone:              form.phone.trim() || undefined,
        nationalId,
        relationship:       form.relationship,
        notificationMethod: form.notificationMethod,
        linkedStudents:     selectedStudents.map(s => s._id),
      });
      setDone(true);
      toast({ title: "Parent created!", description: `Linked to ${selectedStudents.length} student(s).` });
    } catch (e: any) {
      console.error("parentCrudApi.create failed:", e);

      // ── Rollback: delete the auth account we just created ─────
      // createdUserId is guaranteed non-null here because we checked above
      try {
        await authApi.deleteUser(createdUserId);
        console.log("Rolled back auth account successfully.");
      } catch (rollbackErr) {
        console.error("Rollback failed — orphaned auth account may exist for ID:", createdUserId, rollbackErr);
      }

      toast({
        title: "Failed to create parent",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ firstName: "", lastName: "", gender: "Male", age: "", email: "",
      password: "", confirmPassword: "", phone: "", nationalId: "", relationship: "Father", notificationMethod: "app" });
    setSelectedStudents([]);
    setStudentSearch("");
    setDone(false);
  };

  // Success screen
  if (done) return (
    <AdminLayout title="Add Parent">
      <Card className="max-w-lg">
        <CardContent className="py-12 flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <div>
            <p className="font-semibold text-green-700 dark:text-green-400 text-lg">Parent Created!</p>
            <p className="text-sm text-muted-foreground mt-1">
              {form.firstName} {form.lastName} can now log in.
            </p>
          </div>
          <div className="w-full bg-muted/40 rounded-lg p-3 text-left space-y-1">
            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <GraduationCap className="h-3.5 w-3.5" /> Linked students
            </p>
            {selectedStudents.map(s => (
              <div key={s._id} className="text-sm flex items-center gap-2">
                <span className="font-medium">{s.firstName} {s.lastName}</span>
                <span className="text-muted-foreground text-xs">· {s.class} · #{s.admissionNo}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/admin/parents")}>View All Parents</Button>
            <Button size="sm" onClick={resetForm}>Add Another</Button>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );

  return (
    <AdminLayout title="Add Parent">
      <Card className="max-w-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <UserPlus className="h-4 w-4" /> New Parent Account
          </CardTitle>
          <CardDescription>Creates a login account and links the parent to their child(ren).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Personal info */}
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
            <div><Label>Age *</Label><Input type="number" min={18} value={form.age} onChange={e => f("age", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Phone</Label><Input value={form.phone} onChange={e => f("phone", e.target.value)} placeholder="+254..." /></div>
            <div><Label>National ID *</Label><Input type="number" value={form.nationalId} onChange={e => f("nationalId", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Relationship *</Label>
              <Select value={form.relationship} onValueChange={v => f("relationship", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["Father","Mother","Guardian","Other"].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notification</Label>
              <Select value={form.notificationMethod} onValueChange={v => f("notificationMethod", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["app","sms","email"].map(n => <SelectItem key={n} value={n} className="capitalize">{n}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          {/* Login credentials */}
          <div className="border-t pt-4 space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Login Credentials</p>
            <div><Label>Email * (used to log in)</Label><Input type="email" value={form.email} onChange={e => f("email", e.target.value)} placeholder="parent@example.com" /></div>
            <div>
              <Label>Password *</Label>
              <div className="relative">
                <Input type={showPw ? "text" : "password"} placeholder="Min 8 characters"
                  value={form.password} onChange={e => f("password", e.target.value)} className="pr-10" />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {strength && (
                <div className="mt-1 space-y-0.5">
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all",
                      strength.pct >= 100 ? "bg-green-500" : strength.pct >= 65 ? "bg-yellow-500" :
                      strength.pct >= 40  ? "bg-orange-500" : "bg-red-500"
                    )} style={{ width: `${strength.pct}%` }} />
                  </div>
                  <p className={cn("text-xs", strength.color)}>{strength.label}</p>
                </div>
              )}
            </div>
            <div>
              <Label>Confirm Password *</Label>
              <Input type="password" placeholder="Repeat password" value={form.confirmPassword}
                onChange={e => f("confirmPassword", e.target.value)}
                className={cn(form.confirmPassword && form.confirmPassword !== form.password && "border-destructive")} />
              {form.confirmPassword && form.confirmPassword !== form.password && (
                <p className="text-xs text-destructive mt-0.5">Passwords don't match</p>
              )}
            </div>
          </div>

          {/* Link students */}
          <div className="border-t pt-4 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <GraduationCap className="h-3.5 w-3.5" /> Link Children *
            </p>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Search by name, admission number, or class. You can link multiple children.
                {!studentsLoading && ` (${allStudents.length} students available)`}
              </AlertDescription>
            </Alert>

            {/* Selected badges */}
            {selectedStudents.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-2 bg-muted/40 rounded-lg border">
                {selectedStudents.map(s => (
                  <Badge key={s._id} variant="secondary" className="flex items-center gap-1 text-xs py-1">
                    <span className="font-medium">{s.firstName} {s.lastName}</span>
                    <span className="text-muted-foreground">· {s.class} · #{s.admissionNo}</span>
                    <button type="button" onClick={() => removeStudent(s._id)}
                      className="ml-1 hover:text-red-500 transition-colors">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Search input */}
            <div className="relative" ref={dropdownRef}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder={studentsLoading ? "Loading students…" : "Type to search students…"}
                value={studentSearch}
                disabled={studentsLoading}
                onChange={e => {
                  setStudentSearch(e.target.value);
                  setDropdownOpen(true);
                }}
                onFocus={() => setDropdownOpen(true)}
              />

              {/* Dropdown */}
              {dropdownOpen && (
                <div className="absolute z-50 w-full border rounded-lg mt-1 max-h-48 overflow-y-auto bg-background shadow-md">
                  {studentsLoading ? (
                    <p className="text-xs text-muted-foreground px-3 py-3 text-center">Loading…</p>
                  ) : filteredStudents.length === 0 ? (
                    <p className="text-xs text-muted-foreground px-3 py-3 text-center">
                      {studentSearch ? "No students match your search" : "Type to search students"}
                    </p>
                  ) : (
                    filteredStudents.slice(0, 10).map(s => (
                      <button key={s._id} type="button"
                        className="w-full text-left px-3 py-2.5 text-sm hover:bg-muted transition-colors border-b last:border-0"
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => addStudent(s)}>
                        <span className="font-medium">{s.firstName} {s.lastName}</span>
                        <span className="text-muted-foreground text-xs ml-2">
                          #{s.admissionNo} · {s.class}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {selectedStudents.length === 0 && !studentsLoading && (
              <p className="text-xs text-amber-600">At least one child must be linked</p>
            )}
          </div>

          <Button className="w-full h-11 font-semibold mt-2" onClick={handleCreate}
            disabled={loading || !form.firstName || !form.email || !form.password ||
              form.password !== form.confirmPassword || selectedStudents.length === 0}>
            {loading
              ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating…</>
              : <><UserPlus className="h-4 w-4 mr-2" />Create Parent Account</>
            }
          </Button>

        </CardContent>
      </Card>
    </AdminLayout>
  );
}