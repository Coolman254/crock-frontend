import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, GraduationCap, UserCheck, BookOpen, Bell,
  Settings, LogOut, ChevronLeft, ChevronRight, School, FileText,
  BarChart3, DollarSign, CalendarCheck, // ✅ CalendarCheck for Attendance
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useSignOut, useAuth } from "@/lib/auth";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard",     path: "/admin" },
  { icon: School,          label: "School Info",   path: "/admin/school-info" },
  { icon: Users,           label: "Users",         path: "/admin/users" },
  { icon: GraduationCap,   label: "Students",      path: "/admin/students" },
  { icon: UserCheck,       label: "Teachers",      path: "/admin/teachers" },
  { icon: Users,           label: "Parents",       path: "/admin/parents" },
  { icon: BookOpen,        label: "Classes",       path: "/admin/classes" },
  { icon: FileText,        label: "Content",       path: "/admin/content" },
  { icon: Bell,            label: "Announcements", path: "/admin/announcements" },
  { icon: CalendarCheck,   label: "Attendance",    path: "/admin/attendance" }, // ✅ added
  { icon: BarChart3,       label: "Reports",       path: "/admin/reports" },
  { icon: DollarSign,      label: "Finance",       path: "/admin/finance" },
  { icon: Settings,        label: "Settings",      path: "/admin/settings" },
];

interface AdminSidebarProps { mobile?: boolean; onClose?: () => void; }

export function AdminSidebar({ mobile = false, onClose }: AdminSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const signOut = useSignOut();
  const { user } = useAuth();
  const location = useLocation();
  const isCollapsed = collapsed && !mobile;

  return (
    <aside className={cn(
      "h-screen flex flex-col",
      "bg-sidebar",
      mobile ? "w-64" : "fixed left-0 top-0 z-40 transition-all duration-300",
      !mobile && (isCollapsed ? "w-20" : "w-64"),
    )}>
      {/* ── Logo ── */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
        <Link to="/admin" className="flex items-center gap-3" onClick={onClose}>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-accent shadow-glow shrink-0">
            <School className="h-4.5 w-4.5 text-white" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-display font-bold text-sidebar-foreground text-sm truncate leading-tight">Globaltech</span>
              <span className="text-[11px] text-sidebar-muted leading-tight">Model Academy</span>
            </div>
          )}
        </Link>
        {!mobile && (
          <Button variant="ghost" size="icon"
            className="h-7 w-7 text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={() => setCollapsed(!collapsed)}>
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        )}
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        <ul className="space-y-0.5">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path !== "/admin" && location.pathname.startsWith(item.path));
            return (
              <li key={item.path}>
                <Link to={item.path} onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                    isActive
                      ? "gradient-accent text-white shadow-md shadow-violet-500/20"
                      : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/60",
                  )}>
                  <item.icon className="h-[18px] w-[18px] flex-shrink-0" />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ── Footer ── */}
      <div className="border-t border-sidebar-border p-3 space-y-2">
        <div className={cn("flex items-center gap-3 px-2 py-1.5", isCollapsed && "justify-center")}>
          <div className="h-8 w-8 rounded-full gradient-accent flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-white">{user?.name?.[0]?.toUpperCase() || "A"}</span>
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-sidebar-foreground truncate">{user?.name || "Admin"}</p>
              <p className="text-[11px] text-sidebar-muted truncate">{user?.email || ""}</p>
            </div>
          )}
        </div>
        <Button variant="ghost"
          className={cn("w-full text-sidebar-foreground/60 hover:text-red-400 hover:bg-red-500/10 rounded-xl text-sm", isCollapsed && "px-0")}
          onClick={signOut}>
          <LogOut className="h-4 w-4" />
          {!isCollapsed && <span className="ml-2">Sign Out</span>}
        </Button>
      </div>
    </aside>
  );
}