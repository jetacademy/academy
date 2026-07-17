"use client";

export default function PrintButton() {
  return (
    <button className="btn btn-yellow btn-lg" onClick={() => window.print()}>
      Cetak / Simpan PDF
    </button>
  );
}
