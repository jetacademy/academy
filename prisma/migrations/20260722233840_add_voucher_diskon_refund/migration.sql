-- AlterTable
ALTER TABLE `registration` MODIFY `status` ENUM('REGISTERED', 'PAID', 'PASSED', 'EXPIRED', 'FAILED', 'CANCELLED', 'REFUNDED') NOT NULL DEFAULT 'REGISTERED';

-- AlterTable
ALTER TABLE `payment` ADD COLUMN `discountAmount` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `originalAmount` INTEGER NULL,
    ADD COLUMN `refundAmount` INTEGER NULL,
    ADD COLUMN `refundReason` TEXT NULL,
    ADD COLUMN `refundedAt` DATETIME(3) NULL,
    ADD COLUMN `voucherId` VARCHAR(191) NULL,
    MODIFY `status` ENUM('PENDING', 'PAID', 'EXPIRED', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE `voucher` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `type` ENUM('PERCENT', 'FIXED') NOT NULL DEFAULT 'PERCENT',
    `value` INTEGER NOT NULL,
    `maxDiscount` INTEGER NULL,
    `maxUses` INTEGER NULL,
    `usedCount` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `validFrom` DATETIME(3) NULL,
    `validUntil` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `voucher_code_key`(`code`),
    INDEX `voucher_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `payment_voucherId_idx` ON `payment`(`voucherId`);

-- AddForeignKey
ALTER TABLE `payment` ADD CONSTRAINT `payment_voucherId_fkey` FOREIGN KEY (`voucherId`) REFERENCES `voucher`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

