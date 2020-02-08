const express = require('express');
const bodyParser = require('body-parser');
var app = require('express')();
var cors = require('cors');
var dateFormat = require('dateformat');
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var ObjectId = require('mongodb').ObjectID;
var url = "mongodb://localhost:27017/";
var dateFormat = require('dateformat');
var moment = require('moment');
app.use(bodyParser.urlencoded({
    extended: true
}))
app.use(bodyParser.json());
var TC,TS,Tt;
var min = 16;
var max = 30;

function headerSet(error, res, result) {
    if (error) throw error;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers,X-Access-Token,XKey,Authorization');
    res.send(result);
}

function errorHandle(err) {
    if (err) throw err;
}

function weekBefore(req, res, isLogic) {
    MongoClient.connect(url, function(err, db) {
        errorHandle(err);

        var dbo = db.db("temp");
        dbo.collection("temp").findOne({
            "inputData.dataSource": req.body.dataSource
        }, function(error, result) {
            errorHandle(error);
            if(result !=null){
            var filterSource = result.inputData.find(function(data) {
                return (data.dataSource == req.body.dataSource)
            });
            if (filterSource != null) {

              
                var usaTime = new Date().toLocaleString("en-US", {
                    timeZone: "America/New_York"
                });
                var date = new Date(usaTime);
                date.setDate(date.getDate() - 7);
                var weekBefore = dateFormat(date, "yyyy-mm-dd HH:MM:ss");

                var current = date;
                var maxDate = new Date(current);
                maxDate.setMinutes(current.getMinutes() + filterSource.inputcommand.timeInterval / 60000);

                var minDate = new Date(current);
                minDate.setMinutes(current.getMinutes() - filterSource.inputcommand.timeInterval / 60000);
                var closest = filterSource.readingTemperature.reduce(function(prev, curr) {
                    return (Math.abs(new Date(curr.createtime) - new Date(weekBefore)) < Math.abs(new Date(prev.createtime) - new Date(weekBefore)) ? curr : prev);

                });
                if(closest !=null && minDate<new Date(closest.createtime) && new Date(closest.createtime) < maxDate ){
                
                headerSet(error, res, closest);
                }else{


                    var usaTime1 = new Date().toLocaleString("en-US", {
                        timeZone: "America/New_York"
                    });
                    var date1 = new Date(usaTime1);
                    var weekBefore1 = dateFormat(date1, "yyyy-mm-dd HH:MM:ss");
    
                    var current1 = date1;
                    var maxDate1 = new Date(current1);
                    maxDate1.setMinutes(current1.getMinutes() + filterSource.inputcommand.timeInterval / 60000);
    
                    var minDate1 = new Date(current);
                    minDate1.setMinutes(current1.getMinutes() - filterSource.inputcommand.timeInterval / 60000);
                    var closest1 = filterSource.readingTemperature.reduce(function(prev, curr) {
                        return (Math.abs(new Date(curr.createtime) - new Date(weekBefore1)) < Math.abs(new Date(prev.createtime) - new Date(weekBefore1)) ? curr : prev);
    
                    });
                    headerSet(error, res, closest);
            }
                
            } else {
                var dataRs = {
                    responsecode: 200,
                    response: "data Not Found"
                }
                return headerSet(error, res, dataRs);
            }
            }else{
                var dataRs = {
                    responsecode: 200,
                    response: "data Not Found"
                }
                return headerSet(error, res, dataRs);
            }

        });
    });
}

app.get('/', (req, res) => {
    // res.sendfile('index.html');
    MongoClient.connect(url, function(err, db) {
        errorHandle(err);
        var dbo = db.db("temp");
        dbo.collection("temp").findOne({}, function(error, result) {
            headerSet(error, res, result);
        });
    });
});

app.post('/sensedData', (req, res) => {
    MongoClient.connect(url, function(err, db) {
        errorHandle(err);
        var dbo = db.db("temp");
        dbo.collection("temp").findOne({}, function(error, result) {
            errorHandle(error);
            var filterSource = result.inputData.find(function(data) {
                return (data.dataSource == req.body.dataSource)
            });
            if (filterSource != null) {
                var usaTime = new Date().toLocaleString("en-US", {
                    timeZone: "America/New_York"
                });
                var date = new Date(usaTime);
                var current = date;
                var maxDate = new Date(current);
                maxDate.setMinutes(current.getMinutes() + filterSource.inputcommand.timeInterval / 60000);

                var minDate = new Date(current);
                minDate.setMinutes(current.getMinutes() - filterSource.inputcommand.timeInterval / 60000);
                var closest = filterSource.readingTemperature.reduce(function(prev, curr) {
                    return (Math.abs(new Date(curr.createtime) - new Date(current)) < Math.abs(new Date(prev.createtime) - new Date(current)) ? curr : prev);
                });

                headerSet(error, res, closest);

            } else {
                var data = {
                    "responseCode": "200",
                    "responseData": "Data not found"
                }
                headerSet(error, res, data);
            }
        });
    });
});
function comfy(req){
    //As per flow chart
    TC = TS -1;
    if(TC == TS){
        Tt = max;
        if(TS ==TC+1){
            req.body.temperature = Tt;
            return req;
        }else{
            hot(req);
        }
    }else{
        cold(req)
    }
}
function hot(req){
    //As per flow chart
    if(TC == TS){
        TC = TS -2;
        Tt = min;
        if(TC == TS){
            Tt = max;
            if(TS == (TC+1)){
                req.body.temperature = Tt;
                return  req;
            }else{
                hot(req);
            }
        }else{
            cold(req);
        }
    }else{
        req.body.temperature = Tt;
        return  req;
    }
}
function cold(req){
    //As per flow chart
    TC = TS+1;
    Tt = max;
    if(TS==TC){
        if(TS = TC+1){
            Tt=min;
            if(TS==TC){
                req.body.temperature = Tt;
                return req;
            }else{
                cold(req);
            }
        }else{
            hot(req);
        }
       
    }else{
        hot(req);
    }
}
function noAction(req){
    //As per flow chart
    if(TS==TC){
        Tt=max;
        if(TS==TC+1){
        req.body.temperature = Tt;
        return req;
        }else{
            hot(req);
        }
    }else{
        cold(req);
    }
}


