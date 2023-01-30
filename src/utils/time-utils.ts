type TimeFormat = { hour12: boolean; hour: '2-digit'; minute: '2-digit' };
const dateOptions: TimeFormat = { hour12: false, hour: '2-digit', minute: '2-digit' };

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', dateOptions);
}
