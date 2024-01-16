var express = require('express');
var router = express.Router();
const ScraperService = require('../service/scraperService');

const scraperService = new ScraperService();

// scraping route
router.get('/scrape', function(req, res, next) {
  try {
    scraperService.runScraper();
    res.status(200).send({ "success": "success" });
  } catch (error) {
    console.error(`errror scraping endpoint: ${error.message}`);
    res.status(400).send({ error: error.message });
  }
});

module.exports = router;
