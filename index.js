const express = require('express');
const fetch = require('node-fetch');
const app = express();

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
});

app.get('/:regNumber', async (req, res) => {
    try {
        const xmlUrl = `https://zakupki.gov.ru/epz/order/notice/printForm/viewXml.html?regNumber=${req.params.regNumber}`;
        const response = await fetch(xmlUrl);
        const xml = await response.text();
        res.type('xml').send(xml);
    } catch (error) {
        res.status(500).send(`Ошибка: ${error.message}`);
    }
});

app.listen(process.env.PORT || 3000);
