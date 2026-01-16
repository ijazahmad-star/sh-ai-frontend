/*
  Warnings:

  - Added the required column `conv_msg_id` to the `feedbacks` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "feedbacks" ADD COLUMN     "conv_msg_id" TEXT NOT NULL,
ALTER COLUMN "user_query" DROP NOT NULL;
