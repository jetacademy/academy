-- CreateTable
CREATE TABLE `affiliate` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `commissionType` ENUM('PERCENT', 'FIXED') NOT NULL DEFAULT 'PERCENT',
    `commissionValue` INTEGER NOT NULL DEFAULT 10,
    `discountType` ENUM('PERCENT', 'FIXED') NOT NULL DEFAULT 'PERCENT',
    `discountValue` INTEGER NOT NULL DEFAULT 0,
    `bankName` VARCHAR(191) NULL,
    `bankAccountNumber` VARCHAR(191) NULL,
    `bankAccountName` VARCHAR(191) NULL,
    `ewalletChannel` VARCHAR(191) NULL,
    `ewalletNumber` VARCHAR(191) NULL,
    `clickCount` INTEGER NOT NULL DEFAULT 0,
    `invitedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `invitedBy` VARCHAR(191) NULL,
    `respondedAt` DATETIME(3) NULL,
    `adminNote` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `affiliate_userId_key`(`userId`),
    UNIQUE INDEX `affiliate_code_key`(`code`),
    INDEX `affiliate_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `affiliateconversion` (
    `id` VARCHAR(191) NOT NULL,
    `affiliateId` VARCHAR(191) NOT NULL,
    `paymentId` VARCHAR(191) NOT NULL,
    `registrationId` VARCHAR(191) NOT NULL,
    `saleAmount` INTEGER NOT NULL,
    `discountGiven` INTEGER NOT NULL DEFAULT 0,
    `commissionAmount` INTEGER NOT NULL,
    `commissionTypeSnapshot` ENUM('PERCENT', 'FIXED') NOT NULL,
    `commissionRateSnapshot` INTEGER NOT NULL,
    `status` ENUM('PENDING', 'AVAILABLE', 'WITHDRAWN', 'VOIDED') NOT NULL DEFAULT 'PENDING',
    `availableAt` DATETIME(3) NULL,
    `voidedAt` DATETIME(3) NULL,
    `voidReason` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `affiliateconversion_paymentId_key`(`paymentId`),
    INDEX `affiliateconversion_affiliateId_idx`(`affiliateId`),
    INDEX `affiliateconversion_status_idx`(`status`),
    INDEX `affiliateconversion_affiliateId_status_idx`(`affiliateId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `affiliatewithdrawal` (
    `id` VARCHAR(191) NOT NULL,
    `affiliateId` VARCHAR(191) NOT NULL,
    `amount` INTEGER NOT NULL,
    `channelCode` VARCHAR(191) NOT NULL,
    `accountNumber` VARCHAR(191) NOT NULL,
    `accountHolderName` VARCHAR(191) NOT NULL,
    `status` ENUM('REQUESTED', 'PROCESSING', 'COMPLETED', 'REJECTED', 'FAILED') NOT NULL DEFAULT 'REQUESTED',
    `xenditPayoutId` VARCHAR(191) NULL,
    `xenditReferenceId` VARCHAR(191) NULL,
    `failureReason` TEXT NULL,
    `adminNote` TEXT NULL,
    `requestedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `processedAt` DATETIME(3) NULL,
    `processedBy` VARCHAR(191) NULL,

    UNIQUE INDEX `affiliatewithdrawal_xenditPayoutId_key`(`xenditPayoutId`),
    UNIQUE INDEX `affiliatewithdrawal_xenditReferenceId_key`(`xenditReferenceId`),
    INDEX `affiliatewithdrawal_affiliateId_idx`(`affiliateId`),
    INDEX `affiliatewithdrawal_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `affiliatesettings` (
    `id` VARCHAR(191) NOT NULL,
    `defaultCommissionType` ENUM('PERCENT', 'FIXED') NOT NULL DEFAULT 'PERCENT',
    `defaultCommissionValue` INTEGER NOT NULL DEFAULT 10,
    `defaultDiscountType` ENUM('PERCENT', 'FIXED') NOT NULL DEFAULT 'PERCENT',
    `defaultDiscountValue` INTEGER NOT NULL DEFAULT 5,
    `minWithdrawal` INTEGER NOT NULL DEFAULT 100000,
    `holdDays` INTEGER NOT NULL DEFAULT 7,
    `cookieDays` INTEGER NOT NULL DEFAULT 30,
    `termsText` TEXT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ticket` (
    `id` VARCHAR(191) NOT NULL,
    `affiliateId` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `whatsapp` VARCHAR(191) NULL,
    `subject` VARCHAR(191) NOT NULL,
    `category` ENUM('KOMISI', 'PENARIKAN', 'AKUN', 'TEKNIS', 'LAINNYA') NOT NULL DEFAULT 'LAINNYA',
    `status` ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED') NOT NULL DEFAULT 'OPEN',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ticket_affiliateId_idx`(`affiliateId`),
    INDEX `ticket_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ticketmessage` (
    `id` VARCHAR(191) NOT NULL,
    `ticketId` VARCHAR(191) NOT NULL,
    `senderRole` ENUM('USER', 'ADMIN') NOT NULL,
    `senderName` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ticketmessage_ticketId_idx`(`ticketId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `affiliate` ADD CONSTRAINT `affiliate_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `affiliateconversion` ADD CONSTRAINT `affiliateconversion_affiliateId_fkey` FOREIGN KEY (`affiliateId`) REFERENCES `affiliate`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `affiliateconversion` ADD CONSTRAINT `affiliateconversion_paymentId_fkey` FOREIGN KEY (`paymentId`) REFERENCES `payment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `affiliatewithdrawal` ADD CONSTRAINT `affiliatewithdrawal_affiliateId_fkey` FOREIGN KEY (`affiliateId`) REFERENCES `affiliate`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ticket` ADD CONSTRAINT `ticket_affiliateId_fkey` FOREIGN KEY (`affiliateId`) REFERENCES `affiliate`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ticketmessage` ADD CONSTRAINT `ticketmessage_ticketId_fkey` FOREIGN KEY (`ticketId`) REFERENCES `ticket`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
