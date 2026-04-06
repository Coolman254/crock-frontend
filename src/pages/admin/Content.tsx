import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  FileText, Video, Image as ImageIcon, Upload, Search,
  Download, Trash2, BookOpen, RefreshCw, X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Material {
  _id: string;
  title: string;
  subject: string;
  class: string;
  description?: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
  fileUrl?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const BASE = (import.meta.env.VITE_API_URL as string) || "http://localhost:5000";
const getToken = () => localStorage.getItem("token");

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      ...(options.headers as Record<string, string>),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
}

function fileCategory(fileType: string): "PDF" | "Video" | "Image" | "Other" {
  if (fileType.includes("pdf"))   return "PDF";
  if (fileType.includes("video")) return "Video";
  if (fileType.includes("image")) return "Image";
  return "Other";
}

function formatSize(bytes: number): string {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-KE", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

const TypeIcon = ({ type }: { type: string }) => {
  const cat = fileCategory(type);
  if (cat === "Video") return <Video className="h-4 w-4 text-blue-500" />;
  if (cat === "Image") return <ImageIcon className="h-4 w-4 text-green-500" />;
  return <FileText className="h-4 w-4 text-orange-500" />;
};

// ── Upload Modal ──────────────────────────────────────────────────────────────

function UploadModal({
  onClose,
  onUploaded,
}: {
  onClose: () => void;
  onUploaded: () => void;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState({ title: "", subject: "", class: "", description: "" });
  const [file, setFile]   = useState<File | null>(null);
  const [busy, setBusy]   = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!form.title || !form.class || !file) {
      toast({ title: "Missing fields", description: "Title, class and file are required.", variant: "destructive" });
      return;
    }
    const fd = new FormData();
    fd.append("title",       form.title);
    fd.append("subject",     form.subject);
    fd.append("class",       form.class);
    fd.append("description", form.description);
    fd.append("file",        file);

    setBusy(true);
    try {
      const token = getToken();
      const res = await fetch(`${BASE}/api/admin-dashboard/materials`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast({ title: "Uploaded", description: "Material uploaded successfully." });
      onUploaded();
      onClose();
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Upload Material</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>

        {(["title","subject","class","description"] as const).map(field => (
          <div key={field} className="space-y-1">
            <label className="text-sm font-medium capitalize">{field}{field === "title" || field === "class" ? " *" : ""}</label>
            <Input
              placeholder={field === "class" ? "e.g. Grade 8" : field}
              value={form[field]}
              onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
            />
          </div>
        ))}

        <div className="space-y-1">
          <label className="text-sm font-medium">File *</label>
          <input ref={fileRef} type="file" className="hidden" onChange={e => setFile(e.target.files?.[0] ?? null)} />
          <div
            className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            {file
              ? <p className="text-sm font-medium text-foreground">{file.name} <span className="text-muted-foreground">({formatSize(file.size)})</span></p>
              : <p className="text-sm text-muted-foreground">Click to select a file</p>
            }
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={busy}>
            {busy ? "Uploading…" : "Upload"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ContentPage() {
  const { toast } = useToast();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [tab,       setTab]       = useState("all");
  const [showModal, setShowModal] = useState(false);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      // Fetch from all teachers (admin view) — falls back to teacher endpoint
      const data = await apiFetch("/api/admin-dashboard/materials");
      setMaterials(data.data ?? []);
    } catch (e: any) {
      toast({ title: "Failed to load materials", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMaterials(); }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await apiFetch(`/api/admin-dashboard/materials/${id}`, { method: "DELETE" });
      setMaterials(m => m.filter(x => x._id !== id));
      toast({ title: "Deleted", description: `"${name}" removed.` });
    } catch (e: any) {
      toast({ title: "Delete failed", description: e.message, variant: "destructive" });
    }
  };

  const handleDownload = async (mat: Material) => {
    if (!mat.fileUrl) {
      toast({ title: "No URL", description: "File URL not available.", variant: "destructive" });
      return;
    }
    const a = document.createElement("a");
    a.href     = mat.fileUrl;
    a.download = mat.fileName;
    a.target   = "_blank";
    a.click();
  };

  // ── Derived stats ────────────────────────────────────────────────────────

  const total  = materials.length;
  const docs   = materials.filter(m => fileCategory(m.fileType) === "PDF").length;
  const videos = materials.filter(m => fileCategory(m.fileType) === "Video").length;
  const images = materials.filter(m => fileCategory(m.fileType) === "Image").length;

  // ── Filter ───────────────────────────────────────────────────────────────

  const filtered = materials.filter(m => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      m.title.toLowerCase().includes(q)    ||
      m.subject.toLowerCase().includes(q)  ||
      m.class.toLowerCase().includes(q)    ||
      m.fileName.toLowerCase().includes(q);

    const cat = fileCategory(m.fileType);
    const matchTab =
      tab === "all"   ? true :
      tab === "pdf"   ? cat === "PDF"   :
      tab === "video" ? cat === "Video" :
      tab === "image" ? cat === "Image" : true;

    return matchSearch && matchTab;
  });

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <AdminLayout title="Content Management" subtitle="Manage learning materials and resources">

      {showModal && (
        <UploadModal onClose={() => setShowModal(false)} onUploaded={fetchMaterials} />
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        {[
          { label: "Total Materials", value: total,  icon: BookOpen,    color: "text-primary",     bg: "bg-primary/10"    },
          { label: "Documents",       value: docs,   icon: FileText,    color: "text-orange-500",  bg: "bg-orange-500/10" },
          { label: "Videos",          value: videos, icon: Video,       color: "text-blue-500",    bg: "bg-blue-500/10"   },
          { label: "Images",          value: images, icon: ImageIcon,   color: "text-green-500",   bg: "bg-green-500/10"  },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${bg}`}>
                <Icon className={`h-6 w-6 ${color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-2xl font-bold">{loading ? "…" : value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
          <CardTitle>Learning Materials</CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search materials…"
                className="pl-9 w-56"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" onClick={fetchMaterials} title="Refresh">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button onClick={() => setShowModal(true)}>
              <Upload className="h-4 w-4 mr-2" /> Upload
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="all">All ({total})</TabsTrigger>
              <TabsTrigger value="pdf">Documents ({docs})</TabsTrigger>
              <TabsTrigger value="video">Videos ({videos})</TabsTrigger>
              <TabsTrigger value="image">Images ({images})</TabsTrigger>
            </TabsList>

            <TabsContent value={tab} className="mt-4">
              {loading ? (
                <div className="text-center py-12 text-muted-foreground">Loading materials…</div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {search ? `No materials matching "${search}"` : "No materials found."}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Uploaded</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map(mat => (
                        <TableRow key={mat._id}>
                          <TableCell className="font-medium max-w-[200px]">
                            <div className="flex items-center gap-2">
                              <TypeIcon type={mat.fileType} />
                              <span className="truncate" title={mat.title}>{mat.title}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {fileCategory(mat.fileType)}
                            </Badge>
                          </TableCell>
                          <TableCell>{mat.subject || "—"}</TableCell>
                          <TableCell>{mat.class}</TableCell>
                          <TableCell>{formatSize(mat.fileSize)}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {formatDate(mat.createdAt)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost" size="icon" className="h-8 w-8"
                                title="Download"
                                onClick={() => handleDownload(mat)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost" size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                title="Delete"
                                onClick={() => handleDelete(mat._id, mat.title)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}