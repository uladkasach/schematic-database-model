
# Schematic Database Model
Utilize ORM-like schema validation and abstract away general model queries, while having full control over the SQL.

## Description

The purpose of the schematic database model is to:
1. enable schema validation of database objects (both ones we insert and ones we retrieve)
2. abstract repetitive database logic such as .create, .update, .delete, .findAll
3. abstract the .execute method and database connection managment
  - including support for cases where .findOrCreate and .create must be conducted with a mutex lock

Ultimately through these abstractions the developer is able to focus on the actual business logic and not on the repetitive tasks of interacting with the database. Further, the developer is confident that the contract between their programs and the database is well defined (i.e., schema validation).

# SQL Parsing
This library uses yesql for parsing your sql statements into prepared statements. This means that we bind parameters from the object to the sql by column name in the following form `:column_name`. If you wish to make the value in the statement constant, and not a prepared statement variable, instead define the column name in the following form `x:column_name`.

For example:
- `SELECT * FROM a_table WHERE a_column=:a_column_value` -> `SELECT * FROM a_table WHERE a_column=?`
- `SELECT x:a_column_value` -> `SELECT '__some_constant__'`

# Examples

## Basic model
This model simply implements the schematic database model.

```ts
import SchematicDatabaseModel, { ConvinienceAttributes, CreateDatabaseConnectionMethod } from './_utils/schematicDatabaseModel'; // TODO - seperate into own module
import promiseConnection from '../init/database';

/**
  -- meta
  `canonical_image_id` VARCHAR(36) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME ON UPDATE CURRENT_TIMESTAMP,

  -- meta meta
  PRIMARY KEY (`canonical_image_id`)
*/
export default class CanonicalImage extends SchematicDatabaseModel {
  protected static createDatabaseConnection: CreateDatabaseConnectionMethod = promiseConnection;
  protected static tableName = 'canonical_images';
  protected static primaryKey = 'canonical_image_id';
  protected static attributes: ConvinienceAttributes = {
    canonical_image_id: 'string',
    created_at: 'datetime',
    updated_at: 'datetime',
  };
  protected static CREATE_QUERY = `
  INSERT INTO :table_name
    (:primary_key)
    VALUES
    (:primary_key_value);
  `;
  // protected static UPDATE_QUERY = 'UPDATE ...'; // this is an insert only model, so we do not define this property.
}
```

