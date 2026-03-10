import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useRequireAuth } from "@/lib/auth";
import { announcementApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function AnnouncementsPage() {
  const { user, loading: authLoading } = useRequireAuth("admin");
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", audience: "all", isActive: true });

  const fetchAnnouncements = () => {
    announcementApi.getAll().then(r => setAnnouncements(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { if (!authLoading && user) fetchAnnouncements(); }, [authLoading, user]);

  const handleCreate = async () => {
    try {
      await announcementApi.create(form);
      toast({ title: "Announcement created!" });
      setShowDialog(false);
      setForm({ title: "", body: "", audience: "all", isActive: true });
      fetchAnnouncements();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const toggleActive = async (a: any) => {
    try {
      await announcementApi.update(a._id, { isActive: !a.isActive });
      fetchAnnouncements();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await announcementApi.delete(id);
      toast({ title: "Deleted" });
      fetchAnnouncements();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  return (
    <AdminLayout title="Announcements">
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="h-4 w-4 mr-1" />New Announcement
          </Button>
        </div>

        {loading ? [...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />) :
          announcements.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No announcements yet</CardContent></Card>
          ) : announcements.map((a) => (
            <Card key={a._id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{a.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{a.body}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline" className="text-xs capitalize">{a.audience}</Badge>
                      <Badge variant={a.isActive ? "default" : "secondary"} className="text-xs">{a.isActive ? "Active" : "Hidden"}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleActive(a)}>
                      {a.isActive ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(a._id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        }
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader><DialogTitle>New Announcement</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Title</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div><Label>Body</Label><Textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} rows={4} /></div>
            <div>
              <Label>Audience</Label>
              <Select value={form.audience} onValueChange={v => setForm(f => ({ ...f, audience: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["all","students","teachers","parents"].map(a => <SelectItem key={a} value={a} className="capitalize">{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleCreate} disabled={!form.title || !form.body}>Publish</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
