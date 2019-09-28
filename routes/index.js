const express = require('express');
const router = express.Router();
const { HttpService } = require('../services/http');
const { Crawler } = require('../services/crawler');

/* GET home page. */
router.get('/', function(req, res, next) {
  const url = 'https://www.chevron.com';
  const httpService = new HttpService();
  httpService.getHtmlDocumentByUrl(url);
  new Crawler().startCrawler(url);
  res.render('index', { title: 'NodeCrawler' });
});

module.exports = router;
