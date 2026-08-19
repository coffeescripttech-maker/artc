// Toast notifications
export const toast = {
  success: (message: string) => {
    if (typeof window !== "undefined") {
      const existing = document.querySelector(".toast-notification");
      if (existing) existing.remove();

      const toast = document.createElement("div");
      toast.className = "toast-notification fixed bottom-4 right-4 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg z-[100] animate-fade-in flex items-center gap-2";
      toast.innerHTML = `
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <span>${message}</span>
      `;
      document.body.appendChild(toast);
      setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transition = "opacity 0.3s";
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    }
  },
  error: (message: string) => {
    if (typeof window !== "undefined") {
      const existing = document.querySelector(".toast-notification");
      if (existing) existing.remove();

      const toast = document.createElement("div");
      toast.className = "toast-notification fixed bottom-4 right-4 bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg z-[100] animate-fade-in flex items-center gap-2";
      toast.innerHTML = `
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
        <span>${message}</span>
      `;
      document.body.appendChild(toast);
      setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transition = "opacity 0.3s";
        setTimeout(() => toast.remove(), 300);
      }, 4000);
    }
  },
  info: (message: string) => {
    if (typeof window !== "undefined") {
      const existing = document.querySelector(".toast-notification");
      if (existing) existing.remove();

      const toast = document.createElement("div");
      toast.className = "toast-notification fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-3 rounded-lg shadow-lg z-[100] animate-fade-in flex items-center gap-2";
      toast.innerHTML = `
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>${message}</span>
      `;
      document.body.appendChild(toast);
      setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transition = "opacity 0.3s";
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    }
  },
};
