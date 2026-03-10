-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "tokenReset" TEXT,
ADD COLUMN     "tokenResetExpira" TIMESTAMP(3);
