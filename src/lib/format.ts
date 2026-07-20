// Format tanggal & rupiah gaya Indonesia

export function formatJadwal(d: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(d).replace(/\./g, ":") + " WIB";
}

export function formatHari(d: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    timeZone: "Asia/Jakarta",
  }).format(d);
}

// Hari + tanggal singkat, mis. "Kamis, 30 Jul" — dipakai di tempat yang
// perlu menunjukkan tanggal batch terdekat secara jelas (bukan cuma nama hari).
export function formatHariTanggal(d: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "short",
    timeZone: "Asia/Jakarta",
  }).format(d);
}

export function formatJam(d: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(d).replace(/\\./g, ":") + " WIB";
}

export function rupiah(n: number): string {
  return "Rp " + n.toLocaleString("id-ID");
}

export function getDaysLeft(scheduleAt: Date): number {
  const diff = (new Date(scheduleAt).getTime() - Date.now()) / 86_400_000;
  return diff < 1 && diff > -0.5 ? 0 : Math.max(0, Math.ceil(diff));
}

