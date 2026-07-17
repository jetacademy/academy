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

export function formatJam(d: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(d).replace(".", ":") + " WIB";
}

export function rupiah(n: number): string {
  return "Rp " + n.toLocaleString("id-ID");
}
