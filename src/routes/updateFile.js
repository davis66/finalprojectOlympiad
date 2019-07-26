
let express = require('express')
let router = express.Router()
const MongoClient = require('mongodb').MongoClient;
const url = "mongodb+srv://davis66:Dddarren9@dave-ggjzh.mongodb.net/new";
const formidable = require('formidable')
const xlsx = require('tfk-json-to-xlsx')
const path = require('path');
var DOWNLOAD_DIR = path.join(process.env.HOME || process.env.USERPROFILE, 'downloads/');
let defaultrequiredDataColumns = ["SEAT NO", "NAME OF STUDENTS", "CLASS","SEC", "SCHOOL NAME", "CITY", "DISTRICT", "STATE"]





router.get('/getUpdateFile', (req, res) => {
    var parameterObject = {};
    new formidable.IncomingForm().parse(req)
        .on('field', (name, field) => {                  //to parse field data ..to be further used to pass filter options 
            console.log('Field', name, ":", field, typeof (field))
            name = name.toUpperCase();
            field = field.toUpperCase().trim();
            console.log("'" + field + "'");
            if (field) {
                if (!(isNaN(field))) {
                    field = parseInt(field)
                }
                parameterObject[name] = field;
            }
        })
        .on('file', (name, file) => {
            console.log('Uploaded file', name, file.name)
        })
        .on('aborted', () => {
            console.error('Request aborted by the user')
        })
        .on('error', (err) => {
            console.error('Error', err)
            throw err
        })
        .on('end', () => { 
            let resultToDisplay = [];

            for (iterator = 1; iterator <= 3; iterator++) {
                if (parameterObject[`SUBJECT${iterator}`] && parameterObject[`MARKS${iterator}`]) {
                    parameterObject[`${parameterObject[`SUBJECT${iterator}`]} MARKS (${parameterObject[`MARKS${iterator}`]})`] = null; //change null to "-" to update marks  //this file is to slect subject 
                    delete parameterObject[`SUBJECT${iterator}`];
                    delete parameterObject[`MARKS${iterator}`];
                }
            }
            console.log(parameterObject);
            let requiredDataColumns = Object.keys(parameterObject);



            requiredDataColumns = requiredDataColumns.concat(defaultrequiredDataColumns.filter(function (item) {
                return requiredDataColumns.indexOf(item) < 0;
            }));
            console.log(requiredDataColumns);




            MongoClient.connect(url, { useNewUrlParser: true }, (err, db) => {
                if (err) throw err;

                var dbo = db.db("new");

                dbo.collection("customers").find(parameterObject).toArray(function (err, result) {   //GETS ALL DATA WITH RESPECT TO PARAMETERES SELECTED OR ELSE IT GIVES ALL THE DATA OF THE UNSELECTED PARAMETERS
                    if (err) throw err;
                    for (individualDocument of result) {
                        individualDocument["SEAT NO"] = individualDocument["_id"];
                        
                        let finalResultDocument = {                                             //FORMATTING DATA TO ORDER TO PRINT IN EXCEL
                            "SEAT NO": `${individualDocument["SEAT NO"]}`,
                            "NAME OF STUDENTS":`${individualDocument["NAME OF STUDENTS"]}`,
                            "CLASS":`${individualDocument["CLASS"]}`,
                            "SEC":`${individualDocument["SEC"]}`,
                            "SCHOOL NAME":`${individualDocument["SCHOOL NAME"]}`,
                            "CITY":`${individualDocument["CITY"]}`,
                            "DISTRICT":`${individualDocument["DISTRICT"]}`,
                            "STATE":`${individualDocument["STATE"]}`

                        };
                        
                        for (informationKeys in individualDocument) {
                            if (requiredDataColumns.indexOf(informationKeys) === -1) {
                                delete individualDocument[informationKeys];                 //deletes teh data which is not required especially done for other subjects marks data
                                // console.log(deleted);
                                continue;
                            }
                            if(informationKeys.indexOf("MARKS")!== -1)
                            {
                                finalResultDocument[informationKeys] = individualDocument[informationKeys];
                            }
                        }
                        

                        resultToDisplay.push(finalResultDocument);

                    }


                    xlsx.write(`${DOWNLOAD_DIR}/return.xlsx`, resultToDisplay, function (error) {
                        // Error handling here
                        if (error) {
                            console.error(error)
                        }
                        else {
                            console.log("doc ready" + DOWNLOAD_DIR);
                        }
                    })
                })
            })
            res.end()
        })

})


module.exports = router
