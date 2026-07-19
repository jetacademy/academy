"use client";

import { useState } from "react";
import { regenerateApiKey } from "@/app/webadmin/actions";

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API tidak tersedia (mis. http tanpa TLS) — biarkan user select manual
    }
  }

  return (
    <div className="field full">
      <label>{label}</label>
      <div style={{ display: "flex", gap: ".5rem" }}>
        <input type="text" value={value} readOnly onFocus={(e) => e.target.select()} style={{ fontFamily: "monospace", fontSize: ".85rem" }} />
        <button type="button" className="btn btn-sm" onClick={handleCopy} style={{ flexShrink: 0 }}>
          {copied ? "Tersalin!" : "Salin"}
        </button>
      </div>
    </div>
  );
}

export default function ApiIntegrationClient({ apiUrl, apiKey }: { apiUrl: string; apiKey: string }) {
  const [confirming, setConfirming] = useState(false);

  return (
    <>
      <div className="form-section">
        <header>
          <h3>Endpoint & Key</h3>
          <p>Konfigurasikan ini di Hermes agent marketing untuk membaca katalog program secara otomatis.</p>
        </header>
        <div className="fs-body">
          <CopyField label="URL Endpoint" value={apiUrl} />
          <CopyField label="API Key (header X-API-Key)" value={apiKey} />
        </div>
      </div>

      <div className="form-section">
        <header>
          <h3>Contoh Pemakaian</h3>
        </header>
        <div className="fs-body">
          <div className="field full">
            <pre style={{
              background: "var(--chip)",
              padding: "1rem",
              borderRadius: "var(--r-sm)",
              fontSize: ".8rem",
              overflowX: "auto",
              fontFamily: "monospace",
            }}>
{`curl "${apiUrl}" \\
  -H "X-API-Key: ${apiKey}"`}
            </pre>
          </div>
        </div>
      </div>

      <div className="form-section">
        <header>
          <h3>Regenerate Key</h3>
          <p>Key lama langsung berhenti berfungsi. Update konfigurasi Hermes agent setelah regenerate.</p>
        </header>
        <div className="fs-body">
          <div className="field full">
            {!confirming ? (
              <button type="button" className="btn btn-sm btn-danger" onClick={() => setConfirming(true)} style={{ width: "fit-content" }}>
                Regenerate API Key
              </button>
            ) : (
              <div style={{ display: "flex", gap: ".6rem", alignItems: "center" }}>
                <span style={{ fontSize: ".85rem", fontWeight: 700 }}>Yakin? Integrasi yang pakai key lama akan berhenti.</span>
                <form action={regenerateApiKey}>
                  <button type="submit" className="btn btn-sm btn-danger">Ya, Regenerate</button>
                </form>
                <button type="button" className="btn btn-sm" onClick={() => setConfirming(false)}>Batal</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
