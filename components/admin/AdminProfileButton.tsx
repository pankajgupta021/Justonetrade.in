"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AdminProfileModal } from "./AdminProfileModal";
import { Settings } from "lucide-react";

interface Props {
  email: string;
}

export function AdminProfileButton({ email }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-8 text-xs font-semibold gap-1.5 border-border text-muted-foreground hover:text-foreground"
        title="Admin account settings"
      >
        <Settings className="h-3.5 w-3.5" />
        Profile Settings
      </Button>

      <AdminProfileModal
        isOpen={open}
        onClose={() => setOpen(false)}
        currentEmail={email}
      />
    </>
  );
}
