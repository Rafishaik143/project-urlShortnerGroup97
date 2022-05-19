const express = require('express');
const router = express.Router();
const urlControllers = require("../controllers/urlController")



router.post('/url/shorten',urlControllers.creatShortUrl)
router.get('/:urlCode',urlControllers.getOriginalUrl)


module.exports = router; 
