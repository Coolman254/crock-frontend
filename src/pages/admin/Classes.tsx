import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookOpen, Users, UserCheck, Plus } from "lucide-react";

const classesData = [
  { name: "Grade 1", stream: "A", students: 42, classTeacher: "Mrs. Sarah Wanjiku", subjects: 8, status: "Active" },
  { name: "Grade 1", stream: "B", students: 40, classTeacher: "Mr. James Ochieng", subjects: 8, status: "Active" },
  { name: "Grade 2", stream: "A", students: 38, classTeacher: "Mrs. Grace Muthoni", subjects: 9, status: "Active" },
  { name: "Grade 2", stream: "B", students: 41, classTeacher: "Mr. Peter Kamau", subjects: 9, status: "Active" },
  { name: "Grade 3", stream: "A", students: 45, classTeacher: "Mrs. Faith Njeri", subjects: 10, status: "Active" },
  { name: "Grade 3", stream: "B", students: 43, classTeacher: "Mr. David Kipchoge", subjects: 10, status: "Active" },
  { name: "Grade 4", stream: "A", students: 39, classTeacher: "Mrs. Lucy Akinyi", subjects: 11, status: "Active" },
  { name: "Grade 4", stream: "B", students: 44, classTeacher: "Mr. Daniel Wekesa", subjects: 11, status: "Active" },
  { name: "Grade 5", stream: "A", students: 36, classTeacher: "Mrs. Esther Chebet", subjects: 12, status: "Active" },
  { name: "Grade 5", stream: "B", students: 40, classTeacher: "Mr. Brian Otieno", subjects: 12, status: "Active" },
  { name: "Grade 6", stream: "A", students: 37, classTeacher: "Mrs. Ann Wambui", subjects: 12, status: "Active" },
  { name: "Grade 6", stream: "B", students: 42, classTeacher: "Mr. Kevin Mwangi", subjects: 12, status: "Active" },
  { name: "Grade 7", stream: "A", students: 35, classTeacher: "Mrs. Mary Njoki", subjects: 13, status: "Active" },
  { name: "Grade 7", stream: "B", students: 38, classTeacher: "Mr. Charles Mutua", subjects: 13, status: "Active" },
  { name: "Grade 8", stream: "A", students: 33, classTeacher: "Mrs. Jane Wairimu", subjects: 13, status: "Active" },
  { name: "Grade 8", stream: "B", students: 36, classTeacher: "Mr. Robert Njoroge", subjects: 13, status: "Active" },
  { name: "Grade 9", stream: "A", students: 30, classTeacher: "Mrs. Helen Oduya", subjects: 14, status: "Active" },
  { name: "Grade 9", stream: "B", students: 32, classTeacher: "Mr. Patrick Simiyu", subjects: 14, status: "Active" },
];

const totalStudents = classesData.reduce((sum, c) => sum + c.students, 0);
const totalClasses = classesData.length;
const uniqueGrades = new Set(classesData.map((c) => c.name)).size;

export default function ClassesPage() {
  return (
    <AdminLayout title="Classes" subtitle="Manage all school classes and streams">
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Classes</p>
              <p className="text-2xl font-bold">{totalClasses}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
              <Users className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Students</p>
              <p className="text-2xl font-bold">{totalStudents}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
              <UserCheck className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Grade Levels</p>
              <p className="text-2xl font-bold">{uniqueGrades}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Classes</CardTitle>
          <Button className="gradient-accent text-accent-foreground">
            <Plus className="h-4 w-4 mr-2" /> Add Class
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead>Stream</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Class Teacher</TableHead>
                <TableHead>Subjects</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classesData.map((cls, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{cls.name}</TableCell>
                  <TableCell>{cls.stream}</TableCell>
                  <TableCell>{cls.students}</TableCell>
                  <TableCell>{cls.classTeacher}</TableCell>
                  <TableCell>{cls.subjects}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                      {cls.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
