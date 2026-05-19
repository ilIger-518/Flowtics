-- CreateTable
CREATE TABLE "Receipt" (
    "id" SERIAL NOT NULL,
    "merchant" TEXT,
    "total" DOUBLE PRECISION,
    "category" TEXT,
    "receiptDate" TIMESTAMP(3),
    "imagePath" TEXT NOT NULL,
    "rawText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Receipt_pkey" PRIMARY KEY ("id")
);
