import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { School, Eye, EyeOff, ArrowRight, GraduationCap, Users, UserCheck, Shield, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LoginBranding } from "@/components/login/LoginBranding";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("");
  const [identifier, setIdentifier] = useState(""); // email for staff/admin, admissionNo for students
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();

  const isStudent = role === "student";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role || !identifier || !password) {
      toast({ title: "Missing fields", description: "Please fill in all fields.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await login(identifier.trim(), password, role);
      toast({ title: "Welcome!", description: `Signed in as ${role}.` });
      navigate(`/${role}`);
    } catch (err: any) {
      toast({ title: "Login Failed", description: err.message || "Invalid credentials.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <LoginBranding />

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 bg-background overflow-y-auto">
        <div className="w-full max-w-md py-4">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-accent shadow-glow">
              <School className="h-5 w-5 text-accent-foreground" />
            </div>
            <h1 className="font-display text-lg font-bold text-foreground">Globaltech Model Academy</h1>
          </div>

          <Card className="border-border/50 shadow-xl">
            <CardHeader className="text-center pb-2">
              <CardTitle className="font-display text-xl sm:text-2xl">Welcome Back</CardTitle>
              <CardDescription>Sign in to access your learning portal</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                {/* Role selector */}
                <div className="space-y-2">
                  <Label htmlFor="role">I am a</Label>
                  <Select value={role} onValueChange={(v) => { setRole(v); setIdentifier(""); }}>
                    <SelectTrigger id="role" className="h-11">
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">
                        <div className="flex items-center gap-2"><GraduationCap className="h-4 w-4" />Student</div>
                      </SelectItem>
                      <SelectItem value="teacher">
                        <div className="flex items-center gap-2"><UserCheck className="h-4 w-4" />Teacher</div>
                      </SelectItem>
                      <SelectItem value="parent">
                        <div className="flex items-center gap-2"><Users className="h-4 w-4" />Parent</div>
                      </SelectItem>
                      <SelectItem value="admin">
                        <div className="flex items-center gap-2"><Shield className="h-4 w-4" />Admin</div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Identifier field — changes based on role */}
                <div className="space-y-2">
                  <Label htmlFor="identifier">
                    {isStudent ? "Admission Number" : "Email Address"}
                  </Label>
                  <Input
                    id="identifier"
                    type={isStudent ? "text" : "email"}
                    placeholder={isStudent ? "e.g. 12345" : "your.email@globaltech.ac.ke"}
                    className="h-11"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    inputMode={isStudent ? "numeric" : "email"}
                  />
                  {isStudent && (
                    <p className="text-xs text-muted-foreground">Enter your admission number (numbers only)</p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      className="h-11 pr-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {isStudent && (
                    <p className="text-xs text-muted-foreground">Password set by your school admin</p>
                  )}
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full min-h-[48px] gradient-accent text-accent-foreground font-semibold hover:opacity-90 transition-opacity"
                  disabled={!role || !identifier || !password || loading}
                >
                  {loading
                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing In...</>
                    : <>Sign In<ArrowRight className="ml-2 h-4 w-4" /></>}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm text-muted-foreground">
                <p>Don't have an account?{" "}
                  <Link to="/contact" className="text-accent font-medium hover:underline">Contact Admin</Link>
                </p>
              </div>
            </CardContent>
          </Card>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            © 2024 Globaltech Model Academy. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
