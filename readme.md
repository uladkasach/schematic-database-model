
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

# Connection Reuse and Pooling
Note: this module supports usage of managed database connections, where the user is responsible for starting and ending database connections or pools. See the fundementalDatabaseModel.test.integration.ts for a live working example of how to use this.

Note: the utils/managedDatabaseConnection class makes it easy to create very explicit work flows of managing database connections.

# Methods

## Low Level
- `.execute(querybase, values)`
  - this method simply executes whatever query you pass to it and returns the response
- `.findAll(querybase, values)`
  - this methods executes whatever query you pass to it and casts all results into the database model object, returning instances of the model.

## High Level
These are methods that we support at a high level due to common use cases. For these methods, defining the query is sufficient - logic is already in place to handle the rest.

- `.create`
  - calls the `CREATE_QUERY` statement
  - works with auto_increment, uuid, and custom primary key types
- `.update`
  - calls the `UPDATE_QUERY` statement
- `.save`
  - calls `.create` or `.update` based on whether or not primary key value is defined
- `.findByPrimaryKey`
  - finds the object by primary_key_value
- `.delete`
  - deletes the object by primary_key_value
- `.upsert`
  - calls the `UPSERT_QUERY` and subsequently the `FIND_BY_UNIQUE_ATTRIBUTES_QUERY`
- `.findOrCreate`
  - calls `.upsert`

# Recommended Design: Insert Only
By enforcing an insert only policy on your databases you guarantee that all data is persisted even if the current state of entities is updated. Further, it makes your schema's easier to understand and reduces the surface area for bugs to arise from.

In tables which simply aggregate unique values, this is simple to enforce as you can `INSERT IGNORE...` (with unique constraints) to ensure that each entry is recorded atleast one time.

In tables which track the current state of a mutatable entry, the following approach is recommended:
- https://www.slideshare.net/TommCarr/bitemporal-rdbms-2014
- https://www.dropbox.com/s/8hnkzet6fueblz7/TemporalDBDesign.pdf?dl=0

# Examples

TODO: add mapping table model example
TODO: move into own directory

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
  protected static primaryKeyType = 'auto_increment'; // other options: 'uuid', 'custom'
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
  protected static primaryKeyType = 'uuid';
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
