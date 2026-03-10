import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { FileText, Video, Image, Upload, Search, Download, Eye, Trash2, BookOpen } from "lucide-react";

const contentData = [
  { title: "Mathematics Grade 8 - Algebra Notes", type: "PDF", subject: "Mathematics", grade: "Grade 8", teacher: "Mr. James Ochieng", date: "2026-02-28", size: "2.4 MB", downloads: 45, status: "Published" },
  { title: "English Comprehension Passages", type: "PDF", subject: "English", grade: "Grade 7", teacher: "Mrs. Grace Muthoni", date: "2026-02-27", size: "1.8 MB", downloads: 62, status: "Published" },
  { title: "Science Lab Safety Video", type: "Video", subject: "Science", grade: "Grade 6", teacher: "Mr. David Kipchoge", date: "2026-02-26", size: "48 MB", downloads: 33, status: "Published" },
  { title: "Kiswahili Insha Writing Guide", type: "PDF", subject: "Kiswahili", grade: "Grade 5", teacher: "Mrs. Faith Njeri", date: "2026-02-25", size: "1.2 MB", downloads: 28, status: "Published" },
  { title: "Social Studies Map Reading", type: "Image", subject: "Social Studies", grade: "Grade 8", teacher: "Mr. Peter Kamau", date: "2026-02-24", size: "3.5 MB", downloads: 19, status: "Draft" },
  { title: "CRE - Parables of Jesus", type: "PDF", subject: "CRE", grade: "Grade 4", teacher: "Mrs. Lucy Akinyi", date: "2026-02-23", size: "900 KB", downloads: 41, status: "Published" },
  { title: "Art & Craft Tutorial", type: "Video", subject: "Art", grade: "Grade 3", teacher: "Mrs. Sarah Wanjiku", date: "2026-02-22", size: "35 MB", downloads: 15, status: "Review" },
  { title: "Physical Education Warm-ups", type: "Video", subject: "P.E.", grade: "All", teacher: "Mr. Brian Otieno", date: "2026-02-21", size: "22 MB", downloads: 56, status: "Published" },
];

const typeIcons: Record<string, typeof FileText> = {
  PDF: FileText,
  Video: Video,
  Image: Image,
};

export default function ContentPage() {
  return (
    <AdminLayout title="Content Management" subtitle="Manage learning materials and resources">
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Materials</p>
              <p className="text-2xl font-bold">342</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
              <FileText className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Documents</p>
              <p className="text-2xl font-bold">218</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-info/10">
              <Video className="h-6 w-6 text-info" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Videos</p>
              <p className="text-2xl font-bold">89</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
              <Download className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Downloads</p>
              <p className="text-2xl font-bold">4,821</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Learning Materials</CardTitle>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search materials..." className="pl-9 w-64" />
            </div>
            <Button className="gradient-accent text-accent-foreground">
              <Upload className="h-4 w-4 mr-2" /> Upload
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pdf">Documents</TabsTrigger>
              <TabsTrigger value="video">Videos</TabsTrigger>
              <TabsTrigger value="image">Images</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Uploaded By</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Downloads</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contentData.map((item, i) => {
                    const Icon = typeIcons[item.type] || FileText;
                    return (
                      <TableRow key={i}>
                        <TableCell className="font-medium flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          {item.title}
                        </TableCell>
                        <TableCell>{item.type}</TableCell>
                        <TableCell>{item.subject}</TableCell>
                        <TableCell>{item.grade}</TableCell>
                        <TableCell>{item.teacher}</TableCell>
                        <TableCell>{item.size}</TableCell>
                        <TableCell>{item.downloads}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              item.status === "Published"
                                ? "bg-success/10 text-success border-success/20"
                                : item.status === "Draft"
                                ? "bg-muted text-muted-foreground border-border"
                                : "bg-warning/10 text-warning border-warning/20"
                            }
                          >
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TabsContent>
            <TabsContent value="pdf" className="mt-4">
              <p className="text-muted-foreground text-center py-8">Filtered documents view</p>
            </TabsContent>
            <TabsContent value="video" className="mt-4">
              <p className="text-muted-foreground text-center py-8">Filtered videos view</p>
            </TabsContent>
            <TabsContent value="image" className="mt-4">
              <p className="text-muted-foreground text-center py-8">Filtered images view</p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
