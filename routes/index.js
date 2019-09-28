const express = require('express');
const router = express.Router();
const { HttpService } = require('../services/http');
const { Crawler } = require('../services/crawler');

/* GET home page. */
router.get('/', function(req, res, next) {
  const url = 'https://www.chevron.com';
  const options = { keyword: 'IoT' };
  new Crawler(url, options).startCrawler(url);
  res.render('index', { title: 'NodeCrawler' });
});

module.exports = router;
