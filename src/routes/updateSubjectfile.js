
let express = require('express')
let router = express.Router()
const MongoClient = require('mongodb').MongoClient;
const url = require('../config/config').simpleURI;;
const formidable = require('formidable')
const xlsx = require('tfk-json-to-xlsx')
const path = require('path');
var DOWNLOAD_DIR = path.join(process.env.HOME || process.env.USERPROFILE, 'downloads/');
let defaultrequiredDataColumns = ["SEAT NO", "NAME OF STUDENTS", "CLASS", "SEC", "SCHOOL NAME", "CITY", "DISTRICT", "STATE"];
const logger = require("../config/config").logger;






router.get('/getUpdateFile', (req, res) => {
    var parameterObject = {};

    let parameterObjectWithoutSubject = {};

    let fieldAndNameArray = [];

    new formidable.IncomingForm().parse(req)
        .on('field', (name, field) => {                  //to parse field data ..to be further used to pass filter options 
            // console.log('Field', name, ":", field, typeof (field))
            name = name.toUpperCase();
            field = field.toUpperCase().trim();
            fieldAndNameArray.push([name,field]);

            if (field) {             //process only if the field is not empty
                if (!(isNaN(field))) {
                    field = parseInt(field)
                }
                parameterObject[name] = field;


                if (name.indexOf("SUBJECT") === -1 && name.indexOf("MARKS") === -1) {        //problwm scenario whne there is subject but no marks and vice versa 
                    parameterObjectWithoutSubject[name] = field;
                }





            }
        })
        .on('file', (name, file) => {
            logger.info('Uploaded file', name, file.name)
        })
        .on('aborted', () => {
            logger.error('Request aborted by the user')
        })
        .on('error', (err) => {
            logger.error('Error', err)
            throw err
        })
        .on('end', () => {
            let resultToDisplay = [];
            let updateParameter = {};

            logger.info(fieldAndNameArray);

            var seconds = new Date().getTime() / 1000; //timer starts 


            for (iterator = 1; iterator <= 3; iterator++) {
                if (parameterObject[`SUBJECT${iterator}`] && parameterObject[`MARKS${iterator}`]) {

                    parameterObject[`${parameterObject[`SUBJECT${iterator}`]} MARKS (${parameterObject[`MARKS${iterator}`]})`] = "NA"; //change null to "-" to update marks  //this file is to add in the required columns in excel 
                    updateParameter[`${parameterObject[`SUBJECT${iterator}`]} MARKS (${parameterObject[`MARKS${iterator}`]})`] = "NA";
                    delete parameterObject[`SUBJECT${iterator}`];
                    delete parameterObject[`MARKS${iterator}`];
                }
                else {
                    delete parameterObject[`SUBJECT${iterator}`];
                    delete parameterObject[`MARKS${iterator}`];
                }
            }

            if (parameterObjectWithoutSubject["SEAT NO"]) {
                parameterObjectWithoutSubject["_id"] = parameterObjectWithoutSubject["SEAT NO"] ;
                delete parameterObjectWithoutSubject["SEAT NO"] ; 
            }

            logger.info(`${JSON.stringify(parameterObjectWithoutSubject)} , parameterobjectwithoutsubject`); // used to pick all the data apart from subject section
           
            logger.info(`${JSON.stringify(updateParameter)}, updateParameter`); // to be used if the subjects selected werent first updated //exclusively for marks //also to add column in excel sheet 




            let requiredDataColumns = Object.keys(parameterObject);
            // console.log(requiredDataColumns);



            requiredDataColumns = requiredDataColumns.concat(defaultrequiredDataColumns.filter(function (item) {
                return requiredDataColumns.indexOf(item) < 0;
            }));
            console.log(requiredDataColumns);




            MongoClient.connect(url, { useNewUrlParser: true }, (err, db) => {
                if (err) throw err;

                var dbo = db.db("students");

                dbo.collection("details").find(parameterObjectWithoutSubject).toArray(function (err, result) {   //GETS ALL DATA WITH RESPECT TO PARAMETERES SELECTED OR ELSE IT GIVES ALL THE DATA IF NOT MENTIONED 
                    if (err) throw err;
                    for (individualDocument of result) {



                        individualDocument["SEAT NO"] = individualDocument["_id"];

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
                        for (eachMarksParameter in updateParameter) {                                        // to add update parameters which will be null 
                            finalResultDocument[eachMarksParameter] = updateParameter[eachMarksParameter];
                        }

                        for (informationKeys in individualDocument) {  //individualdocuments of result
                            if (requiredDataColumns.indexOf(informationKeys) === -1 && Object.keys(updateParameter).length != 0) {
                                delete individualDocument[informationKeys];                 //deletes thw data which is not required especially done for other subjects marks data if selected
                                // console.log("deleted",informationKeys);
                                continue;
                            }

                            if (informationKeys.indexOf("MARKS") !== -1) {
                                finalResultDocument[informationKeys] = "-"; // subjects which are already selected so that i could be reminded if changes needs to be made
                            }



                        }


                        resultToDisplay.push(finalResultDocument);

                    }



                    xlsx.write(`${DOWNLOAD_DIR}/updateSubjects.xlsx`, resultToDisplay, function (error) {
                        // Error handling here
                        if (error) {
                            logger.error(error);
                        }
                        else {
                            console.log("doc ready" + DOWNLOAD_DIR);
                            logger.info("doc ready" + DOWNLOAD_DIR);
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
