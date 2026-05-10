export function formatRuntime(runtimeMinutes: number | null | undefined) {
  if (!runtimeMinutes || runtimeMinutes <= 0) {
    return "Runtime TBD";
  }

  const hours = Math.floor(runtimeMinutes / 60);
  const minutes = runtimeMinutes % 60;

  if (hours === 0) {
    return `${minutes}m`;
  }

  return `${hours}h ${minutes}m`;
}

export function formatMovieMeta(year: number | null | undefined, runtimeMinutes: number | null | undefined) {
  const parts = [];

  if (year && year > 0) {
    parts.push(String(year));
  }

  if (runtimeMinutes && runtimeMinutes > 0) {
    parts.push(formatRuntime(runtimeMinutes));
  }

  return parts.join(" • ");
}
