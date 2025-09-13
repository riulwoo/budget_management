const mariadb = require('mariadb');

const pool = mariadb.createPool({
    host: 'localhost',
    port: 3306,
    user: 'budget',
    password: 'budget01',
    database: 'budget_management',
    connectionLimit: 5
});

module.exports = pool;