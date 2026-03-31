import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Plus, Trash2, Upload, FileText, BookOpen } from "lucide-react";
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

function fileLabel(fileType: string) {
  if (!fileType) return "FILE";
  const part = fileType.split("/")[1]?.toUpperCase();
  // shorten verbose mime subtypes
  if (part === "VND.OPENXMLFORMATS-OFFICEDOCUMENT.WORDPROCESSINGML.DOCUMENT") return "DOCX";
  if (part === "VND.OPENXMLFORMATS-OFFICEDOCUMENT.PRESENTATIONML.PRESENTATION") return "PPTX";
  if (part === "VND.MS-POWERPOINT") return "PPT";
  if (part === "MSWORD") return "DOC";
  return part ?? "FILE";
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
        fetchMaterials(true);
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

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
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-4 pt-10 pb-5">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/teacher")}
              className="text-white hover:bg-white/20 -ml-2 shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-lg font-bold leading-tight truncate">Study Materials</h1>
              {!loading && (
                <p className="text-emerald-100 text-xs">
                  {materials.length} {materials.length === 1 ? "material" : "materials"} uploaded
                </p>
              )}
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setShowDialog(true)}
            className="bg-white text-emerald-700 hover:bg-emerald-50 border-0 shrink-0 font-semibold text-xs px-3 h-8"
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Upload
          </Button>
        </div>
      </div>

      {/* Materials list */}
      <div className="max-w-2xl mx-auto px-3 sm:px-6 py-4 space-y-2.5">
        {loading ? (
          [...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
        ) : materials.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-14 flex flex-col items-center gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <p className="font-medium text-sm text-foreground">No materials yet</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Tap <strong>Upload</strong> to add your first material
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => setShowDialog(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white mt-1"
              >
                <Plus className="h-4 w-4 mr-1" /> Upload Material
              </Button>
            </CardContent>
          </Card>
        ) : (
          materials.map(m => (
            <Card key={m._id} className="hover:shadow-md transition-shadow overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-stretch">

                  {/* Colored left strip with icon */}
                  <div className="w-14 shrink-0 bg-emerald-50 flex items-center justify-center border-r border-emerald-100">
                    <span className="text-2xl">{fileIcon(m.fileType ?? "")}</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 px-3 py-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm leading-tight truncate">{m.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {[m.subject, m.class && `Class ${m.class}`].filter(Boolean).join(" · ")}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {m.fileType && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                            {fileLabel(m.fileType)}
                          </Badge>
                        )}
                        <span className="text-[11px] text-muted-foreground">
                          {m.fileSize ? `${(m.fileSize / 1024 / 1024).toFixed(1)} MB · ` : ""}
                          {new Date(m.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Delete button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-400 hover:text-red-600 hover:bg-red-50 shrink-0 h-8 w-8"
                      onClick={() => handleDelete(m._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Upload dialog */}
      <Dialog open={showDialog} onOpenChange={o => { if (!o) { setShowDialog(false); setFile(null); } }}>
        <DialogContent className="w-[92vw] max-w-md rounded-2xl p-0 gap-0 overflow-hidden">

          {/* Dialog header */}
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-5 py-4">
            <DialogHeader>
              <DialogTitle className="text-white text-base font-bold">Upload Material</DialogTitle>
              <p className="text-emerald-100 text-xs mt-0.5">Students in the selected class will see this</p>
            </DialogHeader>
          </div>

          {/* Dialog body */}
          <div className="px-5 py-4 space-y-3.5">

            {/* Title */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-foreground">Title <span className="text-red-500">*</span></Label>
              <Input
                value={form.title}
                placeholder="e.g. Chapter 3 Notes"
                className="h-10 text-sm"
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>

            {/* Subject + Class side by side */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-foreground">Subject</Label>
                <Input
                  value={form.subject}
                  placeholder="e.g. Biology"
                  className="h-10 text-sm"
                  onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-foreground">Class <span className="text-red-500">*</span></Label>
                <Input
                  value={form.class}
                  placeholder="e.g. Form 2B"
                  className="h-10 text-sm"
                  onChange={e => setForm(f => ({ ...f, class: e.target.value }))}
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-foreground">Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Textarea
                value={form.description}
                rows={2}
                placeholder="Brief notes about this material..."
                className="text-sm resize-none"
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>

            {/* File picker */}
            <label className="flex items-center gap-3 cursor-pointer border-2 border-dashed border-emerald-200 rounded-xl p-3.5 hover:bg-emerald-50/50 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                {file
                  ? <span className="text-lg">{fileIcon(file.type)}</span>
                  : <Upload className="h-4 w-4 text-emerald-600" />
                }
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {file ? file.name : "Tap to select file"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {file
                    ? `${(file.size / 1024 / 1024).toFixed(1)} MB`
                    : "PDF, Word, PPT, image, video · max 100 MB"
                  }
                </p>
              </div>
              {file && (
                <button
                  type="button"
                  className="ml-auto text-muted-foreground hover:text-red-500 shrink-0 p-1"
                  onClick={e => { e.preventDefault(); setFile(null); }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
              <input
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.mp4,.mov"
                onChange={e => setFile(e.target.files?.[0] ?? null)}
              />
            </label>

            {/* Submit */}
            <Button
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm"
              onClick={handleUpload}
              disabled={uploading || !file || !form.title || !form.class}
            >
              {uploading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Uploading...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Upload Material
                </span>
              )}
            </Button>

          </div>
        </DialogContent>
      </Dialog>

      <BottomNav role="teacher" />
    </div>
  );
}