import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middlewares/auth.middleware";

const prisma = new PrismaClient();

export const getUserProfile = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        tasks: {
          select: {
            id: true,
            status: true,
            priority: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Calculate user statistics
    const totalTasks = user.tasks.length;
    const completedTasks = user.tasks.filter(
      (task) => task.status === "completed"
    ).length;
    const pendingTasks = user.tasks.filter(
      (task) => task.status === "pending"
    ).length;
    const inProgressTasks = user.tasks.filter(
      (task) => task.status === "in_progress"
    ).length;

    // Calculate user level based on completed tasks
    const userLevel = Math.floor(completedTasks / 10) + 1;
    const levelProgress = (completedTasks % 10) * 10; // Percentage to next level

    // Calculate streak (consecutive days with completed tasks)
    const completedTaskDates = user.tasks
      .filter((task) => task.status === "completed")
      .map((task) => new Date(task.updatedAt).toDateString())
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    const uniqueDates = [...new Set(completedTaskDates)];
    let currentStreak = 0;
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    if (uniqueDates.includes(today) || uniqueDates.includes(yesterday)) {
      for (let i = 0; i < uniqueDates.length; i++) {
        const currentDate = new Date(uniqueDates[i]);
        const nextDate = new Date(uniqueDates[i + 1]);

        if (i === 0) {
          currentStreak = 1;
        } else if (
          currentDate.getTime() - nextDate.getTime() ===
          86400000
        ) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    // Calculate priority distribution
    const priorityDistribution = {
      HIGH: user.tasks.filter((task) => task.priority === "high").length,
      MEDIUM: user.tasks.filter((task) => task.priority === "medium").length,
      LOW: user.tasks.filter((task) => task.priority === "low").length,
    };

    const profileData = {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      statistics: {
        totalTasks,
        completedTasks,
        pendingTasks,
        inProgressTasks,
        completionRate:
          totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      },
      level: {
        current: userLevel,
        progress: levelProgress,
        nextLevel: userLevel + 1,
      },
      streak: {
        current: currentStreak,
        longest: currentStreak, // For now, same as current
      },
      priorityDistribution,
    };

    res.json(profileData);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateUserProfile = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user?.userId;
    const { name, email } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // Check if email already exists for another user
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          NOT: { id: userId },
        },
      });

      if (existingUser) {
        return res.status(400).json({ error: "Email already in use" });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(email && { email }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    res.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const changePassword = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user?.userId;
    const { currentPassword, newPassword } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "Current password and new password are required" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: "New password must be at least 6 characters long" });
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash
    );
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedNewPassword },
    });

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getUserStatistics = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const tasks = await prisma.task.findMany({
      where: { ownerId: userId },
      select: {
        id: true,
        status: true,
        priority: true,
        createdAt: true,
        updatedAt: true,
        dueDate: true,
      },
    });

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(
      (task) => task.status === "completed"
    ).length;
    const pendingTasks = tasks.filter(
      (task) => task.status === "pending"
    ).length;
    const inProgressTasks = tasks.filter(
      (task) => task.status === "in_progress"
    ).length;

    // Calculate completion rate
    const completionRate =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Calculate overdue tasks
    const now = new Date();
    const overdueTasks = tasks.filter(
      (task) =>
        task.dueDate &&
        task.status !== "completed" &&
        new Date(task.dueDate) < now
    ).length;

    // Calculate weekly progress (tasks completed in last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weeklyCompleted = tasks.filter(
      (task) => task.status === "completed" && new Date(task.updatedAt) >= sevenDaysAgo
    ).length;

    // Calculate monthly progress (tasks completed in last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const monthlyCompleted = tasks.filter(
      (task) => task.status === "completed" && new Date(task.updatedAt) >= thirtyDaysAgo
    ).length;

    // Calculate productivity score (0-100)
    let productivityScore = 0;
    if (totalTasks > 0) {
      const onTimeCompletion = tasks.filter((task) => {
        if (task.status !== "completed" || !task.dueDate) return true; // Assume on time if no due date
        return new Date(task.updatedAt) <= new Date(task.dueDate);
      }).length;

      const completionWeight = (completedTasks / totalTasks) * 60;
      const timelinessWeight = (onTimeCompletion / totalTasks) * 40;
      productivityScore = Math.round(completionWeight + timelinessWeight);
    }

    const statistics = {
      overview: {
        totalTasks,
        completedTasks,
        pendingTasks,
        inProgressTasks,
        overdueTasks,
        completionRate,
      },
      progress: {
        weekly: weeklyCompleted,
        monthly: monthlyCompleted,
        productivityScore,
      },
      priorityBreakdown: {
        HIGH: tasks.filter((task) => task.priority === "high").length,
        MEDIUM: tasks.filter((task) => task.priority === "medium").length,
        LOW: tasks.filter((task) => task.priority === "low").length,
      },
    };

    res.json(statistics);
  } catch (error) {
    console.error("Error fetching user statistics:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteAccount = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user?.userId;
    const { password } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    if (!password) {
      return res
        .status(400)
        .json({ error: "Password is required to delete account" });
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Incorrect password" });
    }

    // Delete user (cascade will delete related tasks)
    await prisma.user.delete({
      where: { id: userId },
    });

    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Error deleting account:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
