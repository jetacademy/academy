import { prisma } from "./src/lib/prisma";

async function main() {
  await prisma.program.deleteMany({ where: { slug: "tes-visual-blok" } });
  const p = await prisma.program.create({
    data: {
      slug: "tes-visual-blok",
      type: "WORKSHOP",
      title: "Membangun Perusahaan Tanpa Karyawan dengan Agent AI",
      tagline: "Bangun tim AI Agent yang bekerja 24 jam untuk bisnis Anda",
      description: "desc lama tidak dipakai karena ada blok",
      mentorName: "Tim Jetschool",
      mentorBio: "Praktisi AI Agent untuk bisnis.",
      materi: ["A", "B"],
      deliverables: [{ label: "Rekaman", value: 100000 }],
      scheduleAt: new Date("2026-09-01T10:00:00.000Z"),
      price: 225000,
      priceOld: 490000,
      certPrice: 49000,
      contentBlocks: [
        { id: "1", type: "heading", text: "Kenapa Perlu AI Agent?" },
        {
          id: "2",
          type: "text",
          html: "<p>Pernah merasa kewalahan karena harus balas chat pelanggan satu per satu? Capek follow-up lead yang tidak pernah closing? Ingin bisnis tetap jalan meski Anda sedang tidur? Sekarang ada caranya: bangun TIM AGEN AI yang bekerja 24 jam untuk Anda. Cukup dari WhatsApp.</p><p>Workshop ini dirancang untuk pemilik bisnis, founder UMKM, dan siapa pun yang ingin operasional bisnisnya berjalan otomatis tanpa harus menambah karyawan. Anda tidak perlu latar belakang IT atau bisa coding.</p>",
        },
        { id: "3", type: "heading", text: "Yang Anda Pelajari" },
        { id: "4", type: "list", items: ["Riset target audiens", "Copywriting iklan", "Optimasi budget iklan", "Setup AI Agent WhatsApp"] },
        { id: "5", type: "heading", text: "Yang Anda Terima" },
        { id: "6", type: "stack", items: [{ label: "Rekaman selamanya", value: 150000 }, { label: "Akses grup komunitas", value: 0 }, { label: "Template prompt AI Agent", value: 200000 }] },
        { id: "7", type: "image", url: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200", caption: "Contoh dashboard AI Agent" },
        { id: "8", type: "quote", text: "Setelah pakai AI Agent, closing rate naik 3x tanpa nambah tim.", author: "Budi, Founder UMKM" },
      ],
    },
  });
  console.log("slug=" + p.slug);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
