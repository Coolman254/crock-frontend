import { Link, useLocation } from "react-router-dom";
import { Home, BookOpen, BarChart3, DollarSign, Users, ClipboardList, MessageSquare, Package } from "lucide-react";
import { cn } from "@/lib/utils";

const roleNavItems: Record<string, { to: string; label: string; icon: any }[]> = {
  student: [
    { to: "/student",             label: "Home",      icon: Home },
    { to: "/student/materials",   label: "Materials", icon: Package },
    { to: "/student/assignments", label: "Tasks",     icon: ClipboardList },
    { to: "/student/grades",      label: "Grades",    icon: BarChart3 },
    { to: "/student/finance",     label: "Finance",   icon: DollarSign },
  ],
  teacher: [
    { to: "/teacher",             label: "Home",      icon: Home },
    { to: "/teacher/students",    label: "Students",  icon: Users },
    { to: "/teacher/assignments", label: "Tasks",     icon: ClipboardList },
    { to: "/teacher/grades",      label: "Grades",    icon: BarChart3 },
    { to: "/teacher/materials",   label: "Materials", icon: Package },
  ],
  parent: [
    { to: "/parent",          label: "Home",     icon: Home },
    { to: "/parent/finance",  label: "Finance",  icon: DollarSign },
    { to: "/parent/messages", label: "Messages", icon: MessageSquare },
  ],
};

interface BottomNavProps { role?: "student" | "teacher" | "parent"; }

export function BottomNav({ role }: BottomNavProps) {
  const location = useLocation();
  const navItems = role ? roleNavItems[role] : [];
  if (!navItems.length) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* glass pill */}
      <div className="mx-3 mb-3">
        <div className="glass border border-border/50 rounded-2xl shadow-lg">
          <div className="flex items-center justify-around h-16 px-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to ||
                (item.to.length > 3 && location.pathname.startsWith(item.to));
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex flex-col items-center justify-center gap-1 flex-1 py-2 min-h-[48px] touch-manipulation relative"
                >
                  {isActive && (
                    <span className="absolute top-1.5 inset-x-1/4 h-0.5 rounded-full gradient-accent" />
                  )}
                  <div className={cn(
                    "flex items-center justify-center w-9 h-7 rounded-xl transition-all",
                    isActive ? "gradient-accent shadow-sm" : "bg-transparent"
                  )}>
                    <item.icon className={cn("h-4 w-4 transition-colors", isActive ? "text-white" : "text-muted-foreground")} />
                  </div>
                  <span className={cn("text-[9px] font-semibold leading-none transition-colors",
                    isActive ? "text-violet-600 dark:text-violet-400" : "text-muted-foreground"
                  )}>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
