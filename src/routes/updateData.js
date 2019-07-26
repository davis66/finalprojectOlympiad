//router file 

let express = require('express')
let router = express.Router()
const MongoClient = require('mongodb').MongoClient;
const url = "mongodb+srv://davis66:Dddarren9@dave-ggjzh.mongodb.net/new";
const formidable = require('formidable')
const excelToJson = require('convert-excel-to-json');

var uploadedFile;







// Create a new customer

router.post('/post', (req, res) => {

    new formidable.IncomingForm().parse(req)



        .on('field', (name, field) => {                  //to parse field data ..to be further used to pass filter options 
            console.log('Field', name, "'" + field + "'")
        })


        .on('file', (name, file) => {
            console.log('Uploaded file', name, file.name)
            // var fileName= file.name;

            uploadedFile = file;
        })
        .on('aborted', () => {
            console.error('Request aborted by the user')
        })
        .on('error', (err) => {
            console.error('Error', err)
            throw err
        })
        .on('end', () => {
            console.log(uploadedFile);
            //to check if the files uploaded is xlsx if not it doesnt process further 
            var indexOfDot = uploadedFile.name.indexOf(".");
            if (uploadedFile.name.substring(indexOfDot + 1) !== "xlsx") {
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
            console.log(sheets);  // gives sheetes array 

            //ARRAY OF OBJECTS //this piece of code adds the required data
            for (dataFromSheets of sheets) {
                for (individualObjects of excelData[dataFromSheets]) {
                    if (individualObjects["NAME OF STUDENTS"] && individualObjects["SCHOOL NAME"] && individualObjects["CLASS"] && individualObjects["DISTRICT"] && individualObjects["CITY"] && individualObjects["STATE"]) {
                        if (!(individualObjects["GK MARKS (100)"])) {  //assigning null when upload so that the MARKS column doesnt disappear 
                            individualObjects["GK MARKS (100)"] = null;
                        }
                        if (!(individualObjects["MATHS MARKS (100)"])) {  //assigning null when upload so that the MARKS column doesnt disappear 
                            individualObjects["MATHS MARKS (100)"] = null;
                        }

                        if (!(individualObjects["SCIENCE MARKS (100)"])) {  //assigning null when upload so that the MARKS column doesnt disappear 
                            individualObjects["SCIENCE MARKS (100)"] = null;
                        }

                        if (!(individualObjects["SEC"])) {  //assigning null when upload so that the SEC column doesnt disappear 
                            individualObjects["SEC"] = null;
                        }


                       

                        // console.log(individualObjects["_id"].substring(0,2));
                    }
                    else {
                        console.log(individualObjects, "3");
                    }
                    for (individualObjectKey in individualObjects) {
                        if (individualObjectKey.indexOf("MARKS") !== -1) {
                            individualObjectKeyToCheck = individualObjectKey.substring(0, ((individualObjectKey.indexOf("MARKS")) - 1));
                        }
                        else {
                            individualObjectKeyToCheck = individualObjectKey.substring(0);


                        }

                        if (["_id", "NAME OF STUDENTS", "SCHOOL NAME", "CLASS", "STATE", "DISTRICT", "CITY", "SEC", "GK", "MATHS", "SCIENCE"].indexOf(individualObjectKeyToCheck) === -1) {
                            delete individualObjects[individualObjectKey];
                            console.log("key value deleted ", ["_id", "NAME OF STUDENTS", "SCHOOL NAME", "CLASS", "STATE", "DISTRICT", "CITY", "SEC", "GK", "MATHS", "SCIENCE"].indexOf(individualObjectKeyToCheck), " ", individualObjectKeyToCheck)
                        }
                    }
                }
            }


            MongoClient.connect(url, { useNewUrlParser: true }, (err, db) => {
                if (err) throw err;

                var dbo = db.db("new");

                for (sheet of sheets) {

                    for (document of excelData[sheet]) {
                        // console.log(document);
                        if (document["NAME OF STUDENTS"] && document["SCHOOL NAME"] && document["CLASS"] && document["DISTRICT"] && document["CITY"] && document["STATE"] && document["_id"]) {

                            // console.log(finder);
                            dbo.collection("customers")

                            .updateOne(
                                finder,
                                { $set: document },
                                { upsert: true, safe: false },
                                function (err, data) {
                                  if (err) {
                                    console.log(err);
                                  } else {
                                    console.log("object uploaded");
                                  }
                                }
                              )

                        }
                    }
                }
                console.log(uploadedFile.path);

                db.close();

            })



            // console.log(excelData);
            res.send('uploaded');
            res.end()
        })




})



module.exports = router

//to extract data to xlsx format




