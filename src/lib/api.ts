// Central API client — replaces Supabase
const BASE = (import.meta.env.VITE_API_URL as string) || "http://localhost:5000";

function getToken(): string | null {
  return localStorage.getItem("token");
}

async function request<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(body.message || `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export const auth = {
  login: (email: string, password: string, role: string) =>
    request<{ token: string; role: string; user: any }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password, role }),
    }),

  studentLogin: (admissionNo: string, password: string) =>
    request<{ success: boolean; token: string; data: any }>("/api/student-auth/login", {
      method: "POST",
      body: JSON.stringify({ admissionNo, password }),
    }),

  getMe: () => request<{ user: any }>("/api/auth/me"),
  getStudentMe: () => request<{ success: boolean; data: any }>("/api/student-auth/me"),

  register: (data: { name: string; email: string; password: string; role: string }) =>
    request("/api/auth/register", { method: "POST", body: JSON.stringify(data) }),

  getUsers: (role?: string) =>
    request<{ data: any[] }>(`/api/auth/users${role ? `?role=${role}` : ""}`),

  resetPassword: (id: string, password: string) =>
    request(`/api/auth/users/${id}/password`, {
      method: "PATCH",
      body: JSON.stringify({ password }),
    }),

  deleteUser: (id: string) =>
    request(`/api/auth/users/${id}`, { method: "DELETE" }),

  setStudentPassword: (admissionNo: string, password: string) =>
    request("/api/student-auth/set-password", {
      method: "POST",
      body: JSON.stringify({ admissionNo, password }),
    }),
};

// ── Student dashboard ─────────────────────────────────────────────────────────

export const studentApi = {
  getDashboard: () => request<{ data: any }>("/api/student-dashboard"),

  getGrades: (params?: string) =>
    request<{ data: any[] }>(`/api/student-dashboard/grades${params ? `?${params}` : ""}`),

  getAssignments: () => request<{ data: any[] }>("/api/student-dashboard/assignments"),

  getFinance: () => request<{ data: any }>("/api/student-dashboard/finance"),

  getMaterials: () => request<{ data: any[] }>("/api/student-dashboard/materials"),

  getMaterialDownloadUrl: (id: string) =>
    `${BASE}/api/student-dashboard/materials/${id}/download`,

  submitAssignment: (id: string, formData: FormData) => {
    const token = getToken();
    return fetch(`${BASE}/api/student-dashboard/assignments/${id}/submit`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }).then(r => r.json());
  },
};

// ── Teacher dashboard ─────────────────────────────────────────────────────────

export const teacherApi = {
  getDashboard: () => request<{ data: any }>("/api/teacher-dashboard"),

  getStudents: (cls?: string) =>
    request<{ data: any[] }>(`/api/teacher-dashboard/students${cls ? `?class=${cls}` : ""}`),

  getGrades: (params?: string) =>
    request<{ data: any[] }>(`/api/teacher-dashboard/grades${params ? `?${params}` : ""}`),

  enterGrade: (data: any) =>
    request("/api/teacher-dashboard/grades", { method: "POST", body: JSON.stringify(data) }),

  enterGradeByAdmission: (data: any) =>
    request("/api/teacher-dashboard/grades/by-admission", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getAssignments: () => request<{ data: any[] }>("/api/teacher-dashboard/assignments"),

  createAssignment: (data: any) =>
    request("/api/teacher-dashboard/assignments", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getSubmissions: (assignmentId: string) =>
    request<{ data: any[] }>(`/api/teacher-dashboard/assignments/${assignmentId}/submissions`),

  getMaterials: () => request<{ data: any[] }>("/api/teacher-dashboard/materials"),

  deleteMaterial: (id: string) =>
    request(`/api/teacher-dashboard/materials/${id}`, { method: "DELETE" }),

  uploadMaterial: (formData: FormData) => {
    const token = getToken();
    return fetch(`${BASE}/api/teacher-dashboard/materials`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }).then(r => r.json());
  },

  getMessages: () =>
    request<{ data: any[] }>("/api/teacher-dashboard/messages"),

  replyMessage: (data: { parentId: string; studentId: string; body: string }) =>
    request("/api/teacher-dashboard/messages/reply", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getAttendance: (date?: string) =>
    request<{ data: any }>(`/api/teacher-dashboard/attendance${date ? `?date=${date}` : ""}`),

  markAttendance: (data: { date: string; records: { studentId: string; status: string; remarks?: string }[] }) =>
    request("/api/teacher-dashboard/attendance", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ── Parent dashboard ──────────────────────────────────────────────────────────

export const parentApi = {
  getDashboard: () => request<{ data: any }>("/api/parent-dashboard"),

  getChildFinance: (childId: string) =>
    request<{ data: any }>(`/api/parent-dashboard/child/${childId}/finance`),

  getChildGrades: (childId: string) =>
    request<{ data: any[] }>(`/api/parent-dashboard/child/${childId}/grades`),

  getReportCard: (childId: string) =>
    request<{ data: any }>(`/api/parent-dashboard/child/${childId}/report-card`),

  getAttendance: (childId: string) =>
    request<{ data: any }>(`/api/parent-dashboard/child/${childId}/attendance`),

  makePayment: (childId: string, data: {
    amount: number; method: string; reference: string; notes?: string;
  }) =>
    request(`/api/parent-dashboard/child/${childId}/payment`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getMessages: () => request<{ data: any[] }>("/api/parent-dashboard/messages"),

  sendMessage: (data: { teacherId: string; studentId: string; body: string }) =>
    request("/api/parent-dashboard/messages", { method: "POST", body: JSON.stringify(data) }),
};

// ── Admin / Finance ───────────────────────────────────────────────────────────

export const financeApi = {
  getStats: (params?: string) =>
    request<{ data: any }>(`/api/finance/stats${params ? `?${params}` : ""}`),
  getStudents: (params?: string) =>
    request<{ data: any[] }>(`/api/finance/students${params ? `?${params}` : ""}`),
  getStudentById: (id: string) =>
    request<{ data: any }>(`/api/finance/students/${id}`),
  getPayments: (params?: string) =>
    request<{ data: any[] }>(`/api/finance/payments${params ? `?${params}` : ""}`),
  recordPayment: (data: any) =>
    request("/api/finance/payments", { method: "POST", body: JSON.stringify(data) }),
  reversePayment: (id: string) =>
    request(`/api/finance/payments/${id}`, { method: "DELETE" }),
  getFeeStructures: (params?: string) =>
    request<{ data: any[] }>(`/api/finance/fee-structures${params ? `?${params}` : ""}`),
  createFeeStructure: (data: any) =>
    request("/api/finance/fee-structures", { method: "POST", body: JSON.stringify(data) }),
  updateFeeStructure: (id: string, data: any) =>
    request(`/api/finance/fee-structures/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteFeeStructure: (id: string) =>
    request(`/api/finance/fee-structures/${id}`, { method: "DELETE" }),
};

