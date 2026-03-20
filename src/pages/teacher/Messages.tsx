import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MessageSquare, Reply, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/layout/BottomNav";
import { useRequireAuth } from "@/lib/auth";
import { teacherApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

function toArr(res: any): any[] {
  if (Array.isArray(res))        return res;
  if (Array.isArray(res?.data))  return res.data;
  return [];
}

export default function TeacherMessages() {
  const { user, loading: authLoading } = useRequireAuth("teacher");
  const navigate = useNavigate();
  const { toast } = useToast();

  const [messages, setMessages]     = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState<any>(null);
  const [replyBody, setReplyBody]   = useState("");
  const [sending, setSending]       = useState(false);
  const [threadMap, setThreadMap]   = useState<Record<string, any[]>>({});

  // ── Fetch all messages sent to this teacher ──────────────
  const fetchMessages = () => {
    setLoading(true);
    (teacherApi as any).getMessages()
      .then((r: any) => {
        const msgs = toArr(r);
        setMessages(msgs);

        // Group into threads by parent+student combo
        const map: Record<string, any[]> = {};
        msgs.forEach((m: any) => {
          const key = `${m.parent?._id ?? m.parent}_${m.student?._id ?? m.student}`;
          if (!map[key]) map[key] = [];
          map[key].push(m);
        });
        setThreadMap(map);
      })
      .catch((e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!authLoading && user) fetchMessages();
  }, [authLoading, user]);

  // ── Reply to a message ────────────────────────────────────
  const handleReply = async () => {
    if (!selected || !replyBody.trim()) return;
    setSending(true);
    try {
      await (teacherApi as any).replyMessage({
        parentId:  selected.parent?._id ?? selected.parent,
        studentId: selected.student?._id ?? selected.student,
        body:      replyBody.trim(),
      });
      toast({ title: "Reply sent!" });
      setReplyBody("");
      fetchMessages();
      // Refresh thread in dialog
      setSelected((prev: any) => prev ? { ...prev, _refreshed: Date.now() } : null);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  // Get full thread for selected message
  const getThread = (msg: any) => {
    const key = `${msg.parent?._id ?? msg.parent}_${msg.student?._id ?? msg.student}`;
    return (threadMap[key] ?? [msg]).sort(
      (a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  };

  // Deduplicate — show only the latest message per thread in the list
  const threads = Object.values(threadMap).map(msgs =>
    [...msgs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const unreadCount = messages.filter(m => !m.read && m.sentBy === "parent").length;

  return (
    <div className="min-h-screen bg-background pb-24">

      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-4 pt-10 pb-5 sm:px-6">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/teacher")}
              className="text-white hover:bg-white/20 -ml-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Messages</h1>
              {unreadCount > 0 && (
                <p className="text-white/70 text-xs">{unreadCount} unread from parents</p>
              )}
            </div>
          </div>
          {unreadCount > 0 && (
            <Badge className="bg-white text-emerald-700 font-bold">{unreadCount}</Badge>
          )}
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
                Parents will appear here when they send you a message.
              </p>
            </CardContent>
          </Card>
        ) : (
          threads.map(m => {
            const key = `${m.parent?._id ?? m.parent}_${m.student?._id ?? m.student}`;
            const threadMsgs = threadMap[key] ?? [m];
            const unread = threadMsgs.filter((t: any) => !t.read && t.sentBy === "parent").length;
            const parentName = m.parent
              ? `${m.parent.firstName ?? ""} ${m.parent.lastName ?? ""}`.trim()
              : "Parent";
            const studentName = m.student
              ? `${m.student.firstName ?? ""} ${m.student.lastName ?? ""}`.trim()
              : "Student";

            return (
              <Card key={m._id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => { setSelected(m); setReplyBody(""); }}>
                <CardContent className="p-4 flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm flex items-center gap-2">
                        {parentName}
                        {unread > 0 && (
                          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500 text-white text-[10px] font-bold">
                            {unread}
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

      {/* Thread / Reply dialog */}
      <Dialog open={!!selected} onOpenChange={o => !o && setSelected(null)}>
        <DialogContent className="w-[95vw] max-w-lg p-0 gap-0 max-h-[85vh] flex flex-col">
          <DialogHeader className="px-4 pt-4 pb-2 border-b flex-shrink-0">
            <DialogTitle className="text-base">
              {selected?.parent
                ? `${selected.parent.firstName} ${selected.parent.lastName}`
                : "Parent"}
              <span className="text-sm font-normal text-muted-foreground ml-2">
                re: {selected?.student
                  ? `${selected.student.firstName} ${selected.student.lastName}`
                  : "Student"}
              </span>
            </DialogTitle>
          </DialogHeader>

          {/* Thread messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {selected && getThread(selected).map((m: any) => (
              <div key={m._id}
                className={`flex ${m.sentBy === "teacher" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                  m.sentBy === "teacher"
                    ? "bg-emerald-600 text-white rounded-br-sm"
                    : "bg-muted rounded-bl-sm"
                }`}>
                  <p>{m.body}</p>
                  <p className={`text-[10px] mt-1 ${
                    m.sentBy === "teacher" ? "text-white/70" : "text-muted-foreground"
                  }`}>
                    {m.sentBy === "teacher" ? "You" : "Parent"} ·{" "}
                    {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Reply input */}
          <div className="px-4 py-3 border-t flex-shrink-0 space-y-2">
            <Textarea
              placeholder="Type your reply..."
              value={replyBody}
              onChange={e => setReplyBody(e.target.value)}
              rows={2}
              className="text-sm resize-none"
            />
            <Button className="w-full h-9 text-sm" onClick={handleReply}
              disabled={sending || !replyBody.trim()}>
              <Reply className="h-3.5 w-3.5 mr-1.5" />
              {sending ? "Sending…" : "Send Reply"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav role="teacher" />
    </div>
  );
}
