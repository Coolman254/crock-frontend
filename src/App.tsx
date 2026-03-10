import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/hooks/use-theme";
import { AuthProvider } from "@/lib/auth";

import Index from "./pages/Index";
import Login from "./pages/Login";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Help from "./pages/Help";
import Info from "./pages/Info";
import UserManual from "./pages/UserManual";
import NotFound from "./pages/NotFound";

import StudentDashboard from "./pages/student/Dashboard";
import StudentFinance from "./pages/student/Finance";
import StudentGrades from "./pages/student/Grades";
import StudentAssignments from "./pages/student/Assignments";
import StudentMaterials from "./pages/student/Materials";

import TeacherDashboard from "./pages/teacher/Dashboard";
import TeacherStudents from "./pages/teacher/Students";
import TeacherGrades from "./pages/teacher/Grades";
import TeacherAssignments from "./pages/teacher/Assignments";
import TeacherMaterials from "./pages/teacher/Materials";

import ParentDashboard from "./pages/parent/Dashboard";
import ParentFinance from "./pages/parent/Finance";
import ParentMessages from "./pages/parent/Messages";

import AdminDashboard from "./pages/admin/Dashboard";
import UsersPage from "./pages/admin/Users";
import RecordsPage from "./pages/admin/Records";
import AnnouncementsPage from "./pages/admin/Announcements";
import AdminFinance from "./pages/admin/Finance";
import SchoolInfoPage from "./pages/admin/SchoolInfo";
import ReportsPage from "./pages/admin/Reports";
import AddUserPage from "./pages/admin/AddUser";
import AddTeacherPage from "./pages/admin/AddTeacher";
import AddStudentPage from "./pages/admin/AddStudent";
import AddParentPage from "./pages/admin/AddParent";
import ClassesPage from "./pages/admin/Classes";
import SettingsPage from "./pages/admin/Settings";
import ContentPage from "./pages/admin/Content";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/help" element={<Help />} />
              <Route path="/info" element={<Info />} />
              <Route path="/user-manual" element={<UserManual />} />

              <Route path="/student" element={<StudentDashboard />} />
              <Route path="/student/finance" element={<StudentFinance />} />
              <Route path="/student/grades" element={<StudentGrades />} />
              <Route path="/student/assignments" element={<StudentAssignments />} />
              <Route path="/student/materials" element={<StudentMaterials />} />

              <Route path="/teacher" element={<TeacherDashboard />} />
              <Route path="/teacher/students" element={<TeacherStudents />} />
              <Route path="/teacher/grades" element={<TeacherGrades />} />
              <Route path="/teacher/assignments" element={<TeacherAssignments />} />
              <Route path="/teacher/materials" element={<TeacherMaterials />} />

              <Route path="/parent" element={<ParentDashboard />} />
              <Route path="/parent/finance" element={<ParentFinance />} />
              <Route path="/parent/messages" element={<ParentMessages />} />

              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<UsersPage />} />
              <Route path="/admin/students" element={<RecordsPage />} />
              <Route path="/admin/teachers" element={<RecordsPage />} />
              <Route path="/admin/parents" element={<RecordsPage />} />
              <Route path="/admin/announcements" element={<AnnouncementsPage />} />
              <Route path="/admin/finance" element={<AdminFinance />} />
              <Route path="/admin/school-info" element={<SchoolInfoPage />} />
              <Route path="/admin/reports" element={<ReportsPage />} />
              <Route path="/admin/add-user" element={<AddUserPage />} />
              <Route path="/admin/add-teacher" element={<AddTeacherPage />} />
              <Route path="/admin/add-student" element={<AddStudentPage />} />
              <Route path="/admin/add-parent" element={<AddParentPage />} />
              <Route path="/admin/classes" element={<ClassesPage />} />
              <Route path="/admin/settings" element={<SettingsPage />} />
              <Route path="/admin/content" element={<ContentPage />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
