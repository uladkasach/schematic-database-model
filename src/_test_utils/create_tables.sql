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
  `person_id` INT(11) NOT NULL AUTO_INCREMENT, -- uuid
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME ON UPDATE CURRENT_TIMESTAMP,

  -- primary data
  `name` TEXT NOT NULL,

  -- meta meta
  PRIMARY KEY (`person_id`)
) ENGINE = InnoDB;
