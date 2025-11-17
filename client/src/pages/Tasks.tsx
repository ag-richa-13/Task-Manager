// src/pages/Tasks.tsx

import { useState } from "react";
import DashboardLayout from "@/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Edit, Trash2, CheckCircle2, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGetTasks, apiDeleteTask, apiToggleTask } from "@/lib/api";

export default function Tasks() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "pending" | "completed"
  >("all");
  const [page, setPage] = useState(1);

  const statusParam = filterStatus === "all" ? undefined : filterStatus;

  /* ---------------------- FIXED useQuery (v5 syntax) ---------------------- */
  type TasksData = { tasks: any[] };

  const {
    data: tasksData,
    isLoading,
    error,
  } = useQuery<TasksData>({
    queryKey: ["tasks", page, searchQuery, statusParam],
    queryFn: () => apiGetTasks(page, 10, statusParam, searchQuery),
    placeholderData: (previousData) => previousData,
  });

  const tasks = tasksData?.tasks ?? [];

  /* ---------------------- FIXED Delete Mutation (v5 syntax) ---------------------- */
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDeleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task deleted successfully");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Delete failed");
    },
  });

  /* ---------------------- FIXED Toggle Mutation (v5 syntax) ---------------------- */
  const toggleMutation = useMutation({
    mutationFn: (id: string) => apiToggleTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task status updated");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Update failed");
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Tasks</h1>
            <p className="text-muted-foreground mt-1">
              Manage and track your tasks
            </p>
          </div>
          <Button onClick={() => navigate("/tasks/new")} className="gap-2">
            <Plus className="h-4 w-4" />
            New Task
          </Button>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select
                value={filterStatus}
                onValueChange={(v) => setFilterStatus(v as any)}
              >
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tasks</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <CardContent>
            <div className="space-y-3">
              {isLoading ? (
                <div className="text-center py-12">Loading tasks...</div>
              ) : tasks.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No tasks found</p>
                </div>
              ) : (
                tasks.map((task: any) => (
                  <Card
                    key={task.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <button
                            onClick={() => toggleMutation.mutate(task.id)}
                            className="mt-1"
                          >
                            {task.status === "completed" ? (
                              <CheckCircle2 className="h-5 w-5 text-success" />
                            ) : (
                              <Clock className="h-5 w-5 text-warning" />
                            )}
                          </button>

                          <div className="flex-1">
                            <h3 className="font-semibold text-foreground">
                              {task.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {task.description}
                            </p>

                            <div className="flex flex-wrap gap-2 mt-3">
                              <Badge
                                variant={
                                  task.priority === "high"
                                    ? "destructive"
                                    : "secondary"
                                }
                              >
                                {task.priority}
                              </Badge>

                              <Badge
                                variant={
                                  task.status === "completed"
                                    ? "default"
                                    : "outline"
                                }
                              >
                                {task.status}
                              </Badge>

                              <span className="text-xs text-muted-foreground flex items-center">
                                Due:{" "}
                                {task.dueDate
                                  ? task.dueDate.split("T")[0]
                                  : "—"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/tasks/${task.id}/edit`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteMutation.mutate(task.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <div>
                <Button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Previous
                </Button>
                <Button onClick={() => setPage((p) => p + 1)} className="ml-2">
                  Next
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">Page {page}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
