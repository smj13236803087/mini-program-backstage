-- 订单主表
CREATE TABLE `orders` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
  `totalAmount` DECIMAL(10, 2) NOT NULL,
  `payAmount` DECIMAL(10, 2) NOT NULL,
  `freightAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `remark` VARCHAR(191) NULL,
  `recipient` VARCHAR(191) NOT NULL,
  `phone` VARCHAR(191) NOT NULL,
  `country` VARCHAR(191) NOT NULL DEFAULT '中国',
  `province` VARCHAR(191) NOT NULL,
  `city` VARCHAR(191) NOT NULL,
  `district` VARCHAR(191) NOT NULL,
  `detail` VARCHAR(191) NOT NULL,
  `postalCode` VARCHAR(191) NULL,
  `designSnapshot` JSON NULL,
  `outTradeNo` VARCHAR(191) NULL,
  `payStatus` VARCHAR(191) NOT NULL DEFAULT 'unpaid',
  `payChannel` VARCHAR(191) NULL,
  `paidAt` DATETIME(3) NULL,
  `shippingCompany` VARCHAR(191) NULL,
  `trackingNo` VARCHAR(191) NULL,
  `shippedAt` DATETIME(3) NULL,
  `receivedAt` DATETIME(3) NULL,
  `refundStatus` VARCHAR(191) NULL,
  `refundAmount` DECIMAL(10, 2) NULL,
  `refundReason` VARCHAR(191) NULL,
  `refundedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  UNIQUE INDEX `orders_outTradeNo_key`(`outTradeNo`),
  INDEX `orders_userId_idx`(`userId`),

  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 订单明细表
CREATE TABLE `order_items` (
  `id` VARCHAR(191) NOT NULL,
  `orderId` VARCHAR(191) NOT NULL,
  `productId` VARCHAR(191) NULL,
  `braceletDesignId` VARCHAR(191) NULL,
  `name` VARCHAR(191) NOT NULL,
  `unitPrice` DECIMAL(10, 2) NOT NULL,
  `quantity` INT NOT NULL,
  `subtotal` DECIMAL(10, 2) NOT NULL,
  `snapshot` JSON NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  INDEX `order_items_orderId_idx`(`orderId`),

  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

