-- CreateTable
CREATE TABLE `systemsetting` (
    `id` VARCHAR(191) NOT NULL,
    `certIssuanceEnabled` BOOLEAN NOT NULL DEFAULT true,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Seed singleton row HELD (dinonaktifkan) sesuai permintaan: penerbitan sertifikat baru
-- dihentikan sementara karena ada sertifikat yang terbit sebelum acara selesai — perlu diuji
-- ulang sebelum dibuka kembali lewat toggle di /webadmin/sertifikat.
INSERT INTO `systemsetting` (`id`, `certIssuanceEnabled`, `updatedAt`)
VALUES ('singleton', false, CURRENT_TIMESTAMP(3));