## Customized Model
This model includes custom methods to more easily interact with the database
```ts
import SchematicDatabaseModel, { ConvinienceAttributes, CreateDatabaseConnectionMethod } from './_utils/schematicDatabaseModel'; // TODO - seperate into own module
import promiseConnection from '../init/database';
import { TargetDimensions } from '../types/general.d';

/**
  `image_resolution_id` VARCHAR(36) NOT NULL, -- uuid()
  `canonical_image_id` VARCHAR(36) NOT NULL, -- canonical_image_id_fk
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME ON UPDATE CURRENT_TIMESTAMP,

  -- data
  `width` INT NOT NULL, -- width in px of the image
  `height` INT NOT NULL, -- height in px of the image
  `type` ENUM('original', 'resized') NOT NULL, -- original upload -vs- resized version
  `s3_uri` VARCHAR(255) NOT NULL, -- where we can find it in s3
*/
export default class ImageResolution extends SchematicDatabaseModel {
  /**
    -- convinience methods -------------------------------------------------
  */
  public static async findOriginalFor(
    {
      canonical_image_id,
    }: {
      canonical_image_id: string,
    },
  ) {
    const querybase = `
      SELECT *
      FROM :table_name
      WHERE
        type='original'
        AND
        canonical_image_id=:canonical_image_id;
    `;
    const values = { canonical_image_id };

    // get resuts for query
    const instances = await super.findAll({ querybase, values }) as ImageResolution[];
    if (instances.length !== 1) console.log(`(!) WARNING: more than one original image resolution found for canonical image id ${canonical_image_id}`); // this should not occur
    return instances[0];
  }

  public static async findBySize(
    {
      canonical_image_id,
      size,
    }: {
      canonical_image_id: string,
      size: TargetDimensions,
    },
  ): Promise<ImageResolution[]> {
    const queryparts = []; // collect all query parts to use

    // define base query to use
    queryparts.push(`
      SELECT *
      FROM :table_name
      WHERE canonical_image_id=:canonical_image_id`);

    // add width constraint if exists
    if (size.width) {
      queryparts.push(' AND width=:width ');
    }

    // add height constraint if exists
    if (size.height) {
      queryparts.push(' AND height=:height ');
    }

    // generate query base from the query parts
    const querybase = queryparts.join('');
    const values = {
      canonical_image_id,
      width: size.width,
      height: size.height,
    };

    // get resuts for query base
    const instances = await super.findAll({ querybase, values }) as ImageResolution[];
    return instances;
  }

  /**
    -- required model params -----------------------------------------------
  */
  protected static createDatabaseConnection: CreateDatabaseConnectionMethod = promiseConnection;
  protected static tableName = 'image_resolutions';
  protected static primaryKey = 'image_resolution_id';
  protected static attributes: ConvinienceAttributes = {
    image_resolution_id: 'string',
    created_at: 'datetime',
    updated_at: 'datetime',
    canonical_image_id: {
      type: 'string',
      required: true,
    },
    width: {
      type: 'int',
      required: true,
    },
    height: {
      type: 'int',
      required: true,
    },
    type: {
      type: 'string',
      required: true,
      validation: (value: string) => (['original', 'resized'].includes(value)) ? [] : ['image type is not original or resized.'],
    },
    s3_uri: {
      type: 'string',
      required: true,
    },
  };
  protected static CREATE_QUERY = `
  INSERT INTO :table_name
    (:primary_key, canonical_image_id, width, height, type, s3_uri)
    VALUES
    (:primary_key_value, :canonical_image_id, :width, :height, :type, :s3_uri);
  `;
  // protected static UPDATE_QUERY = 'UPDATE ...'; UPDATES NOT DEFINED YET
}
```


# Example Query Definitions

### Find Or Create
MySQL restricts IF... ELSE... syntax for inside of stored procedures. Because of this, we must define a stored procedure to use for `findOrCreate`, as otherwise it is not possible to both create and find.

Example of a findOrCreate stored procedure:
```sql
DROP PROCEDURE IF EXISTS `sp_find_or_create_canonical_image`;
DELIMITER //
CREATE PROCEDURE `sp_find_or_create_canonical_image`
(IN in_canonical_image_id VARCHAR(36))
BEGIN
  IF NOT EXISTS (select * from canonical_images where canonical_image_id = in_canonical_image_id) THEN
    insert into canonical_images (canonical_image_id) values (in_canonical_image_id);
  END IF;
  select * from canonical_images where canonical_image_id=in_canonical_image_id;
END //
DELIMITER ;
```

Example of using that stored procedure to populate the `FIND_OR_CREATE_QUERY`:
```sql
  call sp_find_or_create_canonical_image(:primary_key_value);
```


# More Reference Queries

### Insert If Not Exists
Reference: https://stackoverflow.com/questions/1361340/how-to-insert-if-not-exists-in-mysql

#### When a unique constraint is usable
Use `INSERT ... ON DUPLICATE KEY`

#### When no unique constraints are usable:
```sql
INSERT INTO canonical_images (canonical_image_id) -- insert
SELECT * FROM (SELECT '21' ) AS insert_values_temporary_table -- the following values
WHERE NOT EXISTS (
    SELECT * FROM canonical_images WHERE canonical_image_id = '21' -- if we cant find this row
) LIMIT 1;
```
or more generally
```sql
INSERT INTO :table_name (:primary_key, __YOUR_COLUMNS__) -- insert
SELECT * FROM (SELECT x:primary_key_value, __YOUR_OTHER_VALUES_AS_CONSTANTS__) AS insert_values_temporary_table -- the following values
WHERE NOT EXISTS ( -- if we cant find the following row
    SELECT * FROM :table_name WHERE __YOUR_COLUMNS__ -- i.e., FIND_QUERY
) LIMIT 1;
```
