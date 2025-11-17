import express from "express";
import { validationResult } from "express-validator";
import { prisma } from "../index";
import { requireAuth } from "../middlewares/auth.middleware";
import { createTaskValidator, updateTaskValidator } from "../utils/validators";

const router = express.Router();

// POST /tasks - create
router.post(
  "/",
  requireAuth,
  createTaskValidator,
  async (req: any, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });

      const { title, description, priority, status, dueDate } = req.body;
      const task = await prisma.task.create({
        data: {
          title,
          description: description ?? "",
          priority: priority ?? "medium",
          status: status ?? "pending",
          dueDate: dueDate ? new Date(dueDate) : null,
          ownerId: req.user!.userId,
        },
      });
      res.status(201).json(task);
    } catch (err) {
      next(err);
    }
  }
);

// GET /tasks - list with pagination, filter, search
// Query params: page, limit, status, q
router.get("/", requireAuth, async (req: any, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 10);
    const status = req.query.status as string | undefined;
    const q = (req.query.q as string | undefined) || "";

    const where: any = { ownerId: req.user!.userId };
    if (status && (status === "pending" || status === "completed"))
      where.status = status;
    if (q) where.title = { contains: q, mode: "insensitive" };

    const [total, tasks] = await Promise.all([
      prisma.task.count({ where }),
      prisma.task.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    res.json({ page, limit, total, tasks });
  } catch (err) {
    next(err);
  }
});

// GET /tasks/:id
router.get("/:id", requireAuth, async (req: any, res, next) => {
  try {
    const task = await prisma.task.findFirst({
      where: { id: req.params.id, ownerId: req.user!.userId },
    });
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json(task);
  } catch (err) {
    next(err);
  }
});

// PATCH /tasks/:id
router.patch(
  "/:id",
  requireAuth,
  updateTaskValidator,
  async (req: any, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });

      const existing = await prisma.task.findFirst({
        where: { id: req.params.id, ownerId: req.user!.userId },
      });
      if (!existing) return res.status(404).json({ message: "Task not found" });

      const data: any = {};
      const updatable = [
        "title",
        "description",
        "priority",
        "status",
        "dueDate",
      ];
      updatable.forEach((k) => {
        if (req.body[k] !== undefined) {
          data[k] =
            k === "dueDate"
              ? req.body[k]
                ? new Date(req.body[k])
                : null
              : req.body[k];
        }
      });

      const updated = await prisma.task.update({
        where: { id: req.params.id },
        data,
      });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /tasks/:id
router.delete("/:id", requireAuth, async (req: any, res, next) => {
  try {
    const existing = await prisma.task.findFirst({
      where: { id: req.params.id, ownerId: req.user!.userId },
    });
    if (!existing) return res.status(404).json({ message: "Task not found" });

    await prisma.task.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// POST /tasks/:id/toggle
router.post("/:id/toggle", requireAuth, async (req: any, res, next) => {
  try {
    const task = await prisma.task.findFirst({
      where: { id: req.params.id, ownerId: req.user!.userId },
    });
    if (!task) return res.status(404).json({ message: "Task not found" });

    const newStatus = task.status === "completed" ? "pending" : "completed";
    const updated = await prisma.task.update({
      where: { id: task.id },
      data: { status: newStatus },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

export default router;
