"use client";

import { useState, useEffect } from "react";
import { Instrument_Serif } from "next/font/google";
import { User, Lock, Mail, Loader2 } from "lucide-react";
import { useSession, authClient } from "@/lib/auth-client";
import { PageContainer } from "@/components/ui/page-container";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export default function ProfilePage() {
  const { data: session, refetch } = useSession();

  // Profile form state
  const [name, setName] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Initialize name from session
  useEffect(() => {
    if (session?.user?.name) {
      setName(session.user.name);
    }
  }, [session?.user?.name]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    setIsUpdatingProfile(true);
    try {
      await authClient.updateUser({ name: name.trim() });
      await refetch();
      toast.success("Profile updated successfully");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }

    setIsChangingPassword(true);
    try {
      await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: false,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password changed successfully");
    } catch {
      toast.error("Failed to change password. Please check your current password.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (!session?.user) {
    return null;
  }

  return (
    <PageContainer variant="narrow">
      <div className="space-y-8 py-6">
        {/* Page Header */}
        <div>
          <h1
            className={cn(
              instrumentSerif.className,
              "text-3xl tracking-[-0.02em] text-stone-900 dark:text-stone-100 sm:text-4xl"
            )}
          >
            Profile Settings
          </h1>
          <p className="mt-2 text-stone-500 dark:text-stone-400">
            Manage your account information and password
          </p>
        </div>

        {/* Profile Information Card */}
        <Card className="border-stone-200 dark:border-stone-800">
          <CardHeader className="border-b border-stone-100 dark:border-stone-800">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-stone-100 dark:bg-stone-800">
                <User className="size-5 text-stone-600 dark:text-stone-400" />
              </div>
              <div>
                <CardTitle className="text-lg">Profile Information</CardTitle>
                <CardDescription>Update your name and view your email</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-stone-600 dark:text-stone-400">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
                  <Input
                    id="email"
                    value={session.user.email}
                    disabled
                    className="pl-10 text-stone-500 dark:text-stone-400"
                  />
                </div>
                <p className="text-xs text-stone-400">Email cannot be changed</p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="name" className="text-stone-600 dark:text-stone-400">
                  Name
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="bg-white dark:bg-stone-900"
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={isUpdatingProfile || name === session.user.name}
                  className="min-w-[120px]"
                >
                  {isUpdatingProfile ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Change Password Card */}
        <Card className="border-stone-200 dark:border-stone-800">
          <CardHeader className="border-b border-stone-100 dark:border-stone-800">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-stone-100 dark:bg-stone-800">
                <Lock className="size-5 text-stone-600 dark:text-stone-400" />
              </div>
              <div>
                <CardTitle className="text-lg">Change Password</CardTitle>
                <CardDescription>Update your password to keep your account secure</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="currentPassword" className="text-stone-600 dark:text-stone-400">
                  Current Password
                </Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="bg-white dark:bg-stone-900"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="newPassword" className="text-stone-600 dark:text-stone-400">
                  New Password
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="bg-white dark:bg-stone-900"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="confirmPassword" className="text-stone-600 dark:text-stone-400">
                  Confirm New Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="bg-white dark:bg-stone-900"
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                  className="min-w-[140px]"
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Changing...
                    </>
                  ) : (
                    "Change Password"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
