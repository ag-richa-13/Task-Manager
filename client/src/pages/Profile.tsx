import DashboardLayout from "@/layouts/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Award, Trophy, Target, Zap, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiGetUserProfile } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

export default function Profile() {
  // Fetch real user data from backend
  const { data: userProfile, isLoading, error } = useQuery({
    queryKey: ['userProfile'],
    queryFn: apiGetUserProfile,
  });

  // Mock achievements data (can be enhanced later based on real achievements)
  const achievements = [
    {
      id: 1,
      title: "First Task",
      description: "Complete your first task",
      icon: Target,
      unlocked: userProfile?.statistics?.completedTasks > 0,
    },
    {
      id: 2,
      title: "Speed Demon",
      description: "Complete 10 tasks in a day",
      icon: Zap,
      unlocked: false, // Can be implemented later with daily tracking
    },
    {
      id: 3,
      title: "Consistent",
      description: "Complete tasks for 7 days straight",
      icon: Star,
      unlocked: userProfile?.streak?.current >= 7,
    },
    {
      id: 4,
      title: "Master",
      description: "Complete 50 tasks",
      icon: Trophy,
      unlocked: userProfile?.statistics?.completedTasks >= 50,
    },
    {
      id: 5,
      title: "Perfect Week",
      description: "Complete all tasks in a week",
      icon: Award,
      unlocked: false, // Can be implemented later
    },
  ];

  const getLevelTitle = (level: number) => {
    if (level < 3) return "Beginner";
    if (level < 6) return "Intermediate";
    if (level < 10) return "Advanced";
    return "Expert";
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-5xl">
          <Skeleton className="h-10 w-48 mb-6" />
          
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <Skeleton className="h-8 w-32 mb-2" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <Skeleton className="h-8 w-16" />
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-3 w-full" />
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader className="pb-3">
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-16" />
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-24 mb-2" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-start gap-4 p-4 rounded-lg border">
                      <Skeleton className="w-12 h-12 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-5 w-24 mb-2" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="max-w-5xl">
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">Failed to load profile data</p>
            <p className="text-muted-foreground">Please try refreshing the page</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl">
        <h1 className="text-3xl font-bold text-foreground mb-6">Profile</h1>

        <div className="grid gap-6">
          {/* User Level Card */}
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{userProfile?.name || 'User'}</CardTitle>
                  <CardDescription className="text-lg mt-1">
                    Level {userProfile?.level?.current || 1} - {getLevelTitle(userProfile?.level?.current || 1)}
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  <Trophy className="w-4 h-4 mr-2" />
                  Lv {userProfile?.level?.current || 1}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Progress to Level {userProfile?.level?.nextLevel || 2}
                  </span>
                  <span className="font-medium">
                    {userProfile?.level?.progress || 0}%
                  </span>
                </div>
                <Progress
                  value={userProfile?.level?.progress || 0}
                  className="h-3"
                />
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">
                  {userProfile?.statistics?.totalTasks || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {userProfile?.statistics?.completedTasks || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pending
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">
                  {userProfile?.statistics?.pendingTasks || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Streak Card */}
          {userProfile?.streak?.current > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Current Streak
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600">
                  {userProfile.streak.current} days
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Keep it up! Complete tasks daily to maintain your streak.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Achievements */}
          <Card>
            <CardHeader>
              <CardTitle>Achievements</CardTitle>
              <CardDescription>
                Unlock achievements by completing tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`flex items-start gap-4 p-4 rounded-lg border ${
                      achievement.unlocked
                        ? "bg-primary/5 border-primary/20"
                        : "bg-muted/50 border-border opacity-60"
                    }`}
                  >
                    <div
                      className={`p-3 rounded-full ${
                        achievement.unlocked
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <achievement.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">
                        {achievement.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {achievement.description}
                      </p>
                      {achievement.unlocked && (
                        <Badge variant="secondary" className="mt-2">
                          Unlocked
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
