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

export default function TeacherMaterials() {
  const { user, loading: authLoading } = useRequireAuth("teacher");
  const navigate = useNavigate();
  const { toast } = useToast();
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({ title: "", subject: "", grade: "", description: "" });

  const fetchMaterials = () => {
    teacherApi.getMaterials()
      .then(r => setMaterials(Array.isArray(r) ? r : (r as any).data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (!authLoading && user) fetchMaterials(); }, [authLoading, user]);

  const handleUpload = async () => {
    if (!file || !form.title || !form.grade) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("title", form.title);
    fd.append("subject", form.subject);
    fd.append("grade", form.grade);
    fd.append("description", form.description);
    // teacher name comes from logged-in user
    fd.append("teacher", user?.name || user?.email || "Unknown");
    try {
      const r = await teacherApi.uploadMaterial(fd);
      if (r && (r._id || r.success !== false)) {
        toast({ title: "Uploaded!", description: "Material uploaded successfully." });
        setShowDialog(false);
        setFile(null);
        setForm({ title: "", subject: "", grade: "", description: "" });
        fetchMaterials();
      } else {
        toast({ title: "Error", description: r.message || "Upload failed", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await teacherApi.deleteMaterial(id);
      toast({ title: "Deleted" });
      fetchMaterials();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-4 pt-10 pb-5 sm:px-6">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/teacher")} className="text-white hover:bg-white/20 -ml-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Study Materials</h1>
          </div>
          <Button size="sm" onClick={() => setShowDialog(true)} className="bg-white/20 hover:bg-white/30 text-white border-0">
            <Plus className="h-4 w-4 mr-1" />Upload
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5 space-y-3">
        {loading ? [...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />) :
          materials.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No materials uploaded yet</CardContent></Card>
          ) : materials.map((m) => (
            <Card key={m._id}>
              <CardContent className="p-4 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{m.title}</p>
                  <p className="text-xs text-muted-foreground">{m.subject} · Grade {m.grade}</p>
                  <p className="text-xs text-muted-foreground">{m.size} · {new Date(m.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant="outline" className="text-xs">{m.type}</Badge>
                  <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(m._id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        }
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader><DialogTitle>Upload Material</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Subject *</Label><Input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} /></div>
              <div><Label>Grade *</Label><Input value={form.grade} placeholder="e.g. Grade 6" onChange={e => setForm(f => ({ ...f, grade: e.target.value }))} /></div>
            </div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
            <label className="flex items-center gap-2 text-sm cursor-pointer border-2 border-dashed rounded-lg p-4 hover:bg-muted/50 transition-colors">
              <Upload className="h-5 w-5 text-muted-foreground" />
              <span className="text-muted-foreground">{file ? file.name : "Click to select file (PDF, Word, PPT, Image, Video)"}</span>
              <input type="file" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.mp4,.mov" />
            </label>
            <Button className="w-full" onClick={handleUpload} disabled={!file || !form.title || !form.grade || uploading}>
              {uploading ? "Uploading..." : "Upload Material"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <BottomNav role="teacher" />
    </div>
  );
}
