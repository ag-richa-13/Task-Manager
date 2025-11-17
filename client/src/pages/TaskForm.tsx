// src/pages/TaskForm.tsx

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import DashboardLayout from "@/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiCreateTask, apiGetTask, apiUpdateTask } from "@/lib/api";

export default function TaskForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const queryClient = useQueryClient();

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [status, setStatus] = useState<"pending" | "completed">("pending");
  const [dueDate, setDueDate] = useState("");

  /* ---------------- GET SINGLE TASK (if editing) ---------------- */
  const { data: existingTask, isLoading: loadingTask } = useQuery({
    queryKey: ["task", id],
    queryFn: () => apiGetTask(id!),
    enabled: isEditing,
  });

  /* Prefill the form when task loads */
  useEffect(() => {
    if (existingTask) {
      setTitle(existingTask.title);
      setDescription(existingTask.description);
      setPriority(existingTask.priority);
      setStatus(existingTask.status);
      setDueDate(
        existingTask.dueDate ? existingTask.dueDate.split("T")[0] : ""
      );
    }
  }, [existingTask]);

  /* -------------------------- MUTATIONS -------------------------- */

  // Create Task
  const createTask = useMutation({
    mutationFn: (payload: any) => apiCreateTask(payload),
    onSuccess: () => {
      toast.success("Task created successfully");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      navigate("/tasks");
    },
    onError: (err: any) => toast.error(err?.message || "Create failed"),
  });

  // Update Task
  const updateTask = useMutation({
    mutationFn: (payload: any) => apiUpdateTask(id!, payload),
    onSuccess: () => {
      toast.success("Task updated successfully");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      navigate("/tasks");
    },
    onError: (err: any) => toast.error(err?.message || "Update failed"),
  });

  /* -------------------------- FORM SUBMIT -------------------------- */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      title,
      description,
      priority,
      status,
      dueDate: dueDate || null,
    };

    if (isEditing) {
      updateTask.mutate(payload);
    } else {
      createTask.mutate(payload);
    }
  };

  if (isEditing && loadingTask) {
    return (
      <DashboardLayout>
        <div className="text-center p-6">Loading Task...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/tasks")}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tasks
        </Button>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>{isEditing ? "Edit Task" : "Create New Task"}</CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Task Title</Label>
                <Input
                  id="title"
                  placeholder="Enter task title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter task description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  required
                />
              </div>

              {/* Priority + Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={priority}
                    onValueChange={(v: any) => setPriority(v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={status}
                    onValueChange={(v: any) => setStatus(v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Due Date */}
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="flex-1">
                  {isEditing ? "Update Task" : "Create Task"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/tasks")}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
