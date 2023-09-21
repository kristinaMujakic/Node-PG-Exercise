const express = require('express');
const router = express.Router();
const db = require('../db');
const ExpressError = require('../expressError');
const slugify = require('slugify');

// returns list of companies  {companies: [{code, name}, ...]}
router.get('/', async function (req, res, next) {
    try {
        const companiesQuery = await db.query(
            `SELECT code, name FROM companies`
        );

        return res.json({ companies: companiesQuery.rows });
    } catch (e) {
        return next(e);
    }
});

// Return obj of company: {company: {code, name, description, invoices:[id, ...]}}

router.get('/:code', async function (req, res, next) {
    try {
        const { code } = req.params;

        const companyQuery = await db.query("SELECT code, name, description FROM companies WHERE code = $1", [code]);

        const invoiceQuery = await db.query("SELECT id FROM invoices WHERE comp_code = $1", [code]);

        if (companyQuery.rows.length === 0) {
            throw new ExpressError(`Can't find company with code of ${code}`, 404);
        }

        const company = companyQuery.rows[0];
        const invoices = invoiceQuery.rows;

        company.invoices = invoices.map(inv => inv.id);

        return res.send({ company: company });
    } catch (e) {
        return next(e);
    }
});

// returns obj of new company: {company: {code, name, description}}

router.post('/', async function (req, res, next) {
    try {
        let { name, description } = req.body;
        let code = slugify(name, { lower: true });
        const result = await db.query(`INSERT INTO companies (code, name, description)
        VALUES ($1, $2, $3)
        RETURNING code, name, description
        `, [code, name, description]);

        return res.status(201).json({ company: result.rows[0] });
    } catch (e) {
        return next(e);
    }
});

// Returns update company object: {company: {code, name, description}}
router.put('/:code', async function (req, res, next) {
    try {
        const { code } = req.params;
        const { name, description } = req.body;

        const result = await db.query(`
        UPDATE companies
            SET name = $1, description = $2
            WHERE code = $3
            RETURNING code, name, description`, [name, description, code]);

        if (result.rows.length === 0) {
            throw new ExpressError(`There is no company with the code of ${code}`, 404);
        }

        return res.json({ company: result.rows[0] });
    } catch (e) {
        return next(e);
    }
});

// Returns {status: "deleted"}

router.delete('/:code', async function (req, res, next) {
    try {
        const { code } = req.params;
        const result = await db.query("DELETE FROM companies WHERE code = $1 RETURNING code", [code]);

        if (result.rows.length === 0) {
            throw new ExpressError(`There is no company with the code of ${code}`, 404);
        }

        return res.json({ status: 'deleted' });
    } catch (e) {
        return next(e);
    }
});

module.exports = router;