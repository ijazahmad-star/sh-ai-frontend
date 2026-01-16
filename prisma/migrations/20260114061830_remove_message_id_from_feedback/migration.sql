/*
  Warnings:

  - You are about to drop the column `message_id` on the `feedbacks` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "feedbacks" DROP CONSTRAINT "feedbacks_message_id_fkey";

-- AlterTable
ALTER TABLE "feedbacks" DROP COLUMN "message_id";
