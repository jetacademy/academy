import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-card">
          <div className="brand">
            <Image
              src="/iconjetschool academy.png"
              alt="Jetschool Academy"
              width={40}
              height={40}
              style={{ objectFit: "contain" }}
            />
            Jetschool Academy
          </div>
          <nav className="footer-links">
            <Link href="/about">Tentang Kami</Link>
            <Link href="/program">Program</Link>
            <Link href="/faq">FAQ</Link>
            <Link href="/contact">Hubungi Kami</Link>
            <Link href="/terms">Syarat & Ketentuan</Link>
            <Link href="/privacy-policy">Kebijakan Privasi</Link>
            <Link href="/sertifikat">Ambil Sertifikat</Link>
          </nav>
          <span style={{ fontSize: ".78rem" }}>© {new Date().getFullYear()} Jetschool Academy</span>
        </div>
      </div>
    </footer>
  );
}
