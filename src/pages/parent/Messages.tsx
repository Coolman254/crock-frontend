import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, MessageSquare, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/layout/BottomNav";
import { useRequireAuth } from "@/lib/auth";
import { parentApi, teacherCrudApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

function toArr(res: any): any[] {
  if (Array.isArray(res))        return res;
  if (Array.isArray(res?.data))  return res.data;
  return [];
}

export default function ParentMessages() {
  const { user, loading: authLoading } = useRequireAuth("parent");
  const navigate  = useNavigate();
  const { toast } = useToast();

  const [messages, setMessages]   = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showNew, setShowNew]     = useState(false);
  const [selected, setSelected]   = useState<any>(null);
  const [children, setChildren]   = useState<any[]>([]);
  const [teachers, setTeachers]   = useState<any[]>([]);
  const [teachersLoading, setTeachersLoading] = useState(true);
  const [form, setForm]           = useState({ teacherId: "", studentId: "", body: "" });
  const [sending, setSending]     = useState(false);
  const [threadMap, setThreadMap] = useState<Record<string, any[]>>({});

  const fetchMessages = () => {
    setLoading(true);
    parentApi.getMessages()
      .then(r => {
        const msgs = toArr(r);
        setMessages(msgs);
        const map: Record<string, any[]> = {};
        msgs.forEach((m: any) => {
          const key = `${m.teacher?._id ?? m.teacher}_${m.student?._id ?? m.student}`;
          if (!map[key]) map[key] = [];
          map[key].push(m);
        });
        setThreadMap(map);
      })
      .catch(e => toast({ title: "Error loading messages", description: e.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (authLoading || !user) return;
    fetchMessages();

    // Load children
    parentApi.getDashboard()
      .then(r => setChildren(r.data?.children ?? []))
      .catch(e => toast({ title: "Could not load children", description: e.message, variant: "destructive" }));

    // Load teachers — show error if it fails so we know why dropdown is empty
    setTeachersLoading(true);
    teacherCrudApi.getAll()
      .then(r => {
        const list = toArr(r);
        setTeachers(list);
        if (list.length === 0) {
          toast({ title: "No teachers found", description: "Teacher list is empty.", variant: "destructive" });
        }
      })
      .catch(e => toast({ title: "Could not load teachers", description: e.message, variant: "destructive" }))
      .finally(() => setTeachersLoading(false));
  }, [authLoading, user]);

  const handleSend = async () => {
    if (!form.teacherId || !form.studentId || !form.body.trim()) return;
    setSending(true);
    try {
      await parentApi.sendMessage({
        teacherId: form.teacherId,
        studentId: form.studentId,
        body:      form.body.trim(),
      });
      toast({ title: "Message sent!" });
      setShowNew(false);
      setForm({ teacherId: "", studentId: "", body: "" });
      fetchMessages();
    } catch (e: any) {
      toast({ title: "Error sending message", description: e.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const getThread = (msg: any) => {
    const key = `${msg.teacher?._id ?? msg.teacher}_${msg.student?._id ?? msg.student}`;
    return (threadMap[key] ?? [msg]).sort(
      (a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  };

  const threads = Object.values(threadMap)
    .map(msgs => [...msgs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0])
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const unreadCount = messages.filter(m => !m.read && m.sentBy === "teacher").length;

  return (
    <div className="min-h-screen bg-background pb-24">

      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-500 text-white px-4 pt-10 pb-5 sm:px-6">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/parent")}
              className="text-white hover:bg-white/20 -ml-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Messages</h1>
              {unreadCount > 0 && (
                <p className="text-white/70 text-xs">
                  {unreadCount} new repl{unreadCount === 1 ? "y" : "ies"} from teachers
                </p>
              )}
            </div>
          </div>
          <Button size="sm" onClick={() => setShowNew(true)}
            className="bg-white/20 hover:bg-white/30 text-white border-0">
            <Plus className="h-4 w-4 mr-1" /> New
          </Button>
        </div>
      </div>

      {/* Thread list */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5 space-y-3">
        {loading ? (
          [...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)
        ) : threads.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground text-sm">No messages yet.</p>
              <p className="text-muted-foreground text-xs mt-1">
                Tap <strong>+ New</strong> to send a message to a teacher.
              </p>
            </CardContent>
          </Card>
        ) : (
          threads.map(m => {
            const key = `${m.teacher?._id ?? m.teacher}_${m.student?._id ?? m.student}`;
            const threadMsgs = threadMap[key] ?? [m];
            const hasReply   = threadMsgs.some((t: any) => t.sentBy === "teacher");
            const teacherName = m.teacher
              ? `${m.teacher.firstName ?? ""} ${m.teacher.lastName ?? ""}`.trim()
              : "Teacher";
            const studentName = m.student
              ? `${m.student.firstName ?? ""} ${m.student.lastName ?? ""}`.trim()
              : "Student";

            return (
              <Card key={m._id} className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelected(m)}>
                <CardContent className="p-4 flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm flex items-center gap-2">
                        {teacherName}
                        {hasReply && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 px-1.5 py-0.5 rounded-full font-medium">
                            Replied
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">Re: {studentName}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{m.body}</p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-xs text-muted-foreground">
                      {new Date(m.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {threadMsgs.length} msg{threadMsgs.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Thread view dialog */}
      <Dialog open={!!selected} onOpenChange={o => !o && setSelected(null)}>
        <DialogContent className="w-[95vw] max-w-lg p-0 gap-0 max-h-[85vh] flex flex-col">
          <DialogHeader className="px-4 pt-4 pb-2 border-b flex-shrink-0">
            <DialogTitle className="text-base">
              {selected?.teacher
                ? `${selected.teacher.firstName} ${selected.teacher.lastName}`
                : "Teacher"}
              <span className="text-sm font-normal text-muted-foreground ml-2">
                re: {selected?.student
                  ? `${selected.student.firstName} ${selected.student.lastName}`
                  : "Student"}
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {selected && getThread(selected).map((m: any) => (
              <div key={m._id}
                className={`flex ${m.sentBy === "parent" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                  m.sentBy === "parent"
                    ? "bg-purple-600 text-white rounded-br-sm"
                    : "bg-muted rounded-bl-sm"
                }`}>
                  <p>{m.body}</p>
                  <p className={`text-[10px] mt-1 ${
                    m.sentBy === "parent" ? "text-white/70" : "text-muted-foreground"
                  }`}>
                    {m.sentBy === "parent" ? "You" : "Teacher"} ·{" "}
                    {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="px-4 py-3 border-t flex-shrink-0">
            <p className="text-xs text-muted-foreground text-center">
              Only the teacher can reply to this thread.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* New message dialog */}
      <Dialog open={showNew} onOpenChange={o => !o && setShowNew(false)}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader><DialogTitle>New Message</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Teacher</Label>
              <Select value={form.teacherId} onValueChange={v => setForm(f => ({ ...f, teacherId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder={
                    teachersLoading ? "Loading teachers…" :
                    teachers.length === 0 ? "No teachers available" :
                    "Select teacher"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((t: any) => (
                    <SelectItem key={t._id} value={t._id}>
                      {t.firstName} {t.lastName}
                      {t.subject && ` · ${t.subject}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* Debug: show count so you can confirm teachers loaded */}
              {!teachersLoading && (
                <p className="text-xs text-muted-foreground mt-1">
                  {teachers.length} teacher{teachers.length !== 1 ? "s" : ""} available
                </p>
              )}
            </div>
            <div>
              <Label>Regarding Child</Label>
              <Select value={form.studentId} onValueChange={v => setForm(f => ({ ...f, studentId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder={children.length === 0 ? "No children linked" : "Select child"} />
                </SelectTrigger>
                <SelectContent>
                  {children.map((c: any) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.fullName ?? `${c.firstName} ${c.lastName}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Message</Label>
              <Textarea rows={4} placeholder="Type your message..."
                value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} />
            </div>
            <Button className="w-full" onClick={handleSend}
              disabled={!form.teacherId || !form.studentId || !form.body.trim() || sending}>
              {sending ? "Sending…" : "Send Message"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav role="parent" />
    </div>
  );
}