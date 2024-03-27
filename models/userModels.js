const {Pool} =require( 'pg');

const pool= new Pool({
    user: 'chatdbadmin',
    host:'localhost',
    database: 'mychatdb',
    password:'12345',
    port: 5432,
})

module.exports =pool ;