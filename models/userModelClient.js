
const { Client } = require('pg');

const connectToDatabase = async () => {
    const client = new Client({
        user: 'chatdbadmin',    
        host: 'localhost',
        database: 'mychatdb', 
        password: '12345', 
        port: 5432,      
    });

    await client.connect();
    return client;
};

module.exports = connectToDatabase;