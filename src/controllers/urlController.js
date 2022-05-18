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

const baseUrl = 'http:localhost:3000'

const creatShortUrl = async (req, res) =>{
    const {
        longUrl
    } = req.body // destructure the longUrl from req.body.longUrl

    // check base url if valid using the validUrl using regex method
       const isValidUrl = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-/]))?/
    // if (!validUrl.isUri(baseUrl)) {
    //     return res.status(401).json('Invalid base URL')
    // }

    // if valid, we create the url code
    const urlCode = shortid.generate()

    if (!isValidUrl.test(longUrl)) {
        return res.status(400).send({status:false, msg:'Invalid longUrl'})
    }    
    // check long url if valid using the validUrl.isUri method
    if (validUrl.isUri(longUrl)) {
        try {
            /* The findOne() provides a match to only the subset of the documents 
            in the collection that match the query. In this case, before creating the short URL,
            we check if the long URL was in the DB ,else we create it.
            */
            let url = await urlModel.findOne({longUrl:longUrl })

            // url exist and return the respose
            if (url) {
                res.status(400).send({status:false,msg:"shorternurl already generated on this longUrl"})
            } else {
                // join the generated short code the the base url
                const shortUrl = baseUrl + '/' + urlCode

                // invoking the Url model and saving to the DB
                url = new urlModel({
                    longUrl,
                    shortUrl,
                    urlCode,
                    date: new Date()
                })
                await url.save()
                await SET_ASYNC(`${url}`, JSON.stringify(url))
                res.status(201).send({status:true , msg:"Url created Sucessfully", data:url})
            }
        }
        // exception handler
        catch (err) {
            console.log(err)
            res.status(500).send({staus:false ,error: err.message})
        }
    } 
}

const fetchurlCode = async function (req, res) {
    let cahcedurlCodeData = await GET_ASYNC(`${req.params.urlCode}`)
    if(cahcedurlCodeData) {
      res.send(cahcedurlCodeData)
    } else {
      let urlCode = await urlModel.findById(req.params.urlCode);
      await SET_ASYNC(`${req.params.urlCode}`, JSON.stringify(profile))
      res.send({ data: urlCode });
    }
  
  };

const getOriginalUrl = async (req, res) => {
    try {

        // find a document match to the code in req.params.code

        const url = await urlModel.findOne({
            urlCode: req.params.urlCode
        })
        if (url) {
            // when valid we perform a redirect
            return res.redirect(url.longUrl)
        } else {
            // else return a not found 404 status
            return res.status(404).send({staus:false, masg:'No URL Found'})
        }

    }
    // exception handler
    catch (err) {
        console.error(err)
        res.status(500).send({staus:false, error: err.message})
    }
}

module.exports.creatShortUrl = creatShortUrl
module.exports.getOriginalUrl=getOriginalUrl
module.exports.fetchurlCode= fetchurlCode