const express = require('express');
const router = express.Router();
const db = require('../db');
const ExpressError = require('../expressError');


// Return info on invoices: like {invoices: [{id, comp_code}, ...]}

router.get('/', async function (req, res, next) {
    try {
        const invoicesQuery = await db.query("SELECT id, comp_code FROM invoices");

        return res.json({ invoices: invoicesQuery.rows });
    } catch (e) {
        return next(e);
    }
});
// Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}

router.get('/:id', async function (req, res, next) {
    try {
        const invoiceQuery = await db.query("SELECT id FROM invoices WHERE id = $1", [req.params.id]);
        const companiesQuery = await db.query("SELECT comp_code WHERE id = $1", [req.params.comp_code]);

        if (invoiceQuery.length === 0) {
            throw new ExpressError(`Can't find invoice with id of ${req.params.id}`, 404);
        }

        if (companiesQuery.length === 0) {
            throw new ExpressError(`Can't find company with the code of ${req.params.comp_code}`, 404);
        }

        return res.send({ invoice: invoiceQuery.rows[0], company: companiesQuery.rows[0] });
    } catch (e) {
        return next(e);
    }
});

// Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}

router.post('/', async function (req, res, next) {
    try {

        const { comp_code, amt } = req.body;

        const result = await db.query(`INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING id, comp_code, amt, paid, add_date, paid_date`,
            [comp_code, amt]);

        return res.status(201).json({ invoice: result.rows[0] });
    } catch (e) {
        return next(e);
    }
});

// Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}

router.put('/:id', async function (req, res, next) {
    try {
        const { id } = req.params;
        const { amt, paid } = req.body;
        let paidDate = null;

        const invoiceQuery = await db.query(`SELECT paid FROM invoices WHERE id = $1`, [id]);

        if (invoiceQuery.rows.length === 0) {
            throw new ExpressError(`Couldn't find the invoice with the id of ${id}`, 404);
        }

        const paidDateQ = invoiceQuery.rows[0].paid_date;

        if (!paidDateQ && paid) {
            paidDate = new Date();
        } else if (!paid) {
            paidDate = null;
        } else {
            paidDate = paidDateQ;
        }

        const result = await db.query(
            `UPDATE invoices SET amt=$1, paid=$2, paid_date=$3 WHERE id=$4 RETURNING id, comp_code, amt, paid, add_date, paid_date`,
            [amt, paid, paidDate, id]);

        return res.json({ invoice: result.rows[0] });
    }
    catch (e) {
        return next(e);
    }
});

// Returns: {status: "deleted"}

router.delete('/:id', async function (req, res, next) {
    try {
        const result = await db.query("DELETE FROM invoices WHERE id = $1 RETURNING id", [req.params.id]);

        if (result.rows.length === 0) {
            throw new ExpressError(`There is no invoice with the id of ${req.params.id}`, 404);
        }

        return res.json({ status: 'deleted' });
    } catch (e) {
        return next(e);
    }
});

module.exports = router;