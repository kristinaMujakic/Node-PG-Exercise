process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const db = require('../db');

beforeEach(async function () {

    await db.query('SELECT setval(\'invoices_id_seq\', 1, false)');
    await db.query(`INSERT INTO companies (code, name, description)
                    VALUES ('apple', 'Apple', 'Maker of OSX.'),
                           ('ibm', 'IBM', 'Big blue.')`);

    const inv = await db.query(
        `INSERT INTO invoices (comp_code, amt, paid, add_date, paid_date)
           VALUES ('apple', 100, false, '2018-01-01', null),
                  ('apple', 200, true, '2018-02-01', '2018-02-02'), 
                  ('ibm', 300, false, '2018-03-01', null)
           RETURNING id`);

});

describe('GET /invoices', function () {
    test('Gets a list of invoices', async function () {
        const response = await request(app).get('/invoices');
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            invoices: [
                { id: 1, comp_code: 'apple' },
                { id: 2, comp_code: 'apple' },
                { id: 3, comp_code: 'ibm' },
            ]
        });
    });
});

describe('GET /invoices/:id', function () {
    test('Gets a single invoice', async function () {
        const response = await request(app).get('/invoices/1');
        expect(response.body).toEqual(
            {
                'invoice': {
                    id: 1,
                    amt: 100,
                    add_date: '2018-01-01T08:00:00.000Z',
                    paid: false,
                    paid_date: null,
                    company: {
                        code: 'apple',
                        name: 'Apple',
                        description: 'Maker of OSX.',
                    }
                }
            }
        );
    });
    test('Error if there is no such invoice', async function () {
        const response = await request(app).get('/invoices/333');
        expect(response.status).toEqual(404);
    });
});

describe('PUT /', function () {

    test('It should update an invoice', async function () {
        const response = await request(app)
            .put('/invoices/1')
            .send({ amt: 1000, paid: false });

        expect(response.body).toEqual(
            {
                'invoice': {
                    id: 1,
                    comp_code: 'apple',
                    paid: false,
                    amt: 1000,
                    add_date: expect.any(String),
                    paid_date: null,
                }
            });
    }
    );
});

test('It should return 404 for no-such-invoice', async function () {
    const response = await request(app)
        .put('/invoices/9999')
        .send({ amt: 1000 });

    expect(response.status).toEqual(404);
});

describe('DELETE /invoices/:code', function () {
    test('Deletes a single invoice', async function () {
        const response = await request(app).delete(`/invoices/1`);
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({ status: 'deleted' });
    });

    test('Returns 404 if the invoice does not exist', async function () {
        const response = await request(app)
            .delete("/invoices/999");

        expect(response.status).toEqual(404);
    });
});

afterEach(async function () {
    await db.query('DELETE FROM companies');
    await db.query('DELETE FROM invoices');
});

afterAll(async function () {
    await db.end();
});
