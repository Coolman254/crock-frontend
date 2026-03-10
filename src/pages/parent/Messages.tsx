import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/layout/BottomNav";
import { useRequireAuth } from "@/lib/auth";
import { parentApi, teacherCrudApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function ParentMessages() {
  const { user, loading: authLoading } = useRequireAuth("parent");
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [children, setChildren] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [form, setForm] = useState({ teacherId: "", studentId: "", body: "" });
  const [sending, setSending] = useState(false);

  const fetchMessages = () => {
    parentApi.getMessages().then(r => setMessages(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => {
    if (authLoading || !user) return;
    fetchMessages();
    parentApi.getDashboard().then(r => setChildren(r.data.children || [])).catch(() => {});
    teacherCrudApi.getAll().then(r => setTeachers(Array.isArray(r) ? r : r.data || [])).catch(() => {});
  }, [authLoading, user]);

  const handleSend = async () => {
    setSending(true);
    try {
      await parentApi.sendMessage(form);
      toast({ title: "Message sent!" });
      setShowDialog(false);
      setForm({ teacherId: "", studentId: "", body: "" });
      fetchMessages();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setSending(false); }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-gradient-to-r from-purple-600 to-purple-500 text-white px-4 pt-10 pb-5 sm:px-6">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/parent")} className="text-white hover:bg-white/20 -ml-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Messages</h1>
          </div>
          <Button size="sm" onClick={() => setShowDialog(true)} className="bg-white/20 hover:bg-white/30 text-white border-0">
            <Plus className="h-4 w-4 mr-1" />New
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5 space-y-3">
        {loading ? [...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />) :
          messages.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No messages yet. Send your first message to a teacher!</p>
              </CardContent>
            </Card>
          ) : messages.map((m) => (
            <Card key={m._id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-sm">To: {m.teacher ? `${m.teacher.firstName} ${m.teacher.lastName}` : "Teacher"}</p>
                    <p className="text-xs text-muted-foreground">Re: {m.student ? `${m.student.firstName} ${m.student.lastName}` : "Student"}</p>
                    <p className="text-sm mt-1 line-clamp-2">{m.body}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <Badge variant={m.sentBy === "parent" ? "secondary" : "default"} className="text-xs">{m.sentBy}</Badge>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(m.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        }
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader><DialogTitle>New Message</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Teacher</Label>
              <Select value={form.teacherId} onValueChange={v => setForm(f => ({ ...f, teacherId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
                <SelectContent>
                  {teachers.map((t: any) => <SelectItem key={t._id} value={t._id}>{t.firstName} {t.lastName} ({t.subject})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Regarding Child</Label>
              <Select value={form.studentId} onValueChange={v => setForm(f => ({ ...f, studentId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select child" /></SelectTrigger>
                <SelectContent>
                  {children.map((c: any) => <SelectItem key={c._id} value={c._id}>{c.fullName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Message</Label><Textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} rows={4} placeholder="Type your message..." /></div>
            <Button className="w-full" onClick={handleSend} disabled={!form.teacherId || !form.studentId || !form.body.trim() || sending}>
              {sending ? "Sending..." : "Send Message"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <BottomNav role="parent" />
    </div>
  );
}
