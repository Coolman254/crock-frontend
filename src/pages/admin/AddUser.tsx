import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useRequireAuth } from "@/lib/auth";
import { auth as authApi, studentCrudApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2, Eye, EyeOff, UserPlus, GraduationCap,
  Info, Loader2, Shield, Users, UserCheck
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Staff form (teacher / parent / admin) ────────────────────────────────────
function StaffForm() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "", role: "teacher" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const pwStrength = (pw: string) => {
    if (!pw) return null;
    if (pw.length < 6) return { label: "Too short", color: "text-red-500", pct: 20 };
    if (pw.length < 8) return { label: "Weak", color: "text-orange-500", pct: 40 };
    if (!/[A-Z]/.test(pw) || !/[0-9]/.test(pw)) return { label: "Fair", color: "text-yellow-600", pct: 65 };
    return { label: "Strong", color: "text-green-600", pct: 100 };
  };

  const strength = pwStrength(form.password);

  const handleCreate = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password || !form.role) {
      toast({ title: "Missing fields", description: "All fields are required.", variant: "destructive" });
      return;
    }
    if (form.password.length < 8) {
      toast({ title: "Password too short", description: "Password must be at least 8 characters.", variant: "destructive" });
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await authApi.register({ name: form.name.trim(), email: form.email.trim().toLowerCase(), password: form.password, role: form.role });
      setDone(true);
      toast({ title: "Account created!", description: `${form.role} account for ${form.name} is ready.` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  if (done) return (
    <div className="py-10 flex flex-col items-center gap-4 text-center">
      <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
        <CheckCircle2 className="h-8 w-8 text-green-600" />
      </div>
      <div>
        <p className="font-semibold text-green-700 dark:text-green-400">Account Created!</p>
        <p className="text-sm text-muted-foreground mt-1">{form.name} can now log in with their email and password.</p>
      </div>
      <div className="flex gap-2 mt-2">
        <Button variant="outline" size="sm" onClick={() => navigate("/admin/users")}>View All Users</Button>
        <Button size="sm" onClick={() => { setForm({ name: "", email: "", password: "", confirmPassword: "", role: "teacher" }); setDone(false); }}>
          Add Another
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-1.5">
          <Label>Full Name <span className="text-destructive">*</span></Label>
          <Input placeholder="e.g. Jane Mwangi" value={form.name} onChange={e => f("name", e.target.value)} className="h-11" />
        </div>
        <div className="space-y-1.5">
          <Label>Email Address <span className="text-destructive">*</span></Label>
          <Input type="email" placeholder="jane@globaltech.ac.ke" value={form.email} onChange={e => f("email", e.target.value)} className="h-11" />
        </div>
        <div className="space-y-1.5">
          <Label>Role <span className="text-destructive">*</span></Label>
          <Select value={form.role} onValueChange={v => f("role", v)}>
            <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[
                { v: "teacher", label: "Teacher", icon: UserCheck },
                { v: "parent", label: "Parent", icon: Users },
                { v: "admin", label: "Admin", icon: Shield },
              ].map(({ v, label, icon: Icon }) => (
                <SelectItem key={v} value={v}>
                  <div className="flex items-center gap-2"><Icon className="h-4 w-4" />{label}</div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Password <span className="text-destructive">*</span></Label>
          <div className="relative">
            <Input
              type={showPw ? "text" : "password"}
              placeholder="Min 8 characters"
              value={form.password}
              onChange={e => f("password", e.target.value)}
              className="h-11 pr-10"
            />
            <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {strength && (
            <div className="space-y-1">
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className={cn("h-full rounded-full transition-all", strength.pct >= 100 ? "bg-green-500" : strength.pct >= 65 ? "bg-yellow-500" : strength.pct >= 40 ? "bg-orange-500" : "bg-red-500")} style={{ width: `${strength.pct}%` }} />
              </div>
              <p className={cn("text-xs", strength.color)}>{strength.label}</p>
            </div>
          )}
        </div>
        <div className="space-y-1.5">
          <Label>Confirm Password <span className="text-destructive">*</span></Label>
          <Input
            type="password"
            placeholder="Repeat password"
            value={form.confirmPassword}
            onChange={e => f("confirmPassword", e.target.value)}
            className={cn("h-11", form.confirmPassword && form.confirmPassword !== form.password && "border-destructive")}
          />
          {form.confirmPassword && form.confirmPassword !== form.password && (
            <p className="text-xs text-destructive">Passwords don't match</p>
          )}
        </div>
      </div>
      <Button
        className="w-full h-11 font-semibold"
        onClick={handleCreate}
        disabled={loading || !form.name || !form.email || !form.password || form.password !== form.confirmPassword}
      >
        {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating…</> : <><UserPlus className="h-4 w-4 mr-2" />Create Account</>}
      </Button>
    </div>
  );
}

// ── Student portal password form ─────────────────────────────────────────────
function StudentPasswordForm() {
  const { toast } = useToast();
  const [admNo, setAdmNo] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSet = async () => {
    if (!admNo.trim() || !password) {
      toast({ title: "Missing fields", description: "Admission number and password are required.", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Password too short", description: "Minimum 6 characters.", variant: "destructive" });
      return;
    }
    if (password !== confirmPw) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await authApi.setStudentPassword(admNo.trim(), password);
      setDone(true);
      toast({ title: "Password set!", description: `Student ${admNo} can now log in to the portal.` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  if (done) return (
    <div className="py-10 flex flex-col items-center gap-4 text-center">
      <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
        <CheckCircle2 className="h-8 w-8 text-green-600" />
      </div>
      <div>
        <p className="font-semibold text-green-700 dark:text-green-400">Password Set!</p>
        <p className="text-sm text-muted-foreground mt-1">Adm No <b>{admNo}</b> can now log in as a student.</p>
      </div>
      <Button size="sm" onClick={() => { setAdmNo(""); setPassword(""); setConfirmPw(""); setDone(false); }}>
        Set Another
      </Button>
    </div>
  );

  return (
    <div className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Students log in using their <b>Admission Number</b> — not email. Use this form to activate their portal access. The student record must already exist.
        </AlertDescription>
      </Alert>
      <div className="space-y-1.5">
        <Label>Admission Number <span className="text-destructive">*</span></Label>
        <Input
          placeholder="e.g. 10045"
          value={admNo}
          onChange={e => setAdmNo(e.target.value)}
          inputMode="numeric"
          className="h-11"
        />
      </div>
      <div className="space-y-1.5">
        <Label>Portal Password <span className="text-destructive">*</span></Label>
        <div className="relative">
          <Input
            type={showPw ? "text" : "password"}
            placeholder="Min 6 characters"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="h-11 pr-10"
          />
          <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Confirm Password <span className="text-destructive">*</span></Label>
        <Input
          type="password"
          placeholder="Repeat password"
          value={confirmPw}
          onChange={e => setConfirmPw(e.target.value)}
          className={cn("h-11", confirmPw && confirmPw !== password && "border-destructive")}
        />
        {confirmPw && confirmPw !== password && <p className="text-xs text-destructive">Passwords don't match</p>}
      </div>
      <Button
        className="w-full h-11 font-semibold"
        onClick={handleSet}
        disabled={loading || !admNo || !password || password !== confirmPw}
      >
        {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Setting…</> : <><GraduationCap className="h-4 w-4 mr-2" />Set Student Password</>}
      </Button>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function AddUserPage() {
  useRequireAuth("admin");

  return (
    <AdminLayout title="Add User / Set Password">
      <div className="max-w-lg space-y-2">
        <Tabs defaultValue="staff">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="staff" className="flex-1">
              <UserPlus className="h-4 w-4 mr-2" />Staff / Admin Account
            </TabsTrigger>
            <TabsTrigger value="student" className="flex-1">
              <GraduationCap className="h-4 w-4 mr-2" />Student Portal
            </TabsTrigger>
          </TabsList>

          <TabsContent value="staff">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Create Login Account</CardTitle>
                <CardDescription>For teachers, parents, and admin. They log in with email + password.</CardDescription>
              </CardHeader>
              <CardContent><StaffForm /></CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="student">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Activate Student Portal</CardTitle>
                <CardDescription>Set or reset a student's portal password using their admission number.</CardDescription>
              </CardHeader>
              <CardContent><StudentPasswordForm /></CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
