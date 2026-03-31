import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Plus, Trash2, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/layout/BottomNav";
import { useRequireAuth } from "@/lib/auth";
import { teacherApi } from "@/lib/api";
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

export default function TeacherMaterials() {
  const { user, loading: authLoading } = useRequireAuth("teacher");
  const navigate = useNavigate();
  const { toast } = useToast();

  const [materials, setMaterials]   = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [uploading, setUploading]   = useState(false);
  const [file, setFile]             = useState<File | null>(null);
  const [form, setForm] = useState({
    title: "", subject: "", class: "", description: "",
  });

  // ── Fetch materials ────────────────────────────────────────
  // calls GET /api/teacher-dashboard/materials
  const fetchMaterials = (showSkeleton = false) => {
  if (showSkeleton) setLoading(true);
  teacherApi
    .getMaterials()
    .then(r => setMaterials(toArr(r)))
    .catch(e => toast({ title: "Error", description: e.message, variant: "destructive" }))
    .finally(() => setLoading(false));
};

useEffect(() => {
  if (!authLoading && user) fetchMaterials(true);
}, [authLoading, user]);
  // ── Upload material ────────────────────────────────────────
  // calls POST /api/teacher-dashboard/materials (multipart)
  const handleUpload = async () => {
    if (!file || !form.title || !form.class) {
    toast({ title: "Title, class and file are required", variant: "destructive" });
    return;
   }
    setUploading(true);
    const fd = new FormData();
     fd.append("file", file);
     fd.append("title", form.title);
     fd.append("subject", form.subject);
     fd.append("class", form.class);
     fd.append("description", form.description);

    try {
      const r = await teacherApi.uploadMaterial(fd);
      if (r?.success !== true) {
        toast({ title: "Upload failed", description: r?.message, variant: "destructive" });
    } else {
      toast({ title: "Uploaded!", description: `Material available to class ${form.class}` });
      setShowDialog(false);
      setFile(null);
      setForm({ title: "", subject: "", class: "", description: "" });
      fetchMaterials(true); // ← refetch instead of direct state update (safer)
     }
    } catch (e: any) {
    toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
     setUploading(false);
     }
  };

  // ── Delete material ────────────────────────────────────────
  // calls DELETE /api/teacher-dashboard/materials/:id
  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this material?")) return;
    try {
      await teacherApi.deleteMaterial(id);
      toast({ title: "Deleted" });
      setMaterials(prev => prev.filter(m => m._id !== id));
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

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
            <h1 className="text-xl font-bold">Study Materials</h1>
          </div>
          <Button size="sm" onClick={() => setShowDialog(true)}
            className="bg-white/20 hover:bg-white/30 text-white border-0">
            <Plus className="h-4 w-4 mr-1" /> Upload
          </Button>
        </div>
      </div>

      {/* Materials list */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5 space-y-3">
        {loading ? (
          [...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)
        ) : materials.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No materials uploaded yet. Tap <strong>+ Upload</strong> to add one.
            </CardContent>
          </Card>
        ) : (
          materials.map(m => (
            <Card key={m._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl flex-shrink-0">{fileIcon(m.fileType ?? "")}</span>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{m.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {m.subject} · Class {m.class}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {m.fileSize ? `${(m.fileSize / 1024 / 1024).toFixed(1)} MB · ` : ""}
                      {new Date(m.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {m.fileType && (
                    <Badge variant="outline" className="text-xs hidden sm:inline-flex">
                      {m.fileType.split("/")[1]?.toUpperCase() ?? "FILE"}
                    </Badge>
                  )}
                  <Button variant="ghost" size="icon"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => handleDelete(m._id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Upload dialog */}
      <Dialog open={showDialog} onOpenChange={o => !o && setShowDialog(false)}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader><DialogTitle>Upload Material</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Title *</Label>
              <Input value={form.title} placeholder="e.g. Chapter 3 Notes"
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Subject</Label>
                <Input value={form.subject} placeholder="e.g. Biology"
                  onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
              </div>
              <div>
                <Label>Class *</Label>
                <Input value={form.class} placeholder="e.g. Form 2"
                  onChange={e => setForm(f => ({ ...f, class: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} rows={2}
                placeholder="Optional notes about this material..."
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <label className="flex items-center gap-3 cursor-pointer border-2 border-dashed rounded-lg p-4 hover:bg-muted/50 transition-colors">
              <Upload className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <span className="text-sm text-muted-foreground truncate">
                {file ? file.name : "Click to select file (PDF, Word, PPT, image, video)"}
              </span>
              <input type="file" className="hidden"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.mp4,.mov"
                onChange={e => setFile(e.target.files?.[0] ?? null)} />
            </label>
            <Button className="w-full" onClick={handleUpload}
              disabled={uploading || !file || !form.title || !form.class}>
              {uploading ? "Uploading..." : "Upload Material"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav role="teacher" />
    </div>
  );
}