app.post('/sensorDetails', (req,res) => {
    var tempJson;
    req.body.temperature = req.body.temperature >max ? min : max ;
    if(req.body !=null && req.body.tc !=null){
    TS = Number(req.body.temperature) ;
    TC = Number(req.body.tc.temperature) ;
    tempJson = req.body.keyInput.keyName == 'Comfy' ? comfy(req):  req.body;
    tempJson = req.body.keyInput.keyName == 'Hot' ? hot(req):  req.body;
    tempJson = req.body.keyInput.keyName == 'Cold' ? cold(req):  req.body;
    tempJson = req.body.keyInput.keyName == 'noAction' ? noAction(req):  req.body;
    req.body = tempJson;
    }
    MongoClient.connect(url, function(error1, db) {
        errorHandle(error1);
        var usaTime = new Date().toLocaleString("en-US", {
            timeZone: "America/New_York"
        });
        var date = new Date(usaTime);
        var dateToday = dateFormat(date, "yyyy-mm-dd HH:MM:ss");
        var fulljson = {
            "result_code": 1,
            "inputData": [{
                "dataSource": req.body.dataSource,
                "readingTemperature": [{
                    "macAddress": req.body.macAddress,
                    "createtime": dateToday,
                    "temperature": Number(req.body.temperature),
                    "temperatureUnit": req.body.temperatureUnit,
                    "dataSourceLocation": req.body.dataSourceLocation,
                    "keyInput": req.body.keyInput
                }],
                "inputcommand": req.body.inputcommand
            }]
        }
        var nodatSource = {
            $addToSet: {
                "inputData": {
                    "dataSource": req.body.dataSource,
                    "readingTemperature": [{
                        "macAddress": req.body.macAddress,
                        "createtime": dateToday,
                        "temperature": Number(req.body.temperature),
                        "temperatureUnit": req.body.temperatureUnit,
                        "dataSourceLocation": req.body.dataSourceLocation,
                        "keyInput": req.body.keyInput
                    }],
                    "inputcommand": req.body.inputcommand
                }
            }
        }
        var dataField = {
            $addToSet: {
                "inputData.$.readingTemperature": {
                    "macAddress": req.body.macAddress,
                    "createtime": dateToday,
                    "temperature": Number(req.body.temperature),
                    "temperatureUnit": req.body.temperatureUnit,
                    "dataSourceLocation": req.body.dataSourceLocation,
                    "keyInput": req.body.keyInput
                }
            }
        }

        var dbo = db.db("temp");
        dbo.collection("temp").findOne({
            inputData: {
                $exists: true,
                $not: {
                    $size: 0
                }
            }
        }, function(error2, response) {
            errorHandle(error2);
            if (response != null) {
                dbo.collection("temp").findOne({
                    "inputData.dataSource": req.body.dataSource
                }, function(error3, result) {
                    errorHandle(error3);
                    if (result != null) {
                        dbo.collection("temp").updateMany({
                                "inputData.dataSource": req.body.dataSource
                            },
                            dataField,
                            function(error4, result1) {
                                errorHandle(error4);
                                var tempLabel = req.body.temperature == 16 ? 'MIN or AC ON ' : 'Max or AC Off'
                               
                                var sendData = {
                                    "responsecode": 200,
                                    "data": "Data Stored SucessFully",
                                    "ACcomment" : tempLabel
                                }
                                headerSet(error4, res, sendData);

                            });
                    } else {
                        dbo.collection("temp").updateMany({
                                inputData: {
                                    $exists: true,
                                    $not: {
                                        $size: 0
                                    }
                                }
                            },
                            nodatSource,
                            function(error5, result2) {
                                errorHandle(error5);
                                var tempLabel = req.body.temperature == 16 ? 'MIN or AC ON ' : 'Max or AC Off'
                                var sendData = {
                                    "responsecode": 200,
                                    "data": "Data Stored SucessFully",
                                    "ACcomment" : tempLabel
                                }
                                headerSet(error5, res, sendData);
                            });

                    }
                })
            } else {
                dbo.collection("temp").insertOne(fulljson, function(error6, newEntryRes) {
                    errorHandle(error6);
                    var sendData = {
                        "responsecode": 200,
                        "data": "Data Stored SucessFully",
                        "ACcomment" : ''

                    }
                    headerSet(error6, res, newEntryRes);

                });
            }

        })


    });
});
app.post('/today', (req, res) => {
    console.log(req.body.dataSource);
    weekBefore(req, res)

});
app.post('/uirequest', (req, res) => {
    console.log(req.body);
    var date = new Date();
    var weekBefore = dateFormat(date, "yyyy-mm-dd HH:mm:ss");
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.send('Request sent');
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("temp");
        dbo.collection("temp").findOne({}, function(err, result) {
            console.log(result);
        });

    });

});




app.listen(8080, () => {
    console.log("Server is listening on port 8080");
});