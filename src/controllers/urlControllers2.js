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

const isValidRequestBody = function (requestbody) {
    return Object.keys(requestbody).length > 0;
  };


const creatShortUrl2 = async (req, res) =>{
      try {
        const requestBody = req.body;
        if (!isValidRequestBody(requestBody))
            return res.status(400).send({ status: false, massage: "longUrl is required" })

         const longUrl = req.body.longUrl // destructure the longUrl from req.body.longUrl

         
            // check base url if valid using the validUrl using regex method
            //    const isValidUrl = /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff_-]{0,62})?[a-z0-9\u00a1-\uffff]\.)+(?:[a-z\u00a1-\uffff]{2,}\.?))(?::\d{2,5})?(?:[/?#]\S*)?$/
            //    .test(longUrl)
          
            // if (!isValidUrl) {
            //     return res.status(400).send({status:false, msg:'Invalid longUrl'})
            // }    
            let cachesUrlData = await GET_ASYNC(`${longUrl}`);

            const urlData = JSON.parse(cachesUrlData);
            console.log(urlData)

            if(cachesUrlData){
               res.status(302).send({status: true,masg:"shorternurl already generated on this longUrl",url:urlData})
            }

            let url = await urlModel.findOne({longUrl:longUrl})
            .select({urlCode:1,longUrl:1,shortUrl:1, _id:0})

            // url exist and return the respose
            if (url) {
                res.status(200).send({status:,msg:"shorternurl already generated on this longUrl" ,data:url})
            } else {
                // join the generated short code the the base url


                const baseUrl = 'http:localhost:3000'
                const urlCode = shortid.generate()
                const shortUrl = baseUrl + '/' + urlCode

                // invoking the Url model and saving to the DB
                url = new urlModel({
                    longUrl,
                    shortUrl,
                    urlCode,
                
                })
                await url.save()
                await SET_ASYNC(`${url}`, JSON.stringify(D))
                
                await SET_ASYNC(`${req.params.urlCode}`, JSON.stringify(url))
                res.status(201).send({status:true , msg:"Url created Sucessfully", data:url})
            }
        }
        // exception handler
        catch (err) {
            console.log(err)
            res.status(500).send({staus:false ,error: err.message})
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
        return res.redirect(urlData.longUrl);
      } else {
        let findUrlCode = await urlModel
          .findOne({ urlCode: requestParams })
          .select({longUrl:1})
  
        if (!findUrlCode) {
          return res
            .status(404)
            .send({ status: false, message: "Not found this url code." });
        }
  
        // res.redirect(findUrlCode.longUrl)
        await SET_ASYNC(`${requestParams}`, JSON.stringify(findUrlCode));
        res.redirect(findUrlCode.longUrl);
      }
    } catch (error) {
      res.status(500).send({ status: false, message: error.message });
    }
  };
  

const fetchurlCode = async function (req, res) {

    let cahcedurlCodeData = await GET_ASYNC(`${req.params.urlCode}`)

    const urlData = JSON.parse(cahcedurlCodeData)

    if(cahcedurlCodeData) {
        console.log("cache");
     return res.redirect(urlData.longUrl)

    } else {
      let urlCode = await urlModel.findOne({urlCode:req.params.urlCode}).select({longUrl:1});

      await SET_ASYNC(`${req.params.urlCode}`, JSON.stringify(urlCode))

      if(!urlCode){
          res.status(404).send({status:false ,msg:"UriCode dosent exist "})
      }
      res.send({ data: urlCode });
    }
  
  };


module.exports.creatShortUrl2 = creatShortUrl2
module.exports.getOriginalUrl=getOriginalUrl
module.exports.fetchurlCode= fetchurlCode