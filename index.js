const express = require('express');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const app = express();

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
});

// Существующий endpoint для получения XML ТЗ
app.get('/:regNumber', async (req, res) => {
    try {
        const xmlUrl = `https://zakupki.gov.ru/epz/order/notice/printForm/viewXml.html?regNumber=${req.params.regNumber}`;
        const response = await fetch(xmlUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const xml = await response.text();
        res.type('xml').send(xml);
    } catch (error) {
        res.status(500).send(`Ошибка: ${error.message}`);
    }
});

// Endpoint для поиска номеров контрактов
app.get('/contracts/:regNumber', async (req, res) => {
    try {
        const searchUrl = `https://zakupki.gov.ru/epz/contract/search/results.html?searchString=${req.params.regNumber}`;
        const response = await fetch(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const html = await response.text();
        const $ = cheerio.load(html);
        
        const contracts = [];
        
        // Ищем ссылки на контракты в результатах поиска
        $('.registry-entry__header-mid__number a[href*="reestrNumber="]').each((i, element) => {
            const href = $(element).attr('href');
            const contractMatch = href.match(/reestrNumber=(\d+)/);
            
            if (contractMatch) {
                const contractNumber = contractMatch[1];
                const contractText = $(element).text().trim();
                
                contracts.push({
                    contractNumber: contractNumber,
                    title: contractText,
                    url: `https://zakupki.gov.ru${href}`
                });
            }
        });
        
        // Убираем дубликаты
        const uniqueContracts = contracts.filter((contract, index, self) => 
            index === self.findIndex(c => c.contractNumber === contract.contractNumber)
        );
        
        res.json({
            searchNumber: req.params.regNumber,
            foundContracts: uniqueContracts,
            totalFound: uniqueContracts.length
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Новый endpoint для получения XML контракта
app.get('/contract-xml/:contractNumber', async (req, res) => {
    try {
        const xmlUrl = `https://zakupki.gov.ru/epz/contract/printForm/viewXml.html?contractReestrNumber=${req.params.contractNumber}`;
        const response = await fetch(xmlUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const xml = await response.text();
        res.type('xml').send(xml);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(process.env.PORT || 3000);
