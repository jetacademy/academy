export default function WaFloat({ text = "Halo admin, saya mau tanya tentang webinar Jetschool" }: { text?: string }) {
  const waAdmin = process.env.NEXT_PUBLIC_WA_ADMIN ?? "6281234567890";
  return (
    <a
      className="wa-float"
      href={`https://wa.me/${waAdmin}?text=${encodeURIComponent(text)}`}
      target="_blank"
      rel="noopener"
      aria-label="Chat WhatsApp"
    >
      <svg viewBox="0 0 32 32">
        <path d="M16 3C9.4 3 4 8.4 4 15c0 2.6.8 5 2.2 7L4 29l7.2-2.1c1.9 1 4 1.6 6.3 1.6h.5c6.6 0 12-5.4 12-12S22.6 3 16 3zm5.9 17c-.3.8-1.6 1.5-2.3 1.6-.6.1-1.3.2-2.2-.1-.5-.2-1.2-.4-2-.8-3.5-1.5-5.8-5.1-6-5.3-.2-.2-1.4-1.9-1.4-3.6s.9-2.5 1.2-2.9c.3-.3.7-.4.9-.4h.7c.2 0 .5-.1.8.6.3.8 1 2.6 1.1 2.8.1.2.2.4 0 .7-.1.2-.2.4-.4.6l-.6.7c-.2.2-.4.4-.2.8.2.4 1 1.7 2.2 2.7 1.5 1.3 2.8 1.7 3.2 1.9.4.2.6.2.9-.1.2-.3 1-1.2 1.3-1.6.3-.4.5-.3.9-.2.4.1 2.4 1.1 2.8 1.3.4.2.7.3.8.5.1.3.1 1-.2 1.8z" />
      </svg>
    </a>
  );
}
