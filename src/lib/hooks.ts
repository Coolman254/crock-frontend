import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

// ── Auth helpers ─────────────────────────────────────────────────────────────

export function useRequireAuth(requiredRole?: string) {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        navigate("/login");
        return;
      }
      if (requiredRole) {
        const { data: role } = await supabase.rpc("get_user_role", {
          _user_id: session.user.id,
        });
        if (role !== requiredRole) {
          navigate("/login");
          return;
        }
      }
      setUserId(session.user.id);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate("/login");
    });

    return () => listener.subscription.unsubscribe();
  }, [navigate, requiredRole]);

  return { userId, loading };
}

export async function signOut(navigate: ReturnType<typeof useNavigate>) {
  await supabase.auth.signOut();
  navigate("/login");
}

// ── Student hooks ─────────────────────────────────────────────────────────────

export function useStudentProfile(userId: string | null) {
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from("students")
      .select("*, parents(first_name, last_name, phone, email)")
      .eq("user_id", userId)
      .single()
      .then(({ data }) => {
        setStudent(data);
        setLoading(false);
      });
  }, [userId]);

  return { student, loading };
}

export function useStudentFees(studentId: string | null) {
  const [fees, setFees] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) return;
    Promise.all([
      supabase
        .from("student_fees")
        .select("*")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single(),
      supabase
        .from("payments")
        .select("*")
        .eq("student_id", studentId)
        .order("payment_date", { ascending: false }),
    ]).then(([feesRes, paymentsRes]) => {
      setFees(feesRes.data);
      setPayments(paymentsRes.data || []);
      setLoading(false);
    });
  }, [studentId]);

  return { fees, payments, loading };
}

export function useAnnouncements(role?: string) {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("announcements")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => {
        setAnnouncements(data || []);
        setLoading(false);
      });
  }, [role]);

  return { announcements, loading };
}

// ── Teacher hooks ─────────────────────────────────────────────────────────────

export function useTeacherProfile(userId: string | null) {
  const [teacher, setTeacher] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from("teachers")
      .select("*")
      .eq("user_id", userId)
      .single()
      .then(({ data }) => {
        setTeacher(data);
        setLoading(false);
      });
  }, [userId]);

  return { teacher, loading };
}

export function useTeacherStudents(teacherId: string | null) {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teacherId) return;
    supabase
      .from("student_teacher_assignments")
      .select("*, students(id, first_name, last_name, class, admission_no)")
      .eq("teacher_id", teacherId)
      .then(({ data }) => {
        setStudents(data?.map((a: any) => a.students).filter(Boolean) || []);
        setLoading(false);
      });
  }, [teacherId]);

  return { students, loading };
}

// ── Parent hooks ─────────────────────────────────────────────────────────────

export function useParentProfile(userId: string | null) {
  const [parent, setParent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from("parents")
      .select("*")
      .eq("user_id", userId)
      .single()
      .then(({ data }) => {
        setParent(data);
        setLoading(false);
      });
  }, [userId]);

  return { parent, loading };
}

export function useParentChildren(parentId: string | null) {
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!parentId) return;
    supabase
      .from("students")
      .select("*, student_fees(*)")
      .eq("parent_id", parentId)
      .then(({ data }) => {
        setChildren(data || []);
        setLoading(false);
      });
  }, [parentId]);

  return { children, loading };
}

// ── Admin hooks ─────────────────────────────────────────────────────────────

export function useAdminStats() {
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    parents: 0,
    announcements: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from("students").select("id", { count: "exact", head: true }),
      supabase.from("teachers").select("id", { count: "exact", head: true }),
      supabase.from("parents").select("id", { count: "exact", head: true }),
      supabase.from("announcements").select("id", { count: "exact", head: true }),
    ]).then(([s, t, p, a]) => {
      setStats({
        students: s.count || 0,
        teachers: t.count || 0,
        parents: p.count || 0,
        announcements: a.count || 0,
      });
      setLoading(false);
    });
  }, []);

  return { stats, loading };
}

export function useAllUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from("students").select("id, first_name, last_name, email, class, created_at").limit(50),
      supabase.from("teachers").select("id, first_name, last_name, email, subject, created_at").limit(50),
      supabase.from("parents").select("id, first_name, last_name, email, created_at").limit(50),
    ]).then(([students, teachers, parents]) => {
      const all = [
        ...(students.data || []).map((s: any) => ({ ...s, role: "Student", detail: s.class })),
        ...(teachers.data || []).map((t: any) => ({ ...t, role: "Teacher", detail: t.subject })),
        ...(parents.data || []).map((p: any) => ({ ...p, role: "Parent", detail: "—" })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setUsers(all);
      setLoading(false);
    });
  }, []);

  return { users, loading };
}

export function useAdminFinance() {
  const [studentFees, setStudentFees] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [feeStructures, setFeeStructures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase
        .from("student_fees")
        .select("*, students(first_name, last_name, admission_no, class)")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("payments")
        .select("*, students(first_name, last_name, admission_no)")
        .order("payment_date", { ascending: false })
        .limit(100),
      supabase.from("fee_structures").select("*").order("class"),
    ]).then(([sf, p, fs]) => {
      setStudentFees(sf.data || []);
      setPayments(p.data || []);
      setFeeStructures(fs.data || []);
      setLoading(false);
    });
  }, []);

  const refetch = () => {
    setLoading(true);
    Promise.all([
      supabase
        .from("student_fees")
        .select("*, students(first_name, last_name, admission_no, class)")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("payments")
        .select("*, students(first_name, last_name, admission_no)")
        .order("payment_date", { ascending: false })
        .limit(100),
      supabase.from("fee_structures").select("*").order("class"),
    ]).then(([sf, p, fs]) => {
      setStudentFees(sf.data || []);
      setPayments(p.data || []);
      setFeeStructures(fs.data || []);
      setLoading(false);
    });
  };

  return { studentFees, payments, feeStructures, loading, refetch };
}

export function useAdminAnnouncements() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = () => {
    supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setAnnouncements(data || []);
        setLoading(false);
      });
  };

  useEffect(() => { fetch(); }, []);

  return { announcements, loading, refetch: fetch };
}
