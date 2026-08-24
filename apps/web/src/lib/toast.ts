// Toast notifications — powered by sonner
// Drop-in replacement for the old DOM-manipulation toast.
// Keeps the same API (toast.success/error/info) so callers need no changes.
import { toast as sonnerToast } from "sonner";

export const toast = {
  success: (message: string) => sonnerToast.success(message),
  error: (message: string) => sonnerToast.error(message),
  info: (message: string) => sonnerToast.info(message),
  warning: (message: string) => sonnerToast.warning(message),
  message: (message: string) => sonnerToast.message(message),
  promise: sonnerToast.promise,
  loading: sonnerToast.loading,
};

export default toast;