export const announcementApi = {
  getAll: () => request<{ data: any[] }>("/api/admin-dashboard/announcements"),
  create: (data: any) =>
    request("/api/admin-dashboard/announcements", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    request(`/api/admin-dashboard/announcements/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    request(`/api/admin-dashboard/announcements/${id}`, { method: "DELETE" }),
};

export const adminGradeApi = {
  getAll: (params?: string) =>
    request<{ data: any[] }>(`/api/admin-dashboard/grades${params ? `?${params}` : ""}`),
  create: (data: any) =>
    request("/api/admin-dashboard/grades", { method: "POST", body: JSON.stringify(data) }),
  delete: (id: string) =>
    request(`/api/admin-dashboard/grades/${id}`, { method: "DELETE" }),
};

export const adminAssignmentApi = {
  getAll: (params?: string) =>
    request<{ data: any[] }>(`/api/admin-dashboard/assignments${params ? `?${params}` : ""}`),
  create: (data: any) =>
    request("/api/admin-dashboard/assignments", { method: "POST", body: JSON.stringify(data) }),
  delete: (id: string) =>
    request(`/api/admin-dashboard/assignments/${id}`, { method: "DELETE" }),
};

export const studentCrudApi = {
  getAll: (params?: string) =>
    request<any>(`/api/students${params ? `?${params}` : ""}`),
  create: (data: any) =>
    request("/api/students", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    request(`/api/students/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) =>
    request(`/api/students/${id}`, { method: "DELETE" }),
};

export const teacherCrudApi = {
  getAll: (params?: string) =>
    request<any>(`/api/teachers${params ? `?${params}` : ""}`),
  create: (data: any) =>
    request("/api/teachers", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    request(`/api/teachers/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) =>
    request(`/api/teachers/${id}`, { method: "DELETE" }),
};

export const parentCrudApi = {
  getAll: (params?: string) =>
    request<any>(`/api/parents${params ? `?${params}` : ""}`),
  create: (data: any) =>
    request("/api/parents", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    request(`/api/parents/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) =>
    request(`/api/parents/${id}`, { method: "DELETE" }),
};