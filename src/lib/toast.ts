import { toast } from "sonner";

export function toastSuccess(message: string) {
  toast.success(message, {
    duration: 4000,
  });
}

export function toastError(message: string) {
  toast.error(message, {
    duration: 5000,
  });
}

export function toastInfo(message: string) {
  toast.info(message, {
    duration: 4000,
  });
}

export function toastWarning(message: string) {
  toast.warning(message, {
    duration: 4000,
  });
}

export function toastLoading(message: string) {
  return toast.loading(message);
}

export function toastDismiss(toastId?: string | number) {
  toast.dismiss(toastId);
}
