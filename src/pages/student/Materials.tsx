import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Download, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/layout/BottomNav";
import { useRequireAuth } from "@/lib/auth";
import { studentApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

function toArr(res: any): any[] {
  if (Array.isArray(res))             return res;
  if (Array.isArray(res?.data))       return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  return [];
}

function fileIcon(fileType: string) {
  if (!fileType) return "📁";
  if (fileType.includes("pdf"))                                              return "📄";
  if (fileType.includes("word") || fileType.includes("document"))           return "📝";
  if (fileType.includes("image"))                                            return "🖼️";
  if (fileType.includes("video"))                                            return "🎥";
  if (fileType.includes("presentation") || fileType.includes("powerpoint")) return "📊";
  return "📁";
}

export default function StudentMaterials() {
  const { user, loading: authLoading } = useRequireAuth("student");
  const navigate = useNavigate();
  const { toast } = useToast();

  const [materials, setMaterials]     = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [downloading, setDownloading] = useState<string | null>(null);

  // ── Fetch materials ────────────────────────────────────────
  // calls GET /api/student-dashboard/materials
  // backend auto-filters by the logged-in student's class
  useEffect(() => {
    if (authLoading || !user) return;
    studentApi
      .getMaterials()
      .then(r => setMaterials(toArr(r)))
      .catch(e => toast({ title: "Error", description: e.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [authLoading, user]);

  // ── Search filter ──────────────────────────────────────────
  const filtered = materials.filter(m => {
    const q = search.toLowerCase();
    return (
      m.title?.toLowerCase().includes(q) ||
      m.subject?.toLowerCase().includes(q) ||
      m.class?.toLowerCase().includes(q) ||
      m.uploadedBy?.toLowerCase().includes(q)
    );
  });

  // ── Download with auth header ──────────────────────────────
  // calls GET /api/student-dashboard/materials/:id/download
  const handleDownload = async (m: any) => {
    setDownloading(m._id);
    try {
      const token = localStorage.getItem("token");
      const url = studentApi.getMaterialDownloadUrl(m._id);

      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) throw new Error(`Download failed: ${res.statusText}`);

      const blob = await res.blob();
      const bUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = bUrl;
      link.download = m.fileName || m.title || "material";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(bUrl);
    } catch (e: any) {
      toast({ title: "Download failed", description: e.message, variant: "destructive" });
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">

      {/* Header */}
      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white px-4 pt-10 pb-5 sm:px-6">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/student")}
            className="text-white hover:bg-white/20 -ml-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Study Materials</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5 space-y-4">

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, subject, class..."
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* List */}
        {loading ? (
          [...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              {search
                ? "No materials match your search."
                : "No materials available for your class yet."}
            </CardContent>
          </Card>
        ) : (
          filtered.map(m => (
            <Card key={m._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center justify-between gap-3">

                {/* Left: icon + info */}
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl flex-shrink-0">{fileIcon(m.fileType ?? "")}</span>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{m.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {[m.subject, m.class && `Class ${m.class}`].filter(Boolean).join(" · ")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {m.uploadedBy ? `By ${m.uploadedBy}` : ""}
                      {m.fileSize ? ` · ${(m.fileSize / 1024 / 1024).toFixed(1)} MB` : ""}
                    </p>
                    {m.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {m.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: size badge + download button */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {m.fileSize && (
                    <Badge variant="outline" className="text-xs hidden sm:inline-flex">
                      {(m.fileSize / 1024 / 1024).toFixed(1)} MB
                    </Badge>
                  )}
                  <Button size="sm" variant="outline"
                    onClick={() => handleDownload(m)}
                    disabled={downloading === m._id}>
                    <Download className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">
                      {downloading === m._id ? "..." : "Download"}
                    </span>
                  </Button>
                </div>

              </CardContent>
            </Card>
          ))
        )}
      </div>

      <BottomNav role="student" />
    </div>
  );
}
