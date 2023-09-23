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
        const { id } = req.params;

        const result = await db.query(
            `SELECT i.id, 
                  i.comp_code, 
                  i.amt, 
                  i.paid, 
                  i.add_date, 
                  i.paid_date, 
                  c.name, 
                  c.description 
           FROM invoices AS i
             INNER JOIN companies AS c ON (i.comp_code = c.code)  
           WHERE id = $1`,
            [id]);

        if (result.rows.length === 0) {
            throw new ExpressError(`No such invoice: ${id}`, 404);
        }

        const data = result.rows[0];
        const invoice = {
            id: data.id,
            company: {
                code: data.comp_code,
                name: data.name,
                description: data.description,
            },
            amt: data.amt,
            paid: data.paid,
            add_date: data.add_date,
            paid_date: data.paid_date,
        };

        return res.json({ invoice: invoice });
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
        const result = await db.query(`DELETE FROM invoices WHERE id = $1 RETURNING id`, [req.params.id]);

        if (result.rows.length === 0) {
            throw new ExpressError(`There is no invoice with the id of ${req.params.id}`, 404);
        }

        return res.json({ status: 'deleted' });
    } catch (e) {
        return next(e);
    }
});

module.exports = router;