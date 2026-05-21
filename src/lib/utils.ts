import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type Params = Partial<
  Record<keyof URLSearchParams, string | number | null | undefined>
>;

export function createQueryString(
  params: Params,
  searchParams: URLSearchParams
) {
  const newSearchParams = new URLSearchParams(searchParams?.toString());

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) {
      newSearchParams.delete(key);
    } else {
      newSearchParams.set(key, String(value));
    }
  }

  return newSearchParams.toString();
}

export function formatDate(
  date: Date | string | number,
  opts: Intl.DateTimeFormatOptions = {}
) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: opts.month ?? "long",
    day: opts.day ?? "numeric",
    year: opts.year ?? "numeric",
    ...opts,
  }).format(new Date(date));
}

/**
 * Masks a username for anonymous reviews
 * Shows first letter + asterisks + last letter
 * Example: "Alexander" -> "A*****r"
 */
export function maskUsername(username: string): string {
  if (!username || username.length === 0) {
    return "Anonymous";
  }
  
  if (username.length === 1) {
    return username[0] + "*";
  }
  
  if (username.length === 2) {
    return username[0] + "*" + username[1];
  }
  
  const firstChar = username[0];
  const lastChar = username[username.length - 1];
  const middleLength = Math.max(5, username.length - 2);
  const asterisks = "*".repeat(middleLength);
  
  return firstChar + asterisks + lastChar;
}
