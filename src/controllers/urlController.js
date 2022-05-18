const urlModel = require("../models/urlModel")
const validUrl = require('valid-url')
const shortid = require('shortid')

const baseUrl = 'http:localhost:3000'

const creatShortUrl = async (req, res) =>{
    const {
        longUrl
    } = req.body // destructure the longUrl from req.body.longUrl

    // check base url if valid using the validUrl.isUri method
       const isValidUrl = /^(?:(?:https?|ftp):\/\/)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/\S*)?$/
    if (!validUrl.isUri(baseUrl)) {
        return res.status(401).json('Invalid base URL')
    }

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
                res.status(400).send({status:false,msg:"url already exist"})
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