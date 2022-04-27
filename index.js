var http = require("http");
var express = require("express");
var app = express();
var request = require("request");
var bodyParser = require("body-parser");
var cache = require("memory-cache");
const req = require("express/lib/request");
const gettingJSON = () => {
    return new Promise((resolve, reject) => {
        request.get(
            "https://s3-ap-southeast-1.amazonaws.com/he-public-data/word_dictionary0634994.json",
            (err, res, body) => {
                if (err) {
                    console.log(err);
                } else {
                    resolve(body);
                    console.log(body);
                }
            }
        );
    });
};
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content, Accept, Content-Type, Authorization"
    );
    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, PATCH, OPTIONS"
    );
    next();
});
app.use(bodyParser.json());
app.use(
    bodyParser.urlencoded({
        extended: true,
    })
);
var server = app.listen(3000, "127.0.0.1", function() {
    var host = server.address().address;
    var port = server.address().port;

    console.log("App listening at http://%s:%s", host, port);
});
app.get("/api/:word1/:word2", function(req, res) {
    try {
        console.log("Word1", req.params.word1);
        console.log("Word2", req.params.word2);

        const word1 = req.params.word1;
        const word2 = req.params.word2;
        let cacheResponse = cache.get(`${word1},${word2}`);
        console.log("Cache Response: " + cacheResponse);
        let nextCacheResponse = cache.get(`${word2},${word1}`);
        console.log("Next Cache Response", nextCacheResponse);
        if (cacheResponse) {
            res.status(200);
            res.send({ words: cacheResponse });
        } else if (nextCacheResponse) {
            res.status(200);
            res.send({ words: nextCacheResponse });
        } else {
            let word = "";
            let resultantArray = [];
            gettingJSON()
                .then((data) => {
                    let body = JSON.parse(data);
                    for (let i = 0; i < word1.length - 1; i++) {
                        for (let j = word2.length - 1; j >= 1; j--) {
                            word = word1.substring(0, i + 1) + word2.substring(j, word2.length);
                            Object.keys(body).filter((f) => f == word).length > 0 ?
                                resultantArray.push(Object.keys(body).filter((f) => f == word)[0]) :
                                null;
                        }
                    }
                    if (resultantArray.length > 0) {
                        cache.put(`${word1},${word2}`, resultantArray, 1000 * 60);
                        res.status(200);
                        res.send({ words: resultantArray });
                    } else {
                        res.status(404);
                        res.send("no words found");
                    }
                })
                .catch((err) => {
                    console.log("Error", err);
                    res.send(err);
                });
        }
    } catch (e) {
        res.send("Error", e);
    }
});