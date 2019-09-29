const express = require('express');
const router = express.Router();
const event = require("events");
const { HttpService } = require('../services/http');
const { Crawler } = require('../services/crawler');

/* GET Search page. */
router.get('/', function(req, res, next) {
    req.setTimeout(3600000);
    const { query } = req;
    if (query && query.url && query.keyword) {
        const url = query.url;
        const options = { keyword: query.keyword };
        new Crawler(url, options).startCrawler(url).then((resolve) => {
            const json = JSON.parse(resolve);
            res.json(json);
        });
    } else {
        res.json({ error: 'parameters not found.' });
    }
});

module.exports = router;
