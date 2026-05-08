-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(80) NULL,
    `first_name` VARCHAR(100) NOT NULL,
    `last_name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(255) NULL,
    `password` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `avatar` VARCHAR(500) NULL,
    `role` ENUM('admin', 'manager', 'staff', 'designer', 'sewer', 'store_keeper', 'material_controller', 'sales') NOT NULL DEFAULT 'staff',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `last_login_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_username_key`(`username`),
    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `users_username_idx`(`username`),
    INDEX `users_email_idx`(`email`),
    INDEX `users_role_idx`(`role`),
    INDEX `users_is_active_idx`(`is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(200) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `category_type` ENUM('product_type', 'category', 'subcategory') NOT NULL DEFAULT 'subcategory',
    `parent_id` INTEGER NULL,
    `level` INTEGER NOT NULL DEFAULT 0,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `image_url` VARCHAR(500) NULL,
    `icon` VARCHAR(50) NULL,
    `metadata` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `created_by` INTEGER NULL,

    UNIQUE INDEX `categories_slug_key`(`slug`),
    INDEX `categories_parent_id_idx`(`parent_id`),
    INDEX `categories_slug_idx`(`slug`),
    INDEX `categories_level_idx`(`level`),
    INDEX `categories_is_active_idx`(`is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_types` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `display_name` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `icon` VARCHAR(50) NULL,
    `has_variants` BOOLEAN NOT NULL DEFAULT false,
    `has_size` BOOLEAN NOT NULL DEFAULT false,
    `has_color` BOOLEAN NOT NULL DEFAULT false,
    `size_options` JSON NULL,
    `color_options` JSON NULL,
    `requires_measurements` BOOLEAN NOT NULL DEFAULT false,
    `measurement_fields` JSON NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `product_types_name_key`(`name`),
    INDEX `product_types_is_active_idx`(`is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `products` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(200) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `description_short` VARCHAR(500) NULL,
    `description_detailed` TEXT NULL,
    `specifications` TEXT NULL,
    `name_am` VARCHAR(200) NULL,
    `description_short_am` VARCHAR(500) NULL,
    `description_detailed_am` TEXT NULL,
    `default_shipping_fee` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `default_service_fee` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `fabric_composition` VARCHAR(400) NULL,
    `fabric_composition_am` VARCHAR(400) NULL,
    `care_instructions` TEXT NULL,
    `care_instructions_am` TEXT NULL,
    `design_notes` TEXT NULL,
    `design_notes_am` TEXT NULL,
    `measurement_guide_summary` VARCHAR(500) NULL,
    `measurement_guide_summary_am` VARCHAR(500) NULL,
    `estimated_labor_cost` DECIMAL(10, 2) NULL,
    `estimated_material_cost` DECIMAL(10, 2) NULL,
    `product_type_id` INTEGER NULL,
    `category_id` INTEGER NULL,
    `sku` VARCHAR(100) NOT NULL,
    `barcode` VARCHAR(100) NULL,
    `base_price` DECIMAL(10, 2) NOT NULL,
    `compare_at_price` DECIMAL(10, 2) NULL,
    `cost_price` DECIMAL(10, 2) NULL,
    `tax_class` VARCHAR(50) NULL,
    `status` ENUM('draft', 'active', 'archived', 'out_of_stock') NOT NULL DEFAULT 'draft',
    `is_featured` BOOLEAN NOT NULL DEFAULT false,
    `is_digital` BOOLEAN NOT NULL DEFAULT false,
    `requires_shipping` BOOLEAN NOT NULL DEFAULT true,
    `weight` DECIMAL(8, 2) NULL,
    `weight_unit` VARCHAR(20) NULL,
    `length` DECIMAL(8, 2) NULL,
    `width` DECIMAL(8, 2) NULL,
    `height` DECIMAL(8, 2) NULL,
    `dimension_unit` VARCHAR(20) NULL,
    `meta_title` VARCHAR(255) NULL,
    `meta_description` TEXT NULL,
    `meta_keywords` TEXT NULL,
    `published_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `created_by` INTEGER NULL,

    UNIQUE INDEX `products_slug_key`(`slug`),
    UNIQUE INDEX `products_sku_key`(`sku`),
    INDEX `products_sku_idx`(`sku`),
    INDEX `products_slug_idx`(`slug`),
    INDEX `products_category_id_idx`(`category_id`),
    INDEX `products_product_type_id_idx`(`product_type_id`),
    INDEX `products_status_idx`(`status`),
    INDEX `products_base_price_idx`(`base_price`),
    INDEX `products_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_images` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `product_id` INTEGER NOT NULL,
    `url` VARCHAR(500) NOT NULL,
    `alt` VARCHAR(255) NULL,
    `is_primary` BOOLEAN NOT NULL DEFAULT false,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `metadata_width` INTEGER NULL,
    `metadata_height` INTEGER NULL,
    `file_size` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `product_images_product_id_idx`(`product_id`),
    INDEX `product_images_is_primary_idx`(`is_primary`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_variants` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `product_id` INTEGER NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `variant_type` ENUM('dropdown', 'radio', 'color', 'image') NOT NULL DEFAULT 'dropdown',
    `options` JSON NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `product_variants_product_id_idx`(`product_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_variant_combinations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `product_id` INTEGER NOT NULL,
    `variant_sku` VARCHAR(100) NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `stock_quantity` INTEGER NOT NULL DEFAULT 0,
    `image` VARCHAR(500) NULL,
    `attributes` JSON NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `product_variant_combinations_product_id_idx`(`product_id`),
    INDEX `product_variant_combinations_variant_sku_idx`(`variant_sku`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_attributes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `product_id` INTEGER NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `value` TEXT NOT NULL,
    `attribute_type` ENUM('text', 'number', 'boolean', 'date', 'select') NOT NULL DEFAULT 'text',
    `is_filterable` BOOLEAN NOT NULL DEFAULT false,
    `is_searchable` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `product_attributes_product_id_idx`(`product_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inventory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `product_id` INTEGER NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 0,
    `low_stock_threshold` INTEGER NOT NULL DEFAULT 10,
    `last_counted_at` DATETIME(3) NULL,
    `last_counted_by` INTEGER NULL,
    `updated_at` DATETIME(3) NOT NULL,
    `updated_by` INTEGER NULL,

    INDEX `inventory_product_id_idx`(`product_id`),
    INDEX `inventory_quantity_idx`(`quantity`),
    INDEX `inventory_low_stock_threshold_idx`(`low_stock_threshold`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `customers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `first_name` VARCHAR(100) NOT NULL,
    `last_name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(255) NULL,
    `phone` VARCHAR(20) NULL,
    `date_of_birth` DATE NULL,
    `gender` VARCHAR(20) NULL,
    `avatar` VARCHAR(500) NULL,
    `address` VARCHAR(500) NULL,
    `house_number` VARCHAR(50) NULL,
    `city` VARCHAR(100) NULL,
    `photos` JSON NULL,
    `body_measurements` JSON NULL,
    `status` VARCHAR(50) NOT NULL DEFAULT 'active',
    `total_orders` INTEGER NOT NULL DEFAULT 0,
    `total_spent` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `avg_order_value` DECIMAL(10, 2) NULL,
    `last_order_date` DATE NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `customers_email_key`(`email`),
    INDEX `customers_email_idx`(`email`),
    INDEX `customers_phone_idx`(`phone`),
    INDEX `customers_status_idx`(`status`),
    INDEX `customers_total_orders_idx`(`total_orders`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orders` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_number` VARCHAR(50) NOT NULL,
    `reference_number` VARCHAR(50) NULL,
    `customer_id` INTEGER NOT NULL,
    `status` ENUM('pending', 'assigned', 'design_in_progress', 'design_completed', 'sewing_in_progress', 'sewing_completed', 'quality_check', 'quality_passed', 'ready_for_delivery', 'delivery_in_progress', 'delivered', 'cancelled', 'on_hold') NOT NULL DEFAULT 'pending',
    `subtotal` DECIMAL(10, 2) NOT NULL,
    `tax` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `shipping` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `discount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `total` DECIMAL(10, 2) NOT NULL,
    `currency` VARCHAR(3) NOT NULL DEFAULT 'ETB',
    `is_high_priority` BOOLEAN NOT NULL DEFAULT false,
    `current_stage` ENUM('crm_data', 'sales_staff', 'designer', 'sewer_production_team', 'store_manager', 'production', 'quality_control', 'delivery_team') NOT NULL DEFAULT 'crm_data',
    `notes` TEXT NULL,
    `internal_notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `orders_order_number_key`(`order_number`),
    INDEX `orders_order_number_idx`(`order_number`),
    INDEX `orders_customer_id_idx`(`customer_id`),
    INDEX `orders_status_idx`(`status`),
    INDEX `orders_is_high_priority_idx`(`is_high_priority`),
    INDEX `orders_current_stage_idx`(`current_stage`),
    INDEX `orders_created_at_idx`(`created_at`),
    INDEX `orders_total_idx`(`total`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_id` INTEGER NOT NULL,
    `product_id` INTEGER NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `sku` VARCHAR(100) NULL,
    `quantity` INTEGER NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `discount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `tax` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `total` DECIMAL(10, 2) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `order_items_order_id_idx`(`order_id`),
    INDEX `order_items_product_id_idx`(`product_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `workflow_stage_events` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_id` INTEGER NOT NULL,
    `from_stage` ENUM('crm_data', 'sales_staff', 'designer', 'sewer_production_team', 'store_manager', 'production', 'quality_control', 'delivery_team') NULL,
    `to_stage` ENUM('crm_data', 'sales_staff', 'designer', 'sewer_production_team', 'store_manager', 'production', 'quality_control', 'delivery_team') NOT NULL,
    `actor_user_id` INTEGER NULL,
    `actor_role` ENUM('admin', 'manager', 'staff', 'designer', 'sewer', 'store_keeper', 'material_controller', 'sales') NULL,
    `comment` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `workflow_stage_events_order_id_idx`(`order_id`),
    INDEX `workflow_stage_events_to_stage_idx`(`to_stage`),
    INDEX `workflow_stage_events_actor_user_id_idx`(`actor_user_id`),
    INDEX `workflow_stage_events_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_verifications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_id` INTEGER NOT NULL,
    `type` ENUM('multi_factor', 'up_regulatory', 'otp_traceability') NOT NULL,
    `method` ENUM('otp', 'keyless', 'up_verification') NOT NULL,
    `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    `from_stage` ENUM('crm_data', 'sales_staff', 'designer', 'sewer_production_team', 'store_manager', 'production', 'quality_control', 'delivery_team') NULL,
    `to_stage` ENUM('crm_data', 'sales_staff', 'designer', 'sewer_production_team', 'store_manager', 'production', 'quality_control', 'delivery_team') NULL,
    `verification_code` VARCHAR(120) NULL,
    `reference_number` VARCHAR(120) NULL,
    `notes` TEXT NULL,
    `verified_by_user_id` INTEGER NULL,
    `verified_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `order_verifications_order_id_idx`(`order_id`),
    INDEX `order_verifications_status_idx`(`status`),
    INDEX `order_verifications_type_idx`(`type`),
    INDEX `order_verifications_verified_by_user_id_idx`(`verified_by_user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `quality_control_records` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_id` INTEGER NOT NULL,
    `checked_by_user_id` INTEGER NULL,
    `defect_rate` DECIMAL(5, 2) NOT NULL DEFAULT 0.2,
    `pass_count` INTEGER NOT NULL DEFAULT 0,
    `fail_count` INTEGER NOT NULL DEFAULT 0,
    `is_approved` BOOLEAN NOT NULL DEFAULT false,
    `notes` TEXT NULL,
    `checked_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `quality_control_records_order_id_idx`(`order_id`),
    INDEX `quality_control_records_is_approved_idx`(`is_approved`),
    INDEX `quality_control_records_checked_by_user_id_idx`(`checked_by_user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `production_oee_snapshots` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_id` INTEGER NULL,
    `recorded_by_user_id` INTEGER NULL,
    `availability` DECIMAL(5, 2) NOT NULL,
    `performance` DECIMAL(5, 2) NOT NULL,
    `quality` DECIMAL(5, 2) NOT NULL,
    `oee_score` DECIMAL(5, 2) NOT NULL,
    `recorded_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `production_oee_snapshots_order_id_idx`(`order_id`),
    INDEX `production_oee_snapshots_recorded_by_user_id_idx`(`recorded_by_user_id`),
    INDEX `production_oee_snapshots_recorded_at_idx`(`recorded_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `supply_chain_telemetry` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_id` INTEGER NULL,
    `inventory_id` INTEGER NULL,
    `source_device` VARCHAR(120) NULL,
    `event_type` VARCHAR(120) NOT NULL,
    `payload` JSON NULL,
    `recorded_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `supply_chain_telemetry_order_id_idx`(`order_id`),
    INDEX `supply_chain_telemetry_inventory_id_idx`(`inventory_id`),
    INDEX `supply_chain_telemetry_recorded_at_idx`(`recorded_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `integration_events` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_id` INTEGER NULL,
    `integration_type` ENUM('digital_asset_management', 'supply_chain_iot', 'order_flow', 'quality_control', 'production_oee') NOT NULL,
    `stage` ENUM('crm_data', 'sales_staff', 'designer', 'sewer_production_team', 'store_manager', 'production', 'quality_control', 'delivery_team') NULL,
    `source_system` VARCHAR(120) NOT NULL,
    `event_name` VARCHAR(150) NOT NULL,
    `event_data` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `integration_events_order_id_idx`(`order_id`),
    INDEX `integration_events_integration_type_idx`(`integration_type`),
    INDEX `integration_events_stage_idx`(`stage`),
    INDEX `integration_events_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wallets` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `balance` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `total_earned` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `total_paid` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `currency` VARCHAR(3) NOT NULL DEFAULT 'ETB',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `wallets_user_id_key`(`user_id`),
    INDEX `wallets_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wallet_transactions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `wallet_id` INTEGER NOT NULL,
    `type` ENUM('credit', 'debit', 'adjustment') NOT NULL,
    `reason` ENUM('salary', 'overtime_bonus', 'performance_bonus', 'deduction', 'manual_adjustment') NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `balance_after` DECIMAL(15, 2) NOT NULL,
    `note` TEXT NULL,
    `reference_id` INTEGER NULL,
    `created_by_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `wallet_transactions_wallet_id_idx`(`wallet_id`),
    INDEX `wallet_transactions_type_idx`(`type`),
    INDEX `wallet_transactions_reason_idx`(`reason`),
    INDEX `wallet_transactions_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `point_ledger` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `type` ENUM('earn', 'redeem', 'expire', 'adjustment') NOT NULL,
    `reason` ENUM('order_completed', 'overtime_worked', 'quality_bonus', 'sales_target_hit', 'social_post_evidence', 'manual_award') NULL,
    `points` INTEGER NOT NULL,
    `balance_after` INTEGER NOT NULL,
    `note` TEXT NULL,
    `reference_id` INTEGER NULL,
    `awarded_by_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `point_ledger_user_id_idx`(`user_id`),
    INDEX `point_ledger_type_idx`(`type`),
    INDEX `point_ledger_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `overtime_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `date` DATE NOT NULL,
    `hours_worked` DECIMAL(5, 2) NOT NULL,
    `regular_hours` DECIMAL(5, 2) NOT NULL DEFAULT 8,
    `overtime_hours` DECIMAL(5, 2) NOT NULL,
    `hourly_rate` DECIMAL(10, 2) NOT NULL,
    `overtime_pay` DECIMAL(10, 2) NOT NULL,
    `status` ENUM('pending', 'approved', 'rejected', 'paid') NOT NULL DEFAULT 'pending',
    `approved_by_id` INTEGER NULL,
    `approved_at` DATETIME(3) NULL,
    `note` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `overtime_logs_user_id_idx`(`user_id`),
    INDEX `overtime_logs_date_idx`(`date`),
    INDEX `overtime_logs_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sales_activity_reports` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `report_date` DATE NOT NULL,
    `activity_type` ENUM('tiktok_post', 'instagram_post', 'facebook_post', 'customer_visit', 'phone_call', 'whatsapp_message', 'other') NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `evidence_url` VARCHAR(1000) NULL,
    `platform` VARCHAR(100) NULL,
    `reach` INTEGER NULL,
    `leads` INTEGER NULL DEFAULT 0,
    `conversions` INTEGER NULL DEFAULT 0,
    `status` ENUM('submitted', 'reviewed', 'approved', 'rejected') NOT NULL DEFAULT 'submitted',
    `reviewed_by_id` INTEGER NULL,
    `reviewed_at` DATETIME(3) NULL,
    `review_note` TEXT NULL,
    `points_awarded` INTEGER NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `sales_activity_reports_user_id_idx`(`user_id`),
    INDEX `sales_activity_reports_report_date_idx`(`report_date`),
    INDEX `sales_activity_reports_status_idx`(`status`),
    INDEX `sales_activity_reports_activity_type_idx`(`activity_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_assignments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_id` INTEGER NOT NULL,
    `sewer_id` INTEGER NOT NULL,
    `assigned_by_id` INTEGER NULL,
    `method` ENUM('manual', 'automatic') NOT NULL DEFAULT 'manual',
    `status` ENUM('pending', 'accepted', 'rejected', 'in_progress', 'completed') NOT NULL DEFAULT 'pending',
    `response_at` DATETIME(3) NULL,
    `reject_reason` TEXT NULL,
    `measurements` JSON NULL,
    `fabric_meters_required` DECIMAL(8, 2) NULL,
    `sewer_notes` TEXT NULL,
    `started_at` DATETIME(3) NULL,
    `completed_at` DATETIME(3) NULL,
    `estimated_done_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `order_assignments_order_id_key`(`order_id`),
    INDEX `order_assignments_order_id_idx`(`order_id`),
    INDEX `order_assignments_sewer_id_idx`(`sewer_id`),
    INDEX `order_assignments_status_idx`(`status`),
    INDEX `order_assignments_method_idx`(`method`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `raw_materials` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(200) NOT NULL,
    `cloth_type` ENUM('habesha_cotton', 'chiffon', 'silk', 'satin', 'linen', 'polyester', 'velvet', 'organza', 'other') NOT NULL DEFAULT 'other',
    `color_or_pattern` VARCHAR(200) NULL,
    `supplier` VARCHAR(200) NULL,
    `unit_of_measure` VARCHAR(20) NOT NULL DEFAULT 'meters',
    `quantity_in_stock` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `low_stock_alert` DECIMAL(10, 2) NOT NULL DEFAULT 5,
    `cost_per_meter` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `currency` VARCHAR(3) NOT NULL DEFAULT 'ETB',
    `width_cm` DECIMAL(6, 2) NULL,
    `notes` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `raw_materials_cloth_type_idx`(`cloth_type`),
    INDEX `raw_materials_is_active_idx`(`is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fabric_cuts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_id` INTEGER NOT NULL,
    `raw_material_id` INTEGER NOT NULL,
    `cloth_type` ENUM('habesha_cotton', 'chiffon', 'silk', 'satin', 'linen', 'polyester', 'velvet', 'organza', 'other') NOT NULL,
    `garment_type` VARCHAR(100) NOT NULL,
    `meters_required` DECIMAL(8, 2) NOT NULL,
    `meters_actual_cut` DECIMAL(8, 2) NULL,
    `waste_percent` DECIMAL(5, 2) NOT NULL DEFAULT 10,
    `cut_by_id` INTEGER NULL,
    `cut_at` DATETIME(3) NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `fabric_cuts_order_id_idx`(`order_id`),
    INDEX `fabric_cuts_raw_material_id_idx`(`raw_material_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stock_movements` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `raw_material_id` INTEGER NOT NULL,
    `type` ENUM('purchase', 'fabric_cut', 'return', 'adjustment', 'waste') NOT NULL,
    `direction` ENUM('in', 'out') NOT NULL,
    `quantity_change` DECIMAL(10, 2) NOT NULL,
    `quantity_before` DECIMAL(10, 2) NOT NULL,
    `quantity_after` DECIMAL(10, 2) NOT NULL,
    `unit_cost` DECIMAL(10, 2) NULL,
    `total_cost` DECIMAL(15, 2) NULL,
    `currency` VARCHAR(3) NOT NULL DEFAULT 'ETB',
    `reference_order_id` INTEGER NULL,
    `supplier` VARCHAR(200) NULL,
    `invoice_number` VARCHAR(100) NULL,
    `note` TEXT NULL,
    `created_by_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `stock_movements_raw_material_id_idx`(`raw_material_id`),
    INDEX `stock_movements_type_idx`(`type`),
    INDEX `stock_movements_direction_idx`(`direction`),
    INDEX `stock_movements_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payroll` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `period_type` ENUM('monthly', 'biweekly', 'weekly') NOT NULL DEFAULT 'monthly',
    `period_start` DATETIME(3) NOT NULL,
    `period_end` DATETIME(3) NOT NULL,
    `base_salary` DECIMAL(12, 2) NOT NULL,
    `overtime_pay` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `bonus` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `commission` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `allowances` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `tax_deduction` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `pension_deduction` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `other_deductions` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `deduction_notes` TEXT NULL,
    `gross_pay` DECIMAL(12, 2) NOT NULL,
    `total_deductions` DECIMAL(12, 2) NOT NULL,
    `net_pay` DECIMAL(12, 2) NOT NULL,
    `currency` VARCHAR(3) NOT NULL DEFAULT 'ETB',
    `status` ENUM('draft', 'pending_approval', 'approved', 'paid', 'rejected') NOT NULL DEFAULT 'draft',
    `processed_by_id` INTEGER NULL,
    `processed_at` DATETIME(3) NULL,
    `paid_at` DATETIME(3) NULL,
    `payment_method` VARCHAR(50) NULL,
    `payment_ref` VARCHAR(200) NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `payroll_user_id_idx`(`user_id`),
    INDEX `payroll_status_idx`(`status`),
    INDEX `payroll_period_start_idx`(`period_start`),
    INDEX `payroll_period_end_idx`(`period_end`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `finance_transactions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` ENUM('income', 'expense') NOT NULL,
    `category` ENUM('product_sale', 'service_fee', 'custom_order', 'delivery_fee', 'other_income', 'salary_payment', 'material_purchase', 'rent', 'utilities', 'equipment', 'transport', 'marketing', 'maintenance', 'tax_payment', 'other_expense') NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `currency` VARCHAR(3) NOT NULL DEFAULT 'ETB',
    `title` VARCHAR(300) NOT NULL,
    `description` TEXT NULL,
    `reference_id` VARCHAR(100) NULL,
    `reference_type` VARCHAR(50) NULL,
    `payment_method` VARCHAR(50) NULL,
    `payment_ref` VARCHAR(200) NULL,
    `transaction_date` DATETIME(3) NOT NULL,
    `attachments` JSON NULL,
    `created_by_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `finance_transactions_type_idx`(`type`),
    INDEX `finance_transactions_category_idx`(`category`),
    INDEX `finance_transactions_transaction_date_idx`(`transaction_date`),
    INDEX `finance_transactions_created_by_id_idx`(`created_by_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `categories` ADD CONSTRAINT `categories_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `categories` ADD CONSTRAINT `categories_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_product_type_id_fkey` FOREIGN KEY (`product_type_id`) REFERENCES `product_types`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_images` ADD CONSTRAINT `product_images_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_variants` ADD CONSTRAINT `product_variants_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_variant_combinations` ADD CONSTRAINT `product_variant_combinations_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_attributes` ADD CONSTRAINT `product_attributes_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory` ADD CONSTRAINT `inventory_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory` ADD CONSTRAINT `inventory_last_counted_by_fkey` FOREIGN KEY (`last_counted_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory` ADD CONSTRAINT `inventory_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workflow_stage_events` ADD CONSTRAINT `workflow_stage_events_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workflow_stage_events` ADD CONSTRAINT `workflow_stage_events_actor_user_id_fkey` FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_verifications` ADD CONSTRAINT `order_verifications_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_verifications` ADD CONSTRAINT `order_verifications_verified_by_user_id_fkey` FOREIGN KEY (`verified_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quality_control_records` ADD CONSTRAINT `quality_control_records_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quality_control_records` ADD CONSTRAINT `quality_control_records_checked_by_user_id_fkey` FOREIGN KEY (`checked_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `production_oee_snapshots` ADD CONSTRAINT `production_oee_snapshots_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `production_oee_snapshots` ADD CONSTRAINT `production_oee_snapshots_recorded_by_user_id_fkey` FOREIGN KEY (`recorded_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `supply_chain_telemetry` ADD CONSTRAINT `supply_chain_telemetry_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `supply_chain_telemetry` ADD CONSTRAINT `supply_chain_telemetry_inventory_id_fkey` FOREIGN KEY (`inventory_id`) REFERENCES `inventory`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `integration_events` ADD CONSTRAINT `integration_events_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wallets` ADD CONSTRAINT `wallets_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wallet_transactions` ADD CONSTRAINT `wallet_transactions_wallet_id_fkey` FOREIGN KEY (`wallet_id`) REFERENCES `wallets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wallet_transactions` ADD CONSTRAINT `wallet_transactions_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `point_ledger` ADD CONSTRAINT `point_ledger_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `point_ledger` ADD CONSTRAINT `point_ledger_awarded_by_id_fkey` FOREIGN KEY (`awarded_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `overtime_logs` ADD CONSTRAINT `overtime_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `overtime_logs` ADD CONSTRAINT `overtime_logs_approved_by_id_fkey` FOREIGN KEY (`approved_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sales_activity_reports` ADD CONSTRAINT `sales_activity_reports_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sales_activity_reports` ADD CONSTRAINT `sales_activity_reports_reviewed_by_id_fkey` FOREIGN KEY (`reviewed_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_assignments` ADD CONSTRAINT `order_assignments_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_assignments` ADD CONSTRAINT `order_assignments_sewer_id_fkey` FOREIGN KEY (`sewer_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_assignments` ADD CONSTRAINT `order_assignments_assigned_by_id_fkey` FOREIGN KEY (`assigned_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fabric_cuts` ADD CONSTRAINT `fabric_cuts_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fabric_cuts` ADD CONSTRAINT `fabric_cuts_raw_material_id_fkey` FOREIGN KEY (`raw_material_id`) REFERENCES `raw_materials`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_movements` ADD CONSTRAINT `stock_movements_raw_material_id_fkey` FOREIGN KEY (`raw_material_id`) REFERENCES `raw_materials`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_movements` ADD CONSTRAINT `stock_movements_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payroll` ADD CONSTRAINT `payroll_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payroll` ADD CONSTRAINT `payroll_processed_by_id_fkey` FOREIGN KEY (`processed_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `finance_transactions` ADD CONSTRAINT `finance_transactions_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
