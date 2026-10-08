export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

export const focusRing =
'outline-none focus-visible:ring-2 focus-visible:ring-accent/60';