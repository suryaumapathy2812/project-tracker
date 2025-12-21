import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Building2, CheckCircle2, Circle, Clock, XCircle } from "lucide-react";

interface Props {
  params: Promise<{ shareId: string }>;
}

type Status = "Backlog" | "Todo" | "InProgress" | "Done" | "Canceled";

const statusConfig: Record<
  Status,
  { label: string; icon: React.ElementType; color: string }
> = {
  Backlog: { label: "Backlog", icon: Circle, color: "text-gray-400" },
  Todo: { label: "Todo", icon: Circle, color: "text-blue-500" },
  InProgress: { label: "In Progress", icon: Clock, color: "text-yellow-500" },
  Done: { label: "Done", icon: CheckCircle2, color: "text-green-500" },
  Canceled: { label: "Canceled", icon: XCircle, color: "text-red-500" },
};

export default async function PublicSharePage({ params }: Props) {
  const { shareId } = await params;

  const project = await db.project.findUnique({
    where: { shareId },
    include: {
      org: { select: { name: true, logo: true } },
      features: {
        include: {
          assignments: {
            include: {
              student: { select: { id: true, name: true, image: true } },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!project) {
    notFound();
  }

  // Group features by student
  const studentMap = new Map<
    string,
    {
      student: { id: string; name: string; image: string | null };
      features: Array<{
        id: string;
        title: string;
        description: string;
        tags: string[];
        status: Status;
      }>;
    }
  >();

  for (const feature of project.features) {
    for (const assignment of feature.assignments) {
      const studentId = assignment.student.id;
      if (!studentMap.has(studentId)) {
        studentMap.set(studentId, {
          student: assignment.student,
          features: [],
        });
      }
      studentMap.get(studentId)!.features.push({
        id: feature.id,
        title: feature.title,
        description: feature.description,
        tags: feature.tags,
        status: assignment.status as Status,
      });
    }
  }

  const students = Array.from(studentMap.values()).map((entry) => {
    const total = entry.features.length;
    const done = entry.features.filter((f) => f.status === "Done").length;
    const inProgress = entry.features.filter(
      (f) => f.status === "InProgress"
    ).length;
    return {
      ...entry,
      progress: {
        total,
        done,
        inProgress,
        percentage: total > 0 ? Math.round((done / total) * 100) : 0,
      },
    };
  });

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-4xl px-4 py-12">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 flex items-center justify-center gap-2 text-muted-foreground">
            <Building2 className="size-4" />
            <span>{project.org.name}</span>
          </div>
          <h1 className="text-4xl font-bold">{project.name}</h1>
          {project.description && (
            <p className="mt-2 text-lg text-muted-foreground">
              {project.description}
            </p>
          )}
          <div className="mt-4">
            <Badge variant="secondary">
              {project.features.length} Features
            </Badge>
          </div>
        </div>

        {/* Students */}
        {students.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-lg text-muted-foreground">
                No students assigned to this project yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {students.map(({ student, features, progress }) => (
              <Card key={student.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-12">
                        <AvatarImage src={student.image || undefined} />
                        <AvatarFallback>
                          {student.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle>{student.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {progress.done} of {progress.total} features completed
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-3xl font-bold text-primary">
                        {progress.percentage}%
                      </span>
                    </div>
                  </div>
                  <Progress value={progress.percentage} className="mt-4 h-2" />
                </CardHeader>
                <CardContent>
                  <Accordion type="multiple" className="w-full">
                    {features.map((feature) => {
                      const StatusIcon = statusConfig[feature.status].icon;
                      return (
                        <AccordionItem key={feature.id} value={feature.id}>
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex flex-1 items-center gap-3 pr-4">
                              <StatusIcon
                                className={`size-5 ${statusConfig[feature.status].color}`}
                              />
                              <span className="flex-1 text-left font-medium">
                                {feature.title}
                              </span>
                              <div className="flex items-center gap-2">
                                {feature.tags.slice(0, 2).map((tag) => (
                                  <Badge
                                    key={tag}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                                <Badge
                                  variant="secondary"
                                  className={statusConfig[feature.status].color}
                                >
                                  {statusConfig[feature.status].label}
                                </Badge>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-3 pl-8 pt-2">
                              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                                {feature.description}
                              </p>
                              {feature.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {feature.tags.map((tag) => (
                                    <Badge
                                      key={tag}
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>Powered by Project Tracker</p>
        </div>
      </div>
    </div>
  );
}
