import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProgramSubTabs from "@/components/ProgramSubTabs";

export default async function ProgramEditorLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const program = await prisma.program.findUnique({
    where: { id },
    select: { id: true, title: true, slug: true, type: true, isActive: true },
  });
  if (!program) notFound();

  return (
    <>
      <div className="prog-editor-head">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: ".7rem", flexWrap: "wrap" }}>
            <Link href="/webadmin/program" style={{ color: "var(--ink-faint)", fontSize: ".82rem", fontWeight: 700 }}>
              ← Semua Program
            </Link>
            <span className={`badge ${program.isActive ? "g" : "dim"}`}>{program.isActive ? "Aktif" : "Nonaktif"}</span>
            <span className="badge">{program.type}</span>
          </div>
          <h1 style={{ fontSize: "clamp(1.3rem, 3vw, 1.7rem)", margin: ".35rem 0 0" }}>{program.title}</h1>
        </div>
        <a href={`/program/${program.slug}`} target="_blank" className="btn btn-sm">
          Lihat Halaman Publik ↗
        </a>
      </div>

      <ProgramSubTabs programId={program.id} />

      <div style={{ marginTop: "1.6rem" }}>{children}</div>
    </>
  );
}
