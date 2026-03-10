import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Download, FileText, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/layout/BottomNav";
import { useRequireAuth } from "@/lib/auth";
import { studentApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

function fileIcon(type: string) {
  if (type?.includes("pdf")) return "📄";
  if (type?.includes("word")) return "📝";
  if (type?.includes("image")) return "🖼️";
  if (type?.includes("video")) return "🎥";
  return "📁";
}

export default function StudentMaterials() {
  const { user, loading: authLoading } = useRequireAuth("student");
  const navigate = useNavigate();
  const { toast } = useToast();
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (authLoading || !user) return;
    studentApi.getMaterials()
      .then((r) => setMaterials(r.data))
      .catch((e) => toast({ title: "Error", description: e.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [authLoading, user]);

  const filtered = materials.filter(m =>
    m.title?.toLowerCase().includes(search.toLowerCase()) ||
    m.subject?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDownload = (m: any) => {
    const token = localStorage.getItem("token");
    const url = studentApi.getMaterialDownloadUrl(m._id);
    const a = document.createElement("a");
    a.href = url;
    a.download = m.fileName;
    // We need auth header — open in new tab or use fetch
    fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.blob())
      .then(blob => {
        const bUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = bUrl;
        link.download = m.fileName;
        link.click();
        URL.revokeObjectURL(bUrl);
      })
      .catch(() => toast({ title: "Download failed", variant: "destructive" }));
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-primary-foreground px-4 pt-10 pb-5 sm:px-6">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/student")} className="text-white hover:bg-white/20 -ml-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Study Materials</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search materials..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {loading ? [...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />) :
          filtered.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No materials found</CardContent></Card>
          ) : filtered.map((m) => (
            <Card key={m._id}>
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl flex-shrink-0">{fileIcon(m.fileType)}</span>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{m.title}</p>
                    <p className="text-xs text-muted-foreground">{m.subject} · {m.uploadedBy}</p>
                    {m.description && <p className="text-xs text-muted-foreground truncate">{m.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant="outline" className="text-xs hidden sm:inline-flex">{(m.fileSize / 1024 / 1024).toFixed(1)}MB</Badge>
                  <Button size="sm" variant="outline" onClick={() => handleDownload(m)}>
                    <Download className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Download</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        }
      </div>
      <BottomNav role="student" />
    </div>
  );
}
