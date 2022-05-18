const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const route = require('./routes/route');
const mongoose = require('mongoose');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


mongoose.connect("mongodb+srv://RafiShaik:fe45RDiNcaqyRfsB@cluster0.b6v5a.mongodb.net/group97Database",
{
    useNewUrlParser: true
})
.then( () => console.log("MongoDb is connected"))
.catch ( err => console.log(err) );



app.use('/',route);

app.use((req, res, next) => {
    res.status(404).send({
        status: 404,
        error: `Not found ${req.url}`
    })
})
const baseUrl = 'http:localhost:3000'

app.listen(process.env.PORT || 3000, (err)=> {
    console.log("Connected to PORT 3000")
});