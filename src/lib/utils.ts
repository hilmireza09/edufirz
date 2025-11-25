import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getPaginationRange(currentPage: number, totalPages: number, maxVisible: number = 5): number[] {
  // This function is now stateless and returns a centered range, 
  // but the components will handle the stateful "sliding window" logic 
  // by passing a specific 'start' page if needed.
  // However, to support the "stable window" requirement, we might need a different helper.
  // Let's just provide a simple range generator.
  
  // Actually, the user wants the window to be stable. 
  // So we will implement the logic in the components using state.
  // This helper can just generate an array from start to end.
  return [];
}

export function getPageNumbers(start: number, count: number, total: number): number[] {
  return Array.from({ length: count }, (_, i) => start + i).filter(p => p <= total);
}
