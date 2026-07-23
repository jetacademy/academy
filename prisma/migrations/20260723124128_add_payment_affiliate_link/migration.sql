-- AlterTable
ALTER TABLE `payment` ADD COLUMN `affiliateId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `payment_affiliateId_idx` ON `payment`(`affiliateId`);

-- AddForeignKey
ALTER TABLE `payment` ADD CONSTRAINT `payment_affiliateId_fkey` FOREIGN KEY (`affiliateId`) REFERENCES `affiliate`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
