const express = require('express');
const { Parser } = require('json2csv');
const ExcelJS = require('exceljs');
const User = require('../models/Users');
const Station = require('../models/Station');


const router = express.Router();

// EXPORT USERS AS CSV
router.get('/users/csv', async (req, res) => {
  try {
    const users = await User.findAll({ raw: true });

    const parser = new Parser();
    const csv = parser.parse(users);

    res.header('Content-Type', 'text/csv');
    res.attachment('users.csv');
    return res.send(csv);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// EXPORT STATIONS AS EXCEL
router.get('/stations/excel', async (req, res) => {
  try {
    const stations = await Station.findAll({ raw: true });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Stations');

    sheet.columns = [
      { header: 'ID', key: 'id' },
      { header: 'Name', key: 'name' },
      { header: 'Address', key: 'address' },
      { header: 'Latitude', key: 'latitude' },
      { header: 'Longitude', key: 'longitude' }
    ];

    stations.forEach((row) => sheet.addRow(row));

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=stations.xlsx'
    );

    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;