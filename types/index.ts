export type User = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string;
  role: "user" | "admin";
  createdAt: Date;
};

export type Session = {
  user: User;
  expires: string;
};

export type NavLink = {
  label: string;
  href: string;
  icon?: string;
  external?: boolean;
};

export type ActionState<T = void> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

export type OTPPurpose = "email-verification" | "password-reset";

export type ToastType = "success" | "error" | "info" | "warning";

export type ToastItem = {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
};

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "destructive"
  | "outline";

export type LoaderVariant = "spinner" | "dots" | "skeleton";
