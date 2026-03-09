-- 为商品表增加真实库存与能量标签
ALTER TABLE `Product`
  ADD COLUMN `stock` INT NOT NULL DEFAULT 0,
  ADD COLUMN `energy_tags` JSON NULL;

