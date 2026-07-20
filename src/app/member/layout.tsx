import type { Metadata } from "next";
import "../globals-lms.css";

export const metadata: Metadata = {
  title: {
    default: "Dashboard Member — Jetschool Academy",
    template: "%s — Jetschool Academy",
  },
  robots: { index: false, follow: false },
};

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
