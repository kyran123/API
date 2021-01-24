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
    /** Select query
   *  @param {object} requirements Supports `fields`, `table`, `where`, `order`, `limit`
   *  @param {function} callback The callback function
   */
    get(requirements, callback) {
        let query = 'SELECT';
        let preparedValues = [];
        if(requirements.fields.length > 0 && requirements.fields[0] == '*') {
            query += '*'
        } else {
            query += '??';
            preparedValues.push(requirements.fields);
        }
        if(requirements.table != null) {
            query += ' FROM ??';
            preparedValues.push(requirements.table);
        } else {
            callback({ result: false, msg: 'No table given' });
        }
        if(requirements.where != null) {
            if(Object.keys(requirements.where).length > 0) {
                query += ' WHERE ?';
                preparedValues.push(requirements.where);
            }
        }    
        if(requirements.order != null) {
            query += ' ORDER BY ??';
            preparedValues.push(requirements.order);
        }
        if(requirements.limit != null) {
            query += ' LIMIT ?';
            preparedValues.push(requirements.limit);
        }
        //Execute query if everything is succesfull
        this.connection.query(query, preparedValues)
        .then(([rows]) => {
            if(rows.length > 0) {
                callback({ result: true, data: rows });
            } else {
                callback({ result: false });
            }            
        })
        .catch((err) => {
            //Check if there was an error
            if(err !== null) {
                callback({ result: false, err: '[DBController.js].get() Failed to query ' + err });
            }
        });
    }
    //Select query (Limited)
    //[Param 1] The field names in string format
    //[Param 2] The database name (for example: Users)
    //[Param 3] The requirement object (Can have multiple items in object to have multiple requirements)
    //[Param 4] callback function
    getLimited(fields, db, limit, order, callback) {
        console.log(this.connection.format('SELECT ?? FROM ?? ORDER BY ?? ASC LIMIT ?', [fields, db, order, limit]));
        //Execute query if everything is succesfull
        this.connection.query('SELECT ?? FROM ?? ORDER BY ?? ASC LIMIT ?', [fields, db, order, limit])
        .then(([rows]) => {
            if(rows.length > 0) {
                callback({ result: true, data: rows });
            } else {
                callback({ result: false });
            }            
        })
        .catch((err) => {
            //Check if there was an error
            if(err !== null) {
                callback({ result: false, err: '[DBController.js].create() Failed to query ' + err });
            }
        });
    }
    //Select query (In promise)
    //[Param 1] The field names in string format
    //[Param 2] The database name (for example: Users)
    //[Param 3] The requirement object (Can have multiple items in object to have multiple requirements)
    getPromise(fields, db, requirements) {
        return new Promise((resolve, reject) => {
            this.connection.query('SELECT ?? FROM ?? WHERE ?', [fields, db, requirements])
            .then(([rows]) => {
                if(rows.length > 0) {
                    resolve({ result: true, data: rows });
                } else {
                    reject({ result: false });
                }            
            })
            .catch((err) => {
                //Check if there was an error
                if(err !== null) {
                    reject({ result: false, err: '[DBController.js].create() Failed to query ' + err });
                }
            });
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
            callback({ result: true, data: rows } );
        })
        .catch((err) => {
            console.log(err);
            //Check if there was an error
            if(err !== null) {
                callback({ result: false, err: '[DBController.js]:update() Failed to query ' + err });
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
            callback({ result: true, data: rows });
        })
        .catch((err) => {
            //Check if there was an error
            if(err !== null) {
                callback({ result: false, err: '[DBController.js]:delete() Failed to query ' + err });
            }
        });
    }
}

//Call initialization of DB
db.init();

//Export the database class
module.exports = db;