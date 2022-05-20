const urlModel = require("../models/urlModel")
const validUrl = require('valid-url')
const shortid = require('shortid')
const redis = require("redis");

const { promisify } = require("util");

//Connect to redis


const redisClient = redis.createClient(
    15299,
  "redis-15299.c301.ap-south-1-1.ec2.cloud.redislabs.com",
  { no_ready_check: true }
);
redisClient.auth("Gh6C6FL9InvuiPm3mQOgysNHiuvjA6qN", function (err) {
  if (err) throw err;
});

redisClient.on("connect", async function () {
  console.log("Connected to Redis..");
});

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);



const creatShortUrl = async (req, res) => {
    try {

        const longUrl = req.body.longUrl

        if (!longUrl) {
            return res.status(400).send({ status: false, msg: "Please provide a longUrl " })
            
        }
        
        if (!(/(:?^((https|http|HTTP|HTTPS){1}:\/\/)(([w]{3})[\.]{1}|)?([a-zA-Z0-9]{1,}[\.])[\w]*((\/){1}([\w@?^=%&amp;~+#-_.]+))*)$/.test(longUrl.trim()))) {
            return res.status(400).send({ status: false, msg: "Please provide a valid longUrl" })
        }

        let LongUrl = await GET_ASYNC(`${longUrl}`)
        let LongUrlCache = JSON.parse(LongUrl)
        if (LongUrlCache)
            return res.status(200).send({ status: true, msg: "Already a shortUrl exist with this Url in Cache", urlDetails: LongUrlCache })

        let url = await urlModel.findOne({ longUrl: longUrl })
            .select({ longUrl: 1, shortUrl: 1, urlCode: 1, _id: 0 })

        // url exist and return the respose
        if (url) {
            return res.status(302).send({ status: true, msg: "Already a shortUrl exist with this Url in DB", urlDetails: url })
        }
        // join the generated short code the the base url


        const baseUrl = 'http:localhost:3000'
        const urlCode = shortid.generate()
        const shortUrl = baseUrl + '/' + urlCode

        

        let data = {
            urlCode: urlCode,
            longUrl: longUrl,
            shortUrl: shortUrl
        }
        
        let urlDetails = await urlModel.create(data)

        let result = {
            urlCode: urlDetails.urlCode,
            longUrl: urlDetails.longUrl,
            shortUrl: urlDetails.shortUrl
        }
        await SET_ASYNC(`${longUrl}`, JSON.stringify(result))
        await SET_ASYNC(`${urlCode}`, JSON.stringify(result.longUrl));

        return res.status(201).send({ status: true, data: result })
    }

    // exception handler
    catch (err) {
        console.log(err)
        res.status(500).send({ staus: false, error: err.message })
    }

}



let getOriginalUrl = async function (req, res) {
    try {
      let requestParams = req.params.urlCode;
  
  
      let cachesUrlData = await GET_ASYNC(`${requestParams}`);

      console.log(cachesUrlData)   
      //convert to object
      const urlData = JSON.parse(cachesUrlData);
      
      console.log(urlData)
      if (cachesUrlData) {
        console.log("cache");
        return res.status(302).redirect(urlData.longUrl);
      } else {
        let findUrlCode = await urlModel
          .findOne({ urlCode: requestParams })
  
        if (!findUrlCode) {
          return res
            .status(404)
            .send({ status: false, message: "Not found this url code." });
        }
  
        // res.redirect(findUrlCode.longUrl)
        await SET_ASYNC(`${requestParams}`, JSON.stringify(findUrlCode.longUrl));
        res.status(302).redirect(findUrlCode.longUrl);
      }
    } catch (error) {
      res.status(500).send({ status: false, message: error.message });
    }
  };
  


module.exports.creatShortUrl = creatShortUrl
module.exports.getOriginalUrl=getOriginalUrl
