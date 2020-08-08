//------------------------------------------------------------------//
// Import packages                                                  //
//------------------------------------------------------------------//
const mysql = require('mysql2/promise');


//------------------------------------------------------------------//
// Database class                                                   //
//------------------------------------------------------------------//
const db = new class Database {
    async init() {
        this.connection = await mysql.createConnection({
            host:       process.env.DB_HOST,
            user:       process.env.DB_USER,
            password:   process.env.DB_PASS,
            database:   process.env.DB_NAME,
            connectionLimit: 10
        });
    }
    //Create query
    //[Param 1] The database name (for example: Users)
    //[Param 2] The object with correctly structured data to insert
    //[Param 3] callback function
    create(db, object, callback) {
        //Execute insert query
        this.connection.query('INSERT INTO ?? SET ?', [db, object])
        .then(([rows]) => {
            callback({ result:true, data: rows });
        })
        .catch((err) => {
            //Check if there was an error
            if(err !== null) {
                callback({ result: false, err: '[DBController.js].create() Failed to query ' + err });
            }
        });
    }
    //Select query
    //[Param 1] The field names in string format
    //[Param 2] The database name (for example: Users)
    //[Param 3] The requirement object (Can have multiple items in object to have multiple requirements)
    //[Param 4] callback function
    get(fields, db, requirements, callback) {
        //Execute query if everything is succesfull
        this.connection.query('SELECT ?? FROM ?? WHERE ?', [fields, db, requirements])
        .then(([rows]) => {
            callback({ result: true, data: rows });
        })
        .catch((err) => {
            //Check if there was an error
            if(err !== null) {
                callback({ result: false, err: '[DBController.js].create() Failed to query ' + err });
            }
        });
    }
    //Update query
    //[Param 1] The database name (for example: Users)
    //[Param 2] The SET object, where the values and columns are set.
    //[Param 3] The condition(s) that the user needs to adhere to 
    //[Param 4] callback function
    update(db, object, condition, callback) {
        //Execute update query
        this.connection.query('UPDATE ?? SET ? WHERE ?', [db, object, condition])
        .then(([rows]) => {
            callback(rows);
        })
        .catch((err) => {
            //Check if there was an error
            if(err !== null) {
                callback('[DBController.js]:update() Failed to query ' + err);
            }
        });
    }
    //Delete query
    //[Param 1] The database name (for example: Users)
    //[Param 2] The condition
    //[Param 3] callback function
    delete(db, condition, callback) {
        //Execute delete query
        this.connection.query('DELETE FROM ?? WHERE ?', [db, condition])
        .then(([rows]) => {
            callback(rows);
        })
        .catch((err) => {
            //Check if there was an error
            if(err !== null) {
                callback('[DBController.js]:delete() Failed to query ' + err);
            }
        });
    }

}

//Call initialization of DB
db.init();

//Export the database class
module.exports = db;