const express = require('express');
const router = express.Router();
const event = require("events");
const { HttpService } = require('../services/http');
const { Crawler } = require('../services/crawler');

/* GET home page. */
router.get('/', function(req, res, next) {
  const url = 'https://www.chevron.com';
  const options = { keyword: 'Announces' };
  new Crawler(url, options).startCrawler(url).then((resolve) => {
      res.render('index', { title: 'NodeCrawler', result: resolve });
  });
});

module.exports = router;
