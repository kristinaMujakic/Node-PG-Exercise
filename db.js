const { Client } = require('pg');
const config = require('./config');

const { username, password, database, hostname, port } = config;

const connectionString = `postgres://${username}:${password}@${hostname}/${database}`;

const client = new Client({
    connectionString: connectionString
});

client.connect()
    .then(() => {
        console.log('Connected to the PostgreSQL database');
    })
    .catch((error) => {
        //  throw new Error('SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string')
        console.error('Error connecting to the database:', error.message);
    });

module.exports = client;

