process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const db = require('../db');


beforeEach(async function () {
    await db.query("SELECT setval('invoices_id_seq', 1, false)");
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

describe('/GET /companies', function () {
    test('Gets a list of companies', async function () {
        const response = await request(app).get(`/companies`);
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            companies: [
                { code: "apple", name: "Apple" },
                { code: "ibm", name: "IBM" },
            ]
        });
    });
});

describe('/GET /:code', function () {
    test('Return obj of company', async function () {
        const response = await request(app).get('/companies/apple');
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({ company: { code: "apple", name: "Apple", description: "Maker of OSX.", invoices: [1, 2] } });
    });

    test('Return 404 if company does not exist', async function () {
        const response = (await request(app).get('/companies/Bubble'));
        expect(response.status).toEqual(404);
    });

});

describe('/POST /companies', function () {
    test('Creates new company', async function () {
        const response = (await request(app).post('/companies').send({ name: "Glitter", description: "Jewelry company" }));
        expect(response.statusCode).toEqual(201);
        expect(response.body).toEqual({ company: { code: "glitter", name: "Glitter", description: "Jewelry company" } });
    });
});

describe('/PUT /companies/:code', function () {
    test('Updates a company', async function () {
        const response = (await request(app).put('/companies/apple').send({ name: "Apple Company" }));
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({ company: { code: "apple", name: "Apple Company", "description": null } });
    });

    test('Returns 404 if there is no company', async function () {
        const response = await request(app).put('/companies/Bubble').send({ name: "Bubble Gum" });
        expect(response.status).toEqual(404);
    });
});

describe('DELETE /companies/:code', function () {
    test('Deletes a single company', async function () {
        const response = await request(app).delete(`/companies/apple`);
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({ status: "deleted" });
    });
});

afterEach(async function () {
    await db.query("DELETE FROM companies");
    await db.query("DELETE FROM invoices");
});

afterAll(async function () {
    await db.end();
});