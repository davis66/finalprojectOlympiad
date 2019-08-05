//router file 

let express = require('express')
let router = express.Router()
const MongoClient = require('mongodb').MongoClient;
const url = require('../config/config').simpleURI;;
const formidable = require('formidable')
const excelToJson = require('convert-excel-to-json');
const logger = require("../config/config").logger;


var uploadedFile;







// Create a new customer

router.post('/updateSubjectSelected', (req, res) => {

    new formidable.IncomingForm().parse(req)



        .on('field', (name, field) => {                  //to parse field data ..to be further used to pass filter options 
            // console.log('Field', name, "'" + field + "'")
        })


        .on('file', (name, file) => {
            logger.info(`Uploaded file: ${file.name}`)
            // var fileName= file.name;

            uploadedFile = file;
        })
        .on('aborted', () => {
            logger.error('Request aborted by the user')
        })
        .on('error', (err) => {
            logger.error('Error', err)
            throw err
        })
        .on('end', () => {
            // console.log(uploadedFile);
            //to check if the files uploaded is xlsx if not it doesnt process further 


            var seconds = new Date().getTime() / 1000;

            var indexOfDot = uploadedFile.name.indexOf(".");
            if (uploadedFile.name.substring(indexOfDot + 1) !== "xlsx") {
                logger.info("the file is not .xlsx format");
                return res.status(400).send('the file uploaded is not a .xlsx');
            }
            /////////////////////////////////////////////////////////////




            excelData = excelToJson({   //excelData is the required json data 
                sourceFile: uploadedFile.path,
                header: {
                    rows: 1
                },
                // Mapping columns to keys
                columnToKey: {
                    '*': '{{columnHeader}}'
                }
            });






            //to get data which is in the form of sheets we need the keys  
            let sheets = Object.keys(excelData)
            logger.info(`${sheets}, sheets in the excel sheet`);  // gives sheetes array 

            //ARRAY OF OBJECTS //this piece of code adds the required data
            for (dataFromSheets of sheets) {
                // console.log(dataFromSheets)
                for (individualObjects of excelData[dataFromSheets]) {
                    // console.log(individualObjects)


                    if (individualObjects["NAME OF STUDENTS"] && individualObjects["SCHOOL NAME"] && individualObjects["CLASS"] && individualObjects["DISTRICT"] && individualObjects["CITY"] && individualObjects["STATE"] && individualObjects["SEAT NO"]) {


                        if (!(individualObjects["SEC"])) {  //assigning null when upload so that the SEC column doesnt disappear 
                            individualObjects["SEC"] = null;
                        }

                        if (!(isNaN(individualObjects["CLASS"]))) {
                            individualObjects["CLASS"] = parseInt(individualObjects["CLASS"]);
                        }

                        if (!(individualObjects["_id"])) {
                            individualObjects["_id"] = individualObjects["SEAT NO"];
                        }





                        // console.log(individualObjects["_id"].substring(0,2));
                    }
                    else {
                        // console.log(individualObjects, "3");
                    }
                    for (individualObjectKey in individualObjects) {
                        if (individualObjectKey.indexOf("MARKS") !== -1) {
                            individualObjectKeyToCheck = individualObjectKey.substring(0, ((individualObjectKey.indexOf("MARKS")) - 1));

                        }
                        else {
                            individualObjectKeyToCheck = individualObjectKey.substring(0);


                        }

                        if (["_id", "NAME OF STUDENTS", "SCHOOL NAME", "CLASS", "STATE", "DISTRICT", "CITY", "SEC", "GK", "MATHS", "SCIENCE"].indexOf(individualObjectKeyToCheck) === -1) {
                            // if (["_id", "NAME OF STUDENTS", "SCHOOL NAME", "CLASS", "STATE", "DISTRICT", "CITY", "SEC"].indexOf(individualObjectKey) === -1 && individualObjectKey.indexof("MARKS") === -1 ) {
                            // console.log("key value deleted ", individualObjectKey, individualObjects[individualObjectKey])
                            delete individualObjects[individualObjectKey];  //will surely delete seat number as we do not require seat number but _id

                        }
                    }
                }
            }


            MongoClient.connect(url, { useNewUrlParser: true }, (err, db) => {
                if (err) throw err;

                var dbo = db.db("students");
                let rejected = 0;


                for (sheet of sheets) {


                    for (document of excelData[sheet]) {
                        // console.log(document);
                        if (document["NAME OF STUDENTS"] && document["SCHOOL NAME"] && document["CLASS"] && document["DISTRICT"] && document["CITY"] && document["STATE"] && document["_id"]) {


                            let finder = { "_id": document["_id"] }
                            delete document["_id"];
                            // console.log(finder);
                            // console.log(document);



                            dbo.collection("details")

                                .updateOne(
                                    finder,
                                    { $set: document },
                                    function (err, data) {
                                        if (err) {
                                            console.log(err);
                                        } else {
                                            // console.log("object uploaded");

                                            // console.log(document)
                                        }
                                    }
                                )



                        }
                        else {
                            rejected++;
                        }
                    }
                }
                
                console.log(uploadedFile.path);
                if (rejected > 0) {
                    logger.info(`documents deleted ${rejected}`);
                }

                var lastSeconds = new Date().getTime() / 1000;
                logger.info(`time taken ${lastSeconds - seconds}`);
                logger.info("");
                db.close();

            })



            // console.log(excelData);
            res.send('uploaded');
            res.end()
        })




})



module.exports = router

//to extract data to xlsx format




