"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CheckCircle2,
  AlertCircle,
  X,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Loader2,
} from "lucide-react";

type Tab = "email" | "password";
type Feedback = { message: string; type: "success" | "error" } | null;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentEmail: string;
}

export function AdminProfileModal({ isOpen, onClose, currentEmail }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("email");

  const [currentPassword, setCurrentPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  // Email tab
  const [newEmail, setNewEmail] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const resetForm = () => {
    setCurrentPassword("");
    setNewEmail("");
    setNewPassword("");
    setConfirmPassword("");
    setShowCurrentPw(false);
    setShowNewPw(false);
    setShowConfirmPw(false);
    setFeedback(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setFeedback(null);
  };

  const handleSubmit = async () => {
    setFeedback(null);

    if (!currentPassword) {
      setFeedback({ message: "Please enter your current password.", type: "error" });
      return;
    }

    if (activeTab === "email") {
      if (!newEmail.trim()) {
        setFeedback({ message: "Please enter a new email address.", type: "error" });
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newEmail.trim())) {
        setFeedback({ message: "Please enter a valid email address.", type: "error" });
        return;
      }
    }

    if (activeTab === "password") {
      if (!newPassword) {
        setFeedback({ message: "Please enter a new password.", type: "error" });
        return;
      }
      if (newPassword.length < 8) {
        setFeedback({ message: "New password must be at least 8 characters.", type: "error" });
        return;
      }
      if (newPassword !== confirmPassword) {
        setFeedback({ message: "Passwords do not match.", type: "error" });
        return;
      }
    }

    setIsLoading(true);
    try {
      const payload: Record<string, string> = { currentPassword };
      if (activeTab === "email") payload.newEmail = newEmail.trim().toLowerCase();
      if (activeTab === "password") payload.newPassword = newPassword;

      const res = await fetch("/api/admin/update-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        setFeedback({ message: data.message, type: "success" });
        setCurrentPassword("");
        setNewEmail("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setFeedback({ message: data.error || "Something went wrong.", type: "error" });
      }
    } catch {
      setFeedback({ message: "Network error. Please try again.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/70 backdrop-blur-sm">
      <div
        className="relative w-full max-w-md rounded-2xl border border-border bg-background shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-profile-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2
                id="admin-profile-modal-title"
                className="text-sm font-bold text-foreground"
              >
                Admin Account Settings
              </h2>
              <p className="text-[11px] text-muted-foreground">{currentEmail}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4">
          {(["email", "password"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${activeTab === tab
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
            >
              {tab === "email" ? (
                <Mail className="h-3 w-3" />
              ) : (
                <Lock className="h-3 w-3" />
              )}
              {tab === "email" ? "Change Email" : "Change Password"}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Current password — always required */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              Current Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                id="admin-current-password"
                type={showCurrentPw ? "text" : "password"}
                placeholder="Enter your current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="pr-10 h-9 text-sm"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPw((v) => !v)}
                className="absolute right-2.5 top-2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-2 bg-background text-[10px] text-muted-foreground uppercase tracking-widest">
                {activeTab === "email" ? "New Email" : "New Password"}
              </span>
            </div>
          </div>

          {/* Email tab fields */}
          {activeTab === "email" && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                New Email Address <span className="text-red-500">*</span>
              </label>
              <Input
                id="admin-new-email"
                type="email"
                placeholder="new@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="h-9 text-sm"
                autoComplete="email"
              />
            </div>
          )}

          {/* Password tab fields */}
          {activeTab === "password" && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    id="admin-new-password"
                    type={showNewPw ? "text" : "password"}
                    placeholder="Min. 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pr-10 h-9 text-sm"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw((v) => !v)}
                    className="absolute right-2.5 top-2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Password strength hint */}
                {newPassword.length > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    {[8, 12, 16].map((threshold, i) => (
                      <div
                        key={threshold}
                        className={`h-1 flex-1 rounded-full transition-colors ${newPassword.length >= threshold
                            ? i === 0 ? "bg-amber-500" : i === 1 ? "bg-blue-500" : "bg-emerald-500"
                            : "bg-muted"
                          }`}
                      />
                    ))}
                    <span className="text-[10px] text-muted-foreground ml-1">
                      {newPassword.length < 8 ? "Weak" : newPassword.length < 12 ? "Fair" : newPassword.length < 16 ? "Good" : "Strong"}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    id="admin-confirm-password"
                    type={showConfirmPw ? "text" : "password"}
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`pr-10 h-9 text-sm ${confirmPassword && confirmPassword !== newPassword
                        ? "border-red-500 focus-visible:ring-red-500/30"
                        : confirmPassword && confirmPassword === newPassword
                          ? "border-emerald-500 focus-visible:ring-emerald-500/30"
                          : ""
                      }`}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPw((v) => !v)}
                    className="absolute right-2.5 top-2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmPassword && confirmPassword !== newPassword && (
                  <p className="text-[11px] text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> Passwords do not match
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Feedback banner */}
          {feedback && (
            <div
              className={`flex items-start gap-2 px-3 py-2.5 rounded-lg border text-xs animate-in fade-in slide-in-from-top-1 duration-200 ${feedback.type === "success"
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                  : "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20"
                }`}
            >
              {feedback.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
              )}
              <span className="font-medium">{feedback.message}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 pb-5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClose}
            className="h-9 text-xs"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={isLoading}
            className="h-9 text-xs font-bold min-w-[120px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />
                {activeTab === "email" ? "Update Email" : "Update Password"}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
