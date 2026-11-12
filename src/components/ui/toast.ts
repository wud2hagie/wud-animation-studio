import type * as React from "react";

/**
 * Type contract used by the legacy use-toast hook.
 * The active application currently uses Sonner for rendered notifications.
 */
export type ToastActionElement = React.ReactElement;

export type ToastProps = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
  variant?: "default" | "destructive";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};
