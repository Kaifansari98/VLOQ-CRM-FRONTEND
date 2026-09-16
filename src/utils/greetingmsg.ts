export function getGreeting(date: Date = new Date()): string {
  const hour = date.getHours();

  if (hour < 12) return "Hey, Good morning";
  if (hour < 18) return "Hey, Good afternoon,";
  return "Hey, Good evening,";
}