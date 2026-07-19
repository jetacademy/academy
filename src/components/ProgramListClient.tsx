"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WaFloat from "@/components/WaFloat";
import Icon, { TYPE_ICON } from "@/components/Icon";
import { TYPE_LABEL, type ProgramData, type ProgramType } from "@/lib/fallback";
import { formatHari, formatJam, rupiah } from "@/lib/format";

const TYPE_CLASS: Record<ProgramType, string> = {
  WEBINAR: "type-webinar",
  KELAS: "type-kelas",
  WORKSHOP: "type-workshop",
  BOOTCAMP: "type-bootcamp",
};

interface CategoryInfo {
  id: string;
  name: string;
  slug: string;
}

export default function ProgramListClient({
  initialPrograms,
  categories,
}: {
  initialPrograms: ProgramData[];
  categories: CategoryInfo[];
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedType, setSelectedType] = useState<"ALL" | ProgramType>("ALL");
  const [sortBy, setSortBy] = useState<"schedule" | "price-asc" | "price-desc">("schedule");
  const [visibleCount, setVisibleCount] = useState(12);

  const filteredPrograms = useMemo(() => {
    let result = [...initialPrograms];

    // Filter by Search Query
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.tagline.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.mentorName.toLowerCase().includes(q)
      );
    }

    // Filter by Category
    if (selectedCategory !== "all") {
      result = result.filter((p) => p.category?.slug === selectedCategory || p.categoryId === selectedCategory);
    }

    // Filter by Type
    if (selectedType !== "ALL") {
      result = result.filter((p) => p.type === selectedType);
    }

    // Sort Results
    if (sortBy === "schedule") {
      result.sort((a, b) => new Date(a.scheduleAt).getTime() - new Date(b.scheduleAt).getTime());
    } else if (sortBy === "price-asc") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }, [initialPrograms, searchQuery, selectedCategory, selectedType, sortBy]);

  const displayedPrograms = useMemo(() => {
    return filteredPrograms.slice(0, visibleCount);
  }, [filteredPrograms, visibleCount]);

  const hasMore = filteredPrograms.length > visibleCount;

  return (
    <>
      <Navbar ctaHref="/program" ctaLabel="Daftar Program" />

      {/* ===== HERO PROGRAM ===== */}
      <section className="section" style={{ background: "var(--purple-soft)", padding: "4rem 0 3rem" }}>
        <div className="container">
          <div style={{ maxWidth: "36rem" }}>
            <span className="kicker kicker-ai" style={{ marginBottom: "0.8rem" }}>
              <span className="kicker-dot" />
              Katalog Pelatihan Resmi
            </span>
            <h1 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: "0.8rem" }}>
              Jelajahi Program <span className="hero-h1-accent">Terbaik Kami.</span>
            </h1>
            <p className="lead" style={{ color: "var(--ink-soft)", fontSize: "1rem", lineHeight: 1.6 }}>
              Pilih dari berbagai pilihan webinar gratis, kelas online mandiri, workshop intensif, dan bootcamp terarah untuk meningkatkan keahlian Anda.
            </p>
          </div>
        </div>
      </section>

      {/* ===== FILTERS & CONTENT ===== */}
      <section className="section" style={{ minHeight: "60vh", padding: "2.5rem 0 5rem" }}>
        <div className="container">
          {/* Search & Sort Panel */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: "1rem",
            alignItems: "center",
            marginBottom: "2rem"
          }}>
            {/* Search Input */}
            <div style={{ position: "relative", width: "100%" }}>
              <span style={{
                position: "absolute",
                left: "1.2rem",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--ink-faint)",
                display: "flex",
                alignItems: "center",
                pointerEvents: "none"
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </span>
              <input
                type="text"
                placeholder="Cari pelatihan, topik, atau nama mentor..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setVisibleCount(12);
                }}
                style={{
                  width: "100%",
                  padding: "1rem 1rem 1rem 3rem",
                  borderRadius: "999px",
                  border: "1px solid var(--line)",
                  background: "var(--white)",
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  color: "var(--ink)",
                  boxShadow: "var(--shadow-sm)",
                  outline: "none",
                  transition: "all 0.2s ease"
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--purple)";
                  e.target.style.boxShadow = "0 0 0 4px var(--purple-soft)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "var(--line)";
                  e.target.style.boxShadow = "var(--shadow-sm)";
                }}
              />
            </div>

            {/* Sort Select */}
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "schedule" | "price-asc" | "price-desc")}
                style={{
                  padding: "1rem 2rem 1rem 1.2rem",
                  borderRadius: "999px",
                  border: "1px solid var(--line)",
                  background: "var(--white)",
                  fontSize: "0.9rem",
                  fontWeight: 700,
                  color: "var(--ink)",
                  boxShadow: "var(--shadow-sm)",
                  cursor: "pointer",
                  outline: "none",
                  appearance: "none",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%232d3748' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 1rem center",
                  backgroundSize: "1rem"
                }}
              >
                <option value="schedule">Jadwal Terdekat</option>
                <option value="price-asc">Harga Terendah</option>
                <option value="price-desc">Harga Tertinggi</option>
              </select>
            </div>
          </div>

          {/* Filter Chips Container */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "3rem" }}>
            {/* Category Pills */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "var(--ink-faint)", textTransform: "uppercase", letterSpacing: "0.05em", marginRight: "0.5rem" }}>Kategori:</span>
              <button
                type="button"
                onClick={() => { setSelectedCategory("all"); setVisibleCount(12); }}
                style={{
                  padding: "0.5rem 1.2rem",
                  borderRadius: "999px",
                  border: "1px solid " + (selectedCategory === "all" ? "var(--purple)" : "var(--line)"),
                  background: selectedCategory === "all" ? "var(--purple)" : "var(--white)",
                  color: selectedCategory === "all" ? "#fff" : "var(--ink-soft)",
                  fontWeight: 700,
                  fontSize: "0.82rem",
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}
              >
                Semua Kategori
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => { setSelectedCategory(cat.slug); setVisibleCount(12); }}
                  style={{
                    padding: "0.5rem 1.2rem",
                    borderRadius: "999px",
                    border: "1px solid " + (selectedCategory === cat.slug ? "var(--purple)" : "var(--line)"),
                    background: selectedCategory === cat.slug ? "var(--purple)" : "var(--white)",
                    color: selectedCategory === cat.slug ? "#fff" : "var(--ink-soft)",
                    fontWeight: 700,
                    fontSize: "0.82rem",
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Type Pills */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "var(--ink-faint)", textTransform: "uppercase", letterSpacing: "0.05em", marginRight: "0.5rem" }}>Tipe Program:</span>
              <button
                type="button"
                onClick={() => { setSelectedType("ALL"); setVisibleCount(12); }}
                style={{
                  padding: "0.5rem 1.2rem",
                  borderRadius: "999px",
                  border: "1px solid " + (selectedType === "ALL" ? "var(--ink)" : "var(--line)"),
                  background: selectedType === "ALL" ? "var(--ink)" : "var(--white)",
                  color: selectedType === "ALL" ? "#fff" : "var(--ink-soft)",
                  fontWeight: 700,
                  fontSize: "0.82rem",
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}
              >
                Semua Tipe
              </button>
              {(Object.keys(TYPE_LABEL) as ProgramType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => { setSelectedType(type); setVisibleCount(12); }}
                  style={{
                    padding: "0.5rem 1.2rem",
                    borderRadius: "999px",
                    border: "1px solid " + (selectedType === type ? "var(--ink)" : "var(--line)"),
                    background: selectedType === type ? "var(--ink)" : "var(--white)",
                    color: selectedType === type ? "#fff" : "var(--ink-soft)",
                    fontWeight: 700,
                    fontSize: "0.82rem",
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                >
                  {TYPE_LABEL[type]}
                </button>
              ))}
            </div>
          </div>

          {/* Grid Content */}
          {filteredPrograms.length > 0 ? (
            <>
              <div className="prg-grid">
                {displayedPrograms.map((p) => (
                  <Link key={p.slug} href={`/program/${p.slug}`} className="prg-card" style={{ display: "flex", flexDirection: "column" }}>
                    <div className="prg-top">
                      <span className={`type-tag ${TYPE_CLASS[p.type]}`}>{TYPE_LABEL[p.type]}</span>
                      <span className="dot-btn dot-p" style={{ width: 38, height: 38 }}>
                        <Icon name={TYPE_ICON[p.type]} />
                      </span>
                    </div>
                    <h3 style={{ marginTop: "1rem", marginBottom: "0.5rem" }}>{p.title}</h3>
                    <p style={{ fontSize: "0.84rem", color: "var(--ink-soft)", margin: "0.2rem 0" }}>
                      Mentor: <strong style={{ color: "var(--ink)" }}>{p.mentorName}</strong>
                    </p>
                    <p className="desc">{formatHari(p.scheduleAt)}, {formatJam(p.scheduleAt)} · {p.durationLabel}</p>
                    <div className="prg-foot" style={{ marginTop: "auto", paddingTop: "1rem" }}>
                      <div className="prg-price">
                        {p.price === 0 ? (
                          <b className="free">GRATIS</b>
                        ) : (
                          <b>{rupiah(p.price)}</b>
                        )}
                        {p.priceOld && <span style={{ textDecoration: "line-through" }}>{rupiah(p.priceOld)}</span>}
                      </div>
                      <span className="dot-btn dot-k"><Icon name="arrowRight" /></span>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Load More Button */}
              {hasMore && (
                <div style={{ textAlign: "center", marginTop: "3.5rem" }}>
                  <button
                    type="button"
                    className="btn btn-purple"
                    style={{ padding: "1rem 3rem" }}
                    onClick={() => setVisibleCount((prev) => prev + 12)}
                  >
                    Tampilkan Lebih Banyak
                  </button>
                </div>
              )}
            </>
          ) : (
            /* No Results State */
            <div className="bento" style={{ textAlign: "center", padding: "4rem 2rem", background: "var(--white)" }}>
              <div style={{
                width: "4rem", height: "4rem", borderRadius: "50%",
                background: "var(--purple-soft)", color: "var(--purple)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.8rem", margin: "0 auto 1.5rem"
              }}>
                🔍
              </div>
              <h3 style={{ fontSize: "1.35rem", marginBottom: "0.5rem" }}>Program tidak ditemukan</h3>
              <p className="sub" style={{ color: "var(--ink-soft)", maxWidth: "26rem", margin: "0 auto 2rem" }}>
                Tidak ada program yang cocok dengan filter atau kata kunci pencarian Anda. Coba bersihkan pencarian atau ubah filter kategori.
              </p>
              <button
                type="button"
                className="btn btn-purple"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                  setSelectedType("ALL");
                  setVisibleCount(12);
                }}
              >
                Reset Filter & Pencarian
              </button>
            </div>
          )}
        </div>
      </section>

      <Footer />
      <WaFloat />
    </>
  );
}
