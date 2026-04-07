import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail, Trash2, Search, RefreshCw, MailOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const BASE = (import.meta.env.VITE_API_URL as string) || "http://localhost:5000";
const getToken = () => localStorage.getItem("token");

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string>),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
}

interface Contact {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  read: boolean;
  createdAt: string;
}

const subjectLabels: Record<string, string> = {
  admission: "Admission Inquiry",
  academic:  "Academic Information",
  technical: "Technical Support",
  feedback:  "Feedback",
  other:     "Other",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-KE", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function ContactsPage() {
  const { toast } = useToast();
  const [contacts, setContacts]   = useState<Contact[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [selected, setSelected]   = useState<Contact | null>(null);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/api/contact");
      setContacts(data.data ?? []);
    } catch (e: any) {
      toast({ title: "Failed to load messages", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchContacts(); }, []);

  const handleSelect = async (contact: Contact) => {
    setSelected(contact);
    if (!contact.read) {
      try {
        await apiFetch(`/api/contact/${contact._id}/read`, { method: "PATCH" });
        setContacts(cs => cs.map(c => c._id === contact._id ? { ...c, read: true } : c));
      } catch (_) {}
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this message?")) return;
    try {
      await apiFetch(`/api/contact/${id}`, { method: "DELETE" });
      setContacts(cs => cs.filter(c => c._id !== id));
      if (selected?._id === id) setSelected(null);
      toast({ title: "Deleted" });
    } catch (e: any) {
      toast({ title: "Delete failed", description: e.message, variant: "destructive" });
    }
  };

  const unread   = contacts.filter(c => !c.read).length;
  const filtered = contacts.filter(c => {
    const q = search.toLowerCase();
    return !q ||
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.message.toLowerCase().includes(q);
  });

  return (
    <AdminLayout title="Contact Messages" subtitle="Messages submitted via the contact form">
      <div className="flex gap-4 h-[calc(100vh-160px)] min-h-[500px]">

        {/* ── Message List ── */}
        <div className="w-full md:w-80 flex-shrink-0 flex flex-col gap-3">
          {/* Search + refresh */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search messages…"
                className="pl-9"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" onClick={fetchContacts}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {/* Unread badge */}
          {unread > 0 && (
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{unread}</span> unread message{unread !== 1 ? "s" : ""}
            </p>
          )}

          {/* List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {loading
              ? [...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
              : filtered.length === 0
              ? <p className="text-center text-muted-foreground text-sm pt-8">No messages found.</p>
              : filtered.map(c => (
                <div
                  key={c._id}
                  onClick={() => handleSelect(c)}
                  className={`cursor-pointer rounded-xl border p-3 transition-colors hover:bg-muted/50 ${
                    selected?._id === c._id ? "bg-muted border-primary/30" : "border-border"
                  } ${!c.read ? "border-l-4 border-l-primary" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className={`text-sm truncate ${!c.read ? "font-semibold" : "font-medium"}`}>
                        {c.firstName} {c.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{c.message}</p>
                    </div>
                    {!c.read && (
                      <span className="flex-shrink-0 h-2 w-2 rounded-full bg-primary mt-1" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{formatDate(c.createdAt)}</p>
                </div>
              ))
            }
          </div>
        </div>

        {/* ── Message Detail ── */}
        <div className="flex-1 hidden md:block">
          {selected ? (
            <Card className="h-full flex flex-col">
              <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
                <div>
                  <CardTitle className="text-lg">
                    {selected.firstName} {selected.lastName}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-0.5">{selected.email}</p>
                  {selected.phone && (
                    <p className="text-sm text-muted-foreground">{selected.phone}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {selected.subject && (
                    <Badge variant="outline" className="text-xs">
                      {subjectLabels[selected.subject] ?? selected.subject}
                    </Badge>
                  )}
                  <Badge variant={selected.read ? "secondary" : "default"} className="text-xs">
                    {selected.read ? <><MailOpen className="h-3 w-3 mr-1" />Read</> : <><Mail className="h-3 w-3 mr-1" />Unread</>}
                  </Badge>
                  <Button
                    variant="ghost" size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(selected._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto">
                <div className="bg-muted/50 rounded-xl p-4">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{selected.message}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-3">{formatDate(selected.createdAt)}</p>
                <div className="mt-4">
                  <a
                    href={`mailto:${selected.email}?subject=Re: ${subjectLabels[selected.subject ?? "other"] ?? "Your message"}`}
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                  >
                    <Mail className="h-4 w-4" /> Reply via Email
                  </a>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Mail className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Select a message to read</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}