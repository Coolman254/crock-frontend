import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search, Trash2, Plus, MoreVertical, KeyRound, Eye, EyeOff,
  CheckCircle2, Loader2, GraduationCap, UserCheck, Users, Shield,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useRequireAuth, useAuth } from "@/lib/auth";
import { auth as authApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const ROLE_COLORS: Record<string, string> = {
  admin:   "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  teacher: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  student: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  parent:  "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

const ROLE_ICONS: Record<string, React.ElementType> = {
  admin: Shield, teacher: UserCheck, student: GraduationCap, parent: Users,
};

export default function UsersPage() {
  const { user: me } = useAuth();
  const { loading: authLoading } = useRequireAuth("admin");
  const navigate = useNavigate();
  const { toast } = useToast();

  const [users, setUsers]               = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [roleFilter, setRoleFilter]     = useState("all");
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  // Password reset dialog (for admin/teacher/parent — User accounts)
  const [resetTarget, setResetTarget]   = useState<any>(null);
  const [newPassword, setNewPassword]   = useState("");
  const [confirmPw, setConfirmPw]       = useState("");
  const [showPw, setShowPw]             = useState(false);
  const [resetting, setResetting]       = useState(false);
  const [resetDone, setResetDone]       = useState(false);

  // Student portal password dialog
  const [studentTarget, setStudentTarget]       = useState<any>(null);
  const [studentAdmNo, setStudentAdmNo]         = useState("");
  const [studentPw, setStudentPw]               = useState("");
  const [studentConfirm, setStudentConfirm]     = useState("");
  const [showStudentPw, setShowStudentPw]       = useState(false);
  const [settingStudentPw, setSettingStudentPw] = useState(false);
  const [studentPwDone, setStudentPwDone]       = useState(false);

  const fetchUsers = () => {
    setLoading(true);
    authApi.getUsers()
      .then((r) => setUsers(r.data || []))
      .catch((e) => toast({ title: "Error", description: e.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (!authLoading) fetchUsers(); }, [authLoading]);

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await authApi.deleteUser(deleteTarget._id);
      toast({ title: "User deleted", description: `${deleteTarget.name} has been removed.` });
      setDeleteTarget(null);
      fetchUsers();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  // ── Reset staff password (User accounts only) ───────────────────────────────
  const openReset = (u: any) => {
    setResetTarget(u);
    setNewPassword(""); setConfirmPw(""); setShowPw(false); setResetDone(false);
  };

  const handleReset = async () => {
    if (newPassword.length < 6) {
      toast({ title: "Password too short", description: "Minimum 6 characters.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPw) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    setResetting(true);
    try {
      await authApi.resetPassword(resetTarget._id, newPassword);
      setResetDone(true);
      toast({ title: "Password updated!", description: `${resetTarget.name}'s password has been changed.` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setResetting(false); }
  };

  // ── Student portal password ─────────────────────────────────────────────────
  const openStudentPw = (u: any) => {
    setStudentTarget(u);
    // ✅ Pre-fill admission number if available from the student entry
    setStudentAdmNo(u.admissionNo ? String(u.admissionNo) : "");
    setStudentPw(""); setStudentConfirm(""); setShowStudentPw(false); setStudentPwDone(false);
  };

  const handleStudentPw = async () => {
    if (!studentAdmNo.trim() || !studentPw) {
      toast({ title: "Missing fields", variant: "destructive" });
      return;
    }
    if (studentPw.length < 6) {
      toast({ title: "Password too short", description: "Minimum 6 characters.", variant: "destructive" });
      return;
    }
    if (studentPw !== studentConfirm) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    setSettingStudentPw(true);
    try {
      await authApi.setStudentPassword(studentAdmNo.trim(), studentPw);
      setStudentPwDone(true);
      toast({ title: "Student password set!", description: `Adm ${studentAdmNo} can now log in.` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setSettingStudentPw(false); }
  };

  // ── Filter ──────────────────────────────────────────────────────────────────
  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matches =
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      // ✅ Also search by admission number for students
      (u.admissionNo && String(u.admissionNo).toLowerCase().includes(q)) ||
      (u.class && u.class.toLowerCase().includes(q));
    return matches && (roleFilter === "all" || u.role === roleFilter);
  });

  const counts = {
    all: users.length,
    ...Object.fromEntries(
      ["admin","teacher","student","parent"].map(r => [r, users.filter(u => u.role === r).length])
    )
  };

  return (
    <AdminLayout title="Users">
      <div className="space-y-4">

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-2 justify-between">
          <div className="flex gap-2 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search name, email, admission no…" className="pl-9 h-10" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-36 h-10"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All ({counts.all})</SelectItem>
                {["admin","teacher","student","parent"].map(r => (
                  <SelectItem key={r} value={r} className="capitalize">
                    {r[0].toUpperCase()+r.slice(1)} ({counts[r] ?? 0})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => navigate("/admin/add-user")} size="sm" className="h-10">
            <Plus className="h-4 w-4 mr-1.5" />Add User
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">{filtered.length} user{filtered.length !== 1 ? "s" : ""} found</p>

        {/* List */}
        {loading
          ? [...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)
          : filtered.length === 0
          ? <Card><CardContent className="py-14 text-center text-muted-foreground">No users found</CardContent></Card>
          : filtered.map((u) => {
              const RoleIcon = ROLE_ICONS[u.role] || Users;
              const isSelf = u._id === me?.id;
              return (
                <Card key={u._id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn("h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0", ROLE_COLORS[u.role] || "bg-muted text-muted-foreground")}>
                        <RoleIcon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-medium text-sm truncate">{u.name}</p>
                          {isSelf && <span className="text-[10px] text-muted-foreground bg-muted px-1.5 rounded">(you)</span>}
                        </div>
                        {/* ✅ Students show admission no + class, others show email */}
                        {u.role === "student" && !u.isUserAccount ? (
                          <p className="text-xs text-muted-foreground">
                            Adm: {u.admissionNo} · {u.class}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium capitalize", ROLE_COLORS[u.role])}>
                        {u.role}
                      </span>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          {/* ✅ Students always use student-auth password, others use User password */}
                          {u.role === "student" ? (
                            <DropdownMenuItem onClick={() => openStudentPw(u)}>
                              <KeyRound className="h-4 w-4 mr-2 text-purple-500" />Set Portal Password
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => openReset(u)}>
                              <KeyRound className="h-4 w-4 mr-2 text-blue-500" />Reset Password
                            </DropdownMenuItem>
                          )}
                          {!isSelf && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setDeleteTarget(u)} className="text-destructive focus:text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" />Delete User
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              );
            })
        }
      </div>

      {/* Reset Staff Password Dialog */}
      <Dialog open={!!resetTarget} onOpenChange={o => { if (!o && !resetting) { setResetTarget(null); setResetDone(false); } }}>
        <DialogContent className="w-[95vw] max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-blue-500" />Reset Password
            </DialogTitle>
            <DialogDescription>Set a new password for <b>{resetTarget?.name}</b></DialogDescription>
          </DialogHeader>
          {resetDone ? (
            <div className="py-6 flex flex-col items-center gap-3 text-center">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
              <p className="font-semibold text-green-700 dark:text-green-400">Password Updated!</p>
              <p className="text-sm text-muted-foreground">{resetTarget?.name} can now log in with the new password.</p>
              <Button size="sm" onClick={() => { setResetTarget(null); setResetDone(false); }}>Done</Button>
            </div>
          ) : (
            <>
              <div className="space-y-3 py-1">
                <div className="space-y-1.5">
                  <Label>New Password</Label>
                  <div className="relative">
                    <Input type={showPw ? "text" : "password"} placeholder="Min 6 characters"
                      value={newPassword} onChange={e => setNewPassword(e.target.value)} className="h-11 pr-10" />
                    <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Confirm Password</Label>
                  <Input type="password" placeholder="Repeat password" value={confirmPw}
                    onChange={e => setConfirmPw(e.target.value)}
                    className={cn("h-11", confirmPw && confirmPw !== newPassword && "border-destructive")} />
                  {confirmPw && confirmPw !== newPassword && <p className="text-xs text-destructive">Passwords don't match</p>}
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setResetTarget(null)} disabled={resetting}>Cancel</Button>
                <Button onClick={handleReset} disabled={resetting || !newPassword || newPassword !== confirmPw} className="bg-blue-600 hover:bg-blue-700 text-white">
                  {resetting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Updating…</> : "Update Password"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Student Portal Password Dialog */}
      <Dialog open={!!studentTarget} onOpenChange={o => { if (!o && !settingStudentPw) { setStudentTarget(null); setStudentPwDone(false); } }}>
        <DialogContent className="w-[95vw] max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-purple-500" />Set Student Portal Password
            </DialogTitle>
            <DialogDescription>
              Students log in with their admission number. Confirm it below and set a password.
            </DialogDescription>
          </DialogHeader>
          {studentPwDone ? (
            <div className="py-6 flex flex-col items-center gap-3 text-center">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
              <p className="font-semibold text-green-700 dark:text-green-400">Password Set!</p>
              <p className="text-sm text-muted-foreground">Student Adm <b>{studentAdmNo}</b> can now log in.</p>
              <Button size="sm" onClick={() => { setStudentTarget(null); setStudentPwDone(false); }}>Done</Button>
            </div>
          ) : (
            <>
              <div className="space-y-3 py-1">
                <div className="space-y-1.5">
                  <Label>Admission Number</Label>
                  {/* ✅ Pre-filled from the student entry */}
                  <Input placeholder="e.g. 10045" value={studentAdmNo}
                    onChange={e => setStudentAdmNo(e.target.value)} inputMode="numeric" className="h-11" />
                </div>
                <div className="space-y-1.5">
                  <Label>New Password</Label>
                  <div className="relative">
                    <Input type={showStudentPw ? "text" : "password"} placeholder="Min 6 characters"
                      value={studentPw} onChange={e => setStudentPw(e.target.value)} className="h-11 pr-10" />
                    <button type="button" onClick={() => setShowStudentPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showStudentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Confirm Password</Label>
                  <Input type="password" placeholder="Repeat password" value={studentConfirm}
                    onChange={e => setStudentConfirm(e.target.value)}
                    className={cn("h-11", studentConfirm && studentConfirm !== studentPw && "border-destructive")} />
                  {studentConfirm && studentConfirm !== studentPw && <p className="text-xs text-destructive">Passwords don't match</p>}
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setStudentTarget(null)} disabled={settingStudentPw}>Cancel</Button>
                <Button onClick={handleStudentPw} disabled={settingStudentPw || !studentAdmNo || !studentPw || studentPw !== studentConfirm} className="bg-purple-600 hover:bg-purple-700 text-white">
                  {settingStudentPw ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Setting…</> : "Set Password"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={o => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <b>{deleteTarget?.name}</b>. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}