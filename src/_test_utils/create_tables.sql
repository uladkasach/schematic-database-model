-- ----------------------------------------
-- create person table
-- ----------------------------------------
DROP TABLE IF EXISTS `person`;
CREATE TABLE `person` (
  -- meta
  `person_uuid` VARCHAR(36) NOT NULL, -- uuid
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME ON UPDATE CURRENT_TIMESTAMP,

  -- primary data
  `name` TEXT NOT NULL,

  -- meta meta
  PRIMARY KEY (`person_uuid`)
) ENGINE = InnoDB;


-- ----------------------------------------
-- create incremental_person table
-- ----------------------------------------
DROP TABLE IF EXISTS `incremental_person`;
CREATE TABLE `incremental_person` (
  -- meta
  `person_id` INT(11) NOT NULL AUTO_INCREMENT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME ON UPDATE CURRENT_TIMESTAMP,

  -- primary data
  `name` TEXT NOT NULL,

  -- meta meta
  PRIMARY KEY (`person_id`)
) ENGINE = InnoDB;


-- ----------------------------------------
-- create colors table
-- ----------------------------------------
DROP TABLE IF EXISTS `colors`;
CREATE TABLE `colors` (
  -- meta
  `color_id` INT(11) NOT NULL AUTO_INCREMENT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,

  -- primary data
  `name` VARCHAR(255) NOT NULL UNIQUE,

  -- meta meta
  PRIMARY KEY (`color_id`)
) ENGINE = InnoDB;
