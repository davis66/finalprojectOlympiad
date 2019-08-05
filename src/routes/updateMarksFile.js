
let express = require('express')
let router = express.Router()
const MongoClient = require('mongodb').MongoClient;
const url = require('../config/config').simpleURI;;
const formidable = require('formidable')
const xlsx = require('tfk-json-to-xlsx')
const path = require('path');
var DOWNLOAD_DIR = path.join(process.env.HOME || process.env.USERPROFILE, 'downloads/');
let defaultrequiredDataColumns = ["SEAT NO", "NAME OF STUDENTS", "CLASS", "SEC", "SCHOOL NAME", "CITY", "DISTRICT", "STATE"]
const logger = require("../config/config").logger;




router.get('/getUpdateMarksFile', (req, res) => {
    var parameterObject = {};
    var iteratorLoop = 0;
    let fieldAndNameArray = [];


    new formidable.IncomingForm().parse(req)
        .on('field', (name, field) => {                  //to parse field data ..to be further used to pass filter options 
            // console.log('Field', name, ":", field, typeof (field))
            name = name.toUpperCase();
            field = field.toUpperCase().trim();
            fieldAndNameArray.push([name, field]);

            if (name.indexOf("SUBJECT") !== -1 || name.indexOf("MARKS") !== -1) {
                iteratorLoop++;
            }


            if (field) {             //process only if the field is not empty
                if (!(isNaN(field))) {
                    field = parseInt(field)
                }
                parameterObject[name] = field;

            }



        })
        .on('file', (name, file) => {
            logger.info(`Uploaded file: ${file.name}`)
        })
        .on('aborted', () => {
            loggeer.error('Request aborted by the user')
        })
        .on('error', (err) => {
            logger.error('Error', err)
            throw err
        })
        .on('end', () => {
            let resultToDisplay = [];
            var seconds = new Date().getTime() / 1000;

            logger.info(fieldAndNameArray);
            iteratorLoop = Math.round(iteratorLoop / 2);


            for (iterator = 1; iterator <= iteratorLoop; iterator++) {         //iteration can be incremented to accomodate more subject mark parameter  //iteration to be automized
                if (parameterObject[`SUBJECT${iterator}`] && parameterObject[`MARKS${iterator}`]) {  //if exists

                    parameterObject[`${parameterObject[`SUBJECT${iterator}`]} MARKS (${parameterObject[`MARKS${iterator}`]})`] = "-"; //this file is to slect subject 
                    // updateParameter[`${parameterObject[`SUBJECT${iterator}`]} MARKS (${parameterObject[`MARKS${iterator}`]})`] = "NA";
                    delete parameterObject[`SUBJECT${iterator}`];
                    delete parameterObject[`MARKS${iterator}`];
                }
                else {                                                          //problem secnario of either marks or marks absent solved 
                    delete parameterObject[`SUBJECT${iterator}`];
                    delete parameterObject[`MARKS${iterator}`];
                }
            }

            if (parameterObject["SEAT NO"]) {
                parameterObject["_id"] = parameterObject["SEAT NO"];
                delete parameterObject["SEAT NO"];
            }


            console.log(parameterObject, "parameterObject"); // to be used as a parameter to update marks (so module 3 - update marks file)// although here it is used to be aded in required data array





            let requiredDataColumns = Object.keys(parameterObject);
            // console.log(requiredDataColumns);



            requiredDataColumns = requiredDataColumns.concat(defaultrequiredDataColumns.filter(function (item) {
                return requiredDataColumns.indexOf(item) < 0;
            }));
            console.log(requiredDataColumns);




            MongoClient.connect(url, { useNewUrlParser: true }, (err, db) => {
                if (err) throw err;

                var dbo = db.db("new");

                dbo.collection("customers").find(parameterObject).toArray(function (err, result) {   //GETS ALL DATA WITH RESPECT TO PARAMETERES SELECTED OR ELSE IT GIVES ALL THE DATA IF NOT MENTIONED 
                    if (err) throw err;

                    // console.log(result,"this");
                    for (individualDocument of result) {
                        // console.log(individualDocument,"that");



                        individualDocument["SEAT NO"] = individualDocument["_id"];   //_id will be deleted automatically 
                        delete individualDocument["_id"];

                        let finalResultDocument = {                                             //FORMATTING DATA TO ORDER TO PRINT IN EXCEL
                            "SEAT NO": `${individualDocument["SEAT NO"]}`,
                            "NAME OF STUDENTS": `${individualDocument["NAME OF STUDENTS"]}`,
                            "CLASS": parseInt(`${individualDocument["CLASS"]}`),
                            "SEC": `${individualDocument["SEC"]}`,
                            "SCHOOL NAME": `${individualDocument["SCHOOL NAME"]}`,
                            "CITY": `${individualDocument["CITY"]}`,
                            "DISTRICT": `${individualDocument["DISTRICT"]}`,
                            "STATE": `${individualDocument["STATE"]}`

                        };


                        for (informationKeys in individualDocument) {  //individualdocuments of result

                            if (requiredDataColumns.indexOf(informationKeys) === -1 && iteratorLoop !== 0) {

                                delete individualDocument[informationKeys];                 //deletes thw data which is not required especially done for other subjects marks data if selected//marks get deleted here 
                                console.log("deleted");
                            }
                            else if (!(finalResultDocument[informationKeys])) {
                                finalResultDocument[informationKeys] = individualDocument[informationKeys];
                            }


                        }


                        resultToDisplay.push(finalResultDocument);

                    }
                    // console.log(resultToDisplay);


                    xlsx.write(`${DOWNLOAD_DIR}/updateMarks.xlsx`, resultToDisplay, function (error) {
                        // Error handling here
                        if (error) {
                            logger.error(error)
                        }
                        else {
                            console.log("doc ready" + DOWNLOAD_DIR);
                            var lastSeconds = new Date().getTime() / 1000;
                            logger.info(`time taken ${lastSeconds - seconds}`);
                            logger.info("");
                        }
                    })

                })
            })
            res.end()
        })

})


module.exports = router
