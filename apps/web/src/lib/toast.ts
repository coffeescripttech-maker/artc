// Toast notifications — powered by sonner
// Drop-in replacement for the old DOM-manipulation toast.
// Keeps the same API (toast.success/error/info) so callers need no changes.
import { toast as sonnerToast } from "sonner";

type ToastFn = (message: string) => void;

const success: ToastFn = (message) => sonnerToast.success(message);
const error: ToastFn = (message) => sonnerToast.error(message);
const info: ToastFn = (message) => sonnerToast.info(message);
const warning: ToastFn = (message) => sonnerToast.warning(message);
const message: ToastFn = (message) => sonnerToast.message(message);

export const toast = { success, error, info, warning, message };

export default toast;
