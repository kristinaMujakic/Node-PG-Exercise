const { Client } = require('pg');
const config = require('./config');

const { username, password, hostname, port } = config;

const connectionString = (process.env.NODE_ENV === 'test')
    ? `postgres://${username}:${password}@${hostname}:${port}/biztime_test`
    : `postgres://${username}:${password}@${hostname}:${port}/biztime`;

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
