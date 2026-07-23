/*
  Warnings:

  - You are about to drop the `Category` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Certificate` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Completion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Lesson` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LmsGroup` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LmsModule` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OtpCode` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Payment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Program` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Question` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Registration` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TestAttempt` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `Certificate` DROP FOREIGN KEY `Certificate_registrationId_fkey`;

-- DropForeignKey
ALTER TABLE `Completion` DROP FOREIGN KEY `Completion_lessonId_fkey`;

-- DropForeignKey
ALTER TABLE `Completion` DROP FOREIGN KEY `Completion_registrationId_fkey`;

-- DropForeignKey
ALTER TABLE `Lesson` DROP FOREIGN KEY `Lesson_moduleId_fkey`;

-- DropForeignKey
ALTER TABLE `LmsGroup` DROP FOREIGN KEY `LmsGroup_programId_fkey`;

-- DropForeignKey
ALTER TABLE `LmsModule` DROP FOREIGN KEY `LmsModule_groupId_fkey`;

-- DropForeignKey
ALTER TABLE `LmsModule` DROP FOREIGN KEY `LmsModule_programId_fkey`;

-- DropForeignKey
ALTER TABLE `Payment` DROP FOREIGN KEY `Payment_registrationId_fkey`;

-- DropForeignKey
ALTER TABLE `Program` DROP FOREIGN KEY `Program_categoryId_fkey`;

-- DropForeignKey
ALTER TABLE `Question` DROP FOREIGN KEY `Question_lessonId_fkey`;

-- DropForeignKey
ALTER TABLE `Question` DROP FOREIGN KEY `Question_programId_fkey`;

-- DropForeignKey
ALTER TABLE `Registration` DROP FOREIGN KEY `Registration_programId_fkey`;

-- DropForeignKey
ALTER TABLE `Registration` DROP FOREIGN KEY `Registration_userId_fkey`;

-- DropForeignKey
ALTER TABLE `TestAttempt` DROP FOREIGN KEY `TestAttempt_registrationId_fkey`;

-- DropTable
DROP TABLE `Category`;

-- DropTable
DROP TABLE `Certificate`;

-- DropTable
DROP TABLE `Completion`;

-- DropTable
DROP TABLE `Lesson`;

-- DropTable
DROP TABLE `LmsGroup`;

-- DropTable
DROP TABLE `LmsModule`;

-- DropTable
DROP TABLE `OtpCode`;

-- DropTable
DROP TABLE `Payment`;

-- DropTable
DROP TABLE `Program`;

-- DropTable
DROP TABLE `Question`;

-- DropTable
DROP TABLE `Registration`;

-- DropTable
DROP TABLE `TestAttempt`;

-- DropTable
DROP TABLE `User`;

-- CreateTable
CREATE TABLE `program` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `type` ENUM('WEBINAR', 'KELAS', 'WORKSHOP', 'BOOTCAMP') NOT NULL DEFAULT 'WEBINAR',
    `title` VARCHAR(191) NOT NULL,
    `tagline` TEXT NOT NULL,
    `description` TEXT NOT NULL,
    `emoji` VARCHAR(191) NOT NULL DEFAULT '🎓',
    `imageUrl` VARCHAR(191) NULL,
    `mentorName` VARCHAR(191) NOT NULL,
    `mentorBio` TEXT NOT NULL,
    `materi` JSON NOT NULL,
    `deliverables` JSON NOT NULL,
    `guarantee` TEXT NULL,
    `contentBlocks` JSON NULL,
    `scheduleAt` DATETIME(3) NOT NULL,
    `durationLabel` VARCHAR(191) NOT NULL DEFAULT '2 jam',
    `zoomLink` VARCHAR(191) NULL,
    `waGroupLink` VARCHAR(191) NULL,
    `lmsLink` VARCHAR(191) NULL,
    `price` INTEGER NOT NULL DEFAULT 0,
    `priceOld` INTEGER NULL,
    `certPrice` INTEGER NOT NULL DEFAULT 49000,
    `certPriceOld` INTEGER NULL,
    `seatsLeft` INTEGER NULL,
    `passingScore` INTEGER NOT NULL DEFAULT 60,
    `completionCriteria` ENUM('ALL_LESSONS', 'ALL_QUIZZES') NOT NULL DEFAULT 'ALL_LESSONS',
    `certKind` ENUM('PARTICIPATION', 'COMPLETION', 'ACHIEVEMENT') NOT NULL DEFAULT 'ACHIEVEMENT',
    `maxTestAttempts` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `certClaimOpen` BOOLEAN NOT NULL DEFAULT false,
    `isFeatured` BOOLEAN NOT NULL DEFAULT false,
    `certBgUrl` TEXT NULL,
    `certConfig` JSON NULL,
    `categoryId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `program_slug_key`(`slug`),
    INDEX `program_categoryId_idx`(`categoryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `programbatch` (
    `id` VARCHAR(191) NOT NULL,
    `programId` VARCHAR(191) NOT NULL,
    `scheduleAt` DATETIME(3) NOT NULL,
    `seatsLeft` INTEGER NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `programbatch_programId_idx`(`programId`),
    INDEX `programbatch_programId_scheduleAt_idx`(`programId`, `scheduleAt`),
    INDEX `programbatch_scheduleAt_idx`(`scheduleAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `registration` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `whatsapp` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `institution` VARCHAR(191) NULL,
    `programId` VARCHAR(191) NOT NULL,
    `batchId` VARCHAR(191) NULL,
    `status` ENUM('REGISTERED', 'PAID', 'PASSED', 'EXPIRED', 'FAILED', 'CANCELLED') NOT NULL DEFAULT 'REGISTERED',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `registration_email_idx`(`email`),
    INDEX `registration_email_programId_idx`(`email`, `programId`),
    INDEX `registration_whatsapp_idx`(`whatsapp`),
    INDEX `registration_programId_idx`(`programId`),
    INDEX `registration_batchId_idx`(`batchId`),
    INDEX `registration_status_idx`(`status`),
    INDEX `registration_status_programId_idx`(`status`, `programId`),
    INDEX `registration_createdAt_idx`(`createdAt`),
    INDEX `registration_userId_idx`(`userId`),
    UNIQUE INDEX `registration_whatsapp_programId_key`(`whatsapp`, `programId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment` (
    `id` VARCHAR(191) NOT NULL,
    `registrationId` VARCHAR(191) NOT NULL,
    `xenditInvoiceId` VARCHAR(191) NULL,
    `invoiceUrl` TEXT NULL,
    `amount` INTEGER NOT NULL,
    `status` ENUM('PENDING', 'PAID', 'EXPIRED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `paidAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `payment_registrationId_key`(`registrationId`),
    UNIQUE INDEX `payment_xenditInvoiceId_key`(`xenditInvoiceId`),
    INDEX `payment_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `question` (
    `id` VARCHAR(191) NOT NULL,
    `programId` VARCHAR(191) NOT NULL,
    `lessonId` VARCHAR(191) NULL,
    `text` TEXT NOT NULL,
    `optionA` VARCHAR(191) NOT NULL,
    `optionB` VARCHAR(191) NOT NULL,
    `optionC` VARCHAR(191) NOT NULL,
    `optionD` VARCHAR(191) NOT NULL,
    `correct` ENUM('A', 'B', 'C', 'D') NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,

    INDEX `question_programId_idx`(`programId`),
    INDEX `question_lessonId_idx`(`lessonId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `testattempt` (
    `id` VARCHAR(191) NOT NULL,
    `registrationId` VARCHAR(191) NOT NULL,
    `lessonId` VARCHAR(191) NULL,
    `score` INTEGER NOT NULL,
    `passed` BOOLEAN NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `testattempt_registrationId_idx`(`registrationId`),
    INDEX `testattempt_registrationId_lessonId_idx`(`registrationId`, `lessonId`),
    INDEX `testattempt_lessonId_idx`(`lessonId`),
    INDEX `testattempt_passed_registrationId_idx`(`passed`, `registrationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `certificate` (
    `id` VARCHAR(191) NOT NULL,
    `number` VARCHAR(191) NOT NULL,
    `registrationId` VARCHAR(191) NOT NULL,
    `issuedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `certificate_number_key`(`number`),
    UNIQUE INDEX `certificate_registrationId_key`(`registrationId`),
    INDEX `certificate_issuedAt_idx`(`issuedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lmsgroup` (
    `id` VARCHAR(191) NOT NULL,
    `programId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,

    INDEX `lmsgroup_programId_idx`(`programId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lmsmodule` (
    `id` VARCHAR(191) NOT NULL,
    `programId` VARCHAR(191) NOT NULL,
    `groupId` VARCHAR(191) NULL,
    `title` VARCHAR(191) NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,

    INDEX `lmsmodule_programId_idx`(`programId`),
    INDEX `lmsmodule_groupId_idx`(`groupId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lesson` (
    `id` VARCHAR(191) NOT NULL,
    `moduleId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `type` ENUM('VIDEO', 'TEXT', 'PDF', 'QUIZ') NOT NULL DEFAULT 'VIDEO',
    `videoUrl` VARCHAR(191) NULL,
    `fileUrl` TEXT NULL,
    `content` TEXT NULL,
    `duration` VARCHAR(191) NOT NULL DEFAULT '10 menit',
    `passingScore` INTEGER NULL,
    `isPreview` BOOLEAN NOT NULL DEFAULT false,
    `order` INTEGER NOT NULL DEFAULT 0,

    INDEX `lesson_moduleId_idx`(`moduleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `completion` (
    `id` VARCHAR(191) NOT NULL,
    `registrationId` VARCHAR(191) NOT NULL,
    `lessonId` VARCHAR(191) NOT NULL,
    `completedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `completion_registrationId_idx`(`registrationId`),
    INDEX `completion_lessonId_idx`(`lessonId`),
    INDEX `completion_lessonId_registrationId_idx`(`lessonId`, `registrationId`),
    UNIQUE INDEX `completion_registrationId_lessonId_key`(`registrationId`, `lessonId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `otpcode` (
    `id` VARCHAR(191) NOT NULL,
    `identifier` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `used` BOOLEAN NOT NULL DEFAULT false,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `otpcode_identifier_idx`(`identifier`),
    INDEX `otpcode_identifier_code_idx`(`identifier`, `code`),
    INDEX `otpcode_expiresAt_idx`(`expiresAt`),
    INDEX `otpcode_used_expiresAt_idx`(`used`, `expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `category` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `isFeatured` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `category_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `whatsapp` VARCHAR(191) NULL,
    `institution` VARCHAR(191) NULL,
    `passwordHash` VARCHAR(191) NULL,
    `role` ENUM('ADMIN', 'TEACHER', 'STUDENT') NOT NULL DEFAULT 'STUDENT',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `user_email_key`(`email`),
    UNIQUE INDEX `user_whatsapp_key`(`whatsapp`),
    INDEX `user_role_idx`(`role`),
    INDEX `user_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `apikey` (
    `id` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL DEFAULT 'Hermes Agent Marketing',
    `key` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `lastUsedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `apikey_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `article` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `excerpt` TEXT NOT NULL,
    `content` TEXT NOT NULL,
    `coverImageUrl` TEXT NULL,
    `authorName` VARCHAR(191) NOT NULL DEFAULT 'Tim Jetschool Academy',
    `isPublished` BOOLEAN NOT NULL DEFAULT false,
    `publishedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `article_slug_key`(`slug`),
    INDEX `article_isPublished_publishedAt_idx`(`isPublished`, `publishedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `program` ADD CONSTRAINT `program_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `category`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `programbatch` ADD CONSTRAINT `programbatch_programId_fkey` FOREIGN KEY (`programId`) REFERENCES `program`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `registration` ADD CONSTRAINT `registration_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `registration` ADD CONSTRAINT `registration_programId_fkey` FOREIGN KEY (`programId`) REFERENCES `program`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `registration` ADD CONSTRAINT `registration_batchId_fkey` FOREIGN KEY (`batchId`) REFERENCES `programbatch`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment` ADD CONSTRAINT `payment_registrationId_fkey` FOREIGN KEY (`registrationId`) REFERENCES `registration`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `question` ADD CONSTRAINT `question_programId_fkey` FOREIGN KEY (`programId`) REFERENCES `program`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `question` ADD CONSTRAINT `question_lessonId_fkey` FOREIGN KEY (`lessonId`) REFERENCES `lesson`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `testattempt` ADD CONSTRAINT `testattempt_registrationId_fkey` FOREIGN KEY (`registrationId`) REFERENCES `registration`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `certificate` ADD CONSTRAINT `certificate_registrationId_fkey` FOREIGN KEY (`registrationId`) REFERENCES `registration`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lmsgroup` ADD CONSTRAINT `lmsgroup_programId_fkey` FOREIGN KEY (`programId`) REFERENCES `program`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lmsmodule` ADD CONSTRAINT `lmsmodule_programId_fkey` FOREIGN KEY (`programId`) REFERENCES `program`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lmsmodule` ADD CONSTRAINT `lmsmodule_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `lmsgroup`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lesson` ADD CONSTRAINT `lesson_moduleId_fkey` FOREIGN KEY (`moduleId`) REFERENCES `lmsmodule`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `completion` ADD CONSTRAINT `completion_registrationId_fkey` FOREIGN KEY (`registrationId`) REFERENCES `registration`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `completion` ADD CONSTRAINT `completion_lessonId_fkey` FOREIGN KEY (`lessonId`) REFERENCES `lesson`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
