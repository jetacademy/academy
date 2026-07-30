-- AlterTable: gerbang rilis sertifikat per program. Default FALSE — sertifikat baru TIDAK
-- PERNAH auto-terbit ke peserta sampai admin publish lewat /webadmin/program/[id]/cert setelah
-- menguji desainnya. Ini terpisah dari SystemSetting.certIssuanceEnabled (sakelar darurat situs-wide).
ALTER TABLE `program` ADD COLUMN `certPublished` BOOLEAN NOT NULL DEFAULT false;

-- Backfill: program yang SUDAH PERNAH menerbitkan sertifikat sebelum migrasi ini dianggap
-- sudah teruji di produksi — tetap dibiarkan published agar tidak mendadak berhenti terbit
-- untuk peserta program yang sedang berjalan. Program yang belum pernah menerbitkan (baru/belum
-- diuji) tetap FALSE sampai admin publish secara eksplisit.
UPDATE `program` p
SET p.certPublished = true
WHERE EXISTS (
  SELECT 1 FROM `registration` r
  INNER JOIN `certificate` c ON c.registrationId = r.id
  WHERE r.programId = p.id
);
