//router file 

let express = require('express')
let router = express.Router()
const MongoClient = require('mongodb').MongoClient;
const url = require('../config/config').simpleURI;;
const formidable = require('formidable')
const excelToJson = require('convert-excel-to-json');
const logger = require("../config/config").logger


var uploadedFile;







// Create a new customer

router.post('/post', (req, res) => {

  new formidable.IncomingForm().parse(req)



    .on('field', (name, field) => {                  //to parse field data ..to be further used to pass filter options //not used because this module will only except file 
     
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
      var seconds = new Date().getTime() / 1000;
      
      // console.log(uploadedFile);
      //to check if the files uploaded is xlsx if not it doesnt process further 
      var indexOfDot = uploadedFile.name.indexOf(".");
      if (uploadedFile.name.substring(indexOfDot + 1) !== "xlsx") {
        logger.info("the file uploaded is not a .xlsx");
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


      //this module creates a object that creates a counter for individual district that is existing in the database to increment the seat number when the student data is updated 
      MongoClient.connect(url, { useNewUrlParser: true }, function (err, db) {
        if (err) throw err;

        let dbo = db.db("students");


        dbo.collection("details").find({}).toArray(function (err, result) { // can add present year here 
          if (err) throw err;

          var locationObject = {};
          for (document of result) {
            if (!(locationObject[document.STATE])) {
              locationObject[document.STATE] = { [document.DISTRICT]: { [document.CITY]: { [document.CLASS]: { "count": 1 } } } }
            }
            else if (!(locationObject[document.STATE][document.DISTRICT])) {
              locationObject[document.STATE][document.DISTRICT] = { [document.CITY]: { [document.CLASS]: { "count": 1 } } };
            }
            else if (!(locationObject[document.STATE][document.DISTRICT][document.CITY])) {
              locationObject[document.STATE][document.DISTRICT][document.CITY] = { [document.CLASS]: { "count": 1 } };
            }
            else if (!(locationObject[document.STATE][document.DISTRICT][document.CITY][document.CLASS])) {
              locationObject[document.STATE][document.DISTRICT][document.CITY][document.CLASS] = { "count": 1 };
            }
            else {
              locationObject[document.STATE][document.DISTRICT][document.CITY][document.CLASS]["count"] += 1;
            }
          }
          console.log(JSON.stringify(locationObject,null,3));

          ////////////////////////////////////



          //to get data which is in the form of sheets we need the keys  
          let sheets = Object.keys(excelData)
          logger.info(`[${sheets}] ,excel sheets`);  // gives sheetes array 
          let duplicatecounter = 0;
          let documentcounter = 0;
          let invalidcounter = 0;
          //ARRAY OF OBJECTS //this piece of code adds the required data
          for (dataFromSheets of sheets) {
            
            for (individualObjects of excelData[dataFromSheets]) {
              documentcounter++;
              if (individualObjects["NAME OF STUDENTS"] && individualObjects["SCHOOL NAME"] && individualObjects["CLASS"] && individualObjects["DISTRICT"] && individualObjects["CITY"] && individualObjects["STATE"]) {  //consider nested if for faster execution

                let deleteIndicator = 0;                                                   //to delete if the data has been already enetered TO AVOID DUPLLICATION and alloting one student another seat number // check for better code 
                for (document of result) {
                  if (document["STATE"] === individualObjects["STATE"]) {        //comparing data from database to data from excel sheet
                    if (document["DISTRICT"] === individualObjects["DISTRICT"]) {
                      if (document["CITY"] === individualObjects["CITY"]) {
                        if (document["SCHOOL NAME"] === individualObjects["SCHOOL NAME"]) {
                          if (document["CLASS"] === individualObjects["CLASS"]) {
                            // console.log(individualObjects["CLASS"])
                            if (document["NAME OF STUDENTS"] === individualObjects["NAME OF STUDENTS"]) { // to keep it unique use mothers and fathers name along with the students 

                              // console.log(document["NAME OF STUDENTS"])
                              deleteIndicator = 1;
                            }
                          }
                        }
                      }
                    }
                  }
                }
                if (deleteIndicator == 1) {
                  // console.log(duplicatecounter);
                  duplicatecounter++;
                  delete individualObjects;
                  continue;                      //break loop if individual object has been deleted to avoid error and further proccessing in the loop 
                }




                //not rquired 
                // if (!(individualObjects["GK MARKS (100)"])) {  //assigning null when upload so that the MARKS column doesnt disappear in the database
                //   individualObjects["GK MARKS (100)"] = null;
                // }
                // if (!(individualObjects["MATHS MARKS (100)"])) {  //assigning null when upload so that the MARKS column doesnt disappear in the database
                //   individualObjects["MATHS MARKS (100)"] = null;
                // }

                // if (!(individualObjects["SCIENCE MARKS (100)"])) {  //assigning null when upload so that the MARKS column doesnt disappear in the database
                //   individualObjects["SCIENCE MARKS (100)"] = null;
                // }

                if (!(individualObjects["SEC"])) {  //assigning null when upload so that the SEC column doesnt disappear 
                  individualObjects["SEC"] = null;
                }
                if (individualObjects["SR NO"]) {
                  delete individualObjects["SR NO"]
                }

                if (!(individualObjects["_id"])) {  //condition not really required as _id or seat number havent been assigned and if it has then itll be deleted to process 


                  if (!(locationObject[individualObjects.STATE])) {
                    locationObject[individualObjects.STATE] = { [individualObjects.DISTRICT]: { [individualObjects.CITY]: { [individualObjects.CLASS]: { "count": 1 } } } }
                  }
                  else if (!(locationObject[individualObjects.STATE][individualObjects.DISTRICT])) {
                    locationObject[individualObjects.STATE][individualObjects.DISTRICT] = { [individualObjects.CITY]: { [individualObjects.CLASS]: { "count": 1 } } };
                  }
                  else if (!(locationObject[individualObjects.STATE][individualObjects.DISTRICT][individualObjects.CITY])) {
                    locationObject[individualObjects.STATE][individualObjects.DISTRICT][individualObjects.CITY] = { [individualObjects.CLASS]: { "count": 1 } };
                  }
                  else if (!(locationObject[individualObjects.STATE][individualObjects.DISTRICT][individualObjects.CITY][individualObjects.CLASS])) {
                    locationObject[individualObjects.STATE][individualObjects.DISTRICT][individualObjects.CITY][individualObjects.CLASS] = { "count": 1 };
                  }
                  else {
                    locationObject[individualObjects.STATE][individualObjects.DISTRICT][individualObjects.CITY][individualObjects.CLASS]["count"] += 1;
                  }

                  let statecode = individualObjects["STATE"].substring(0, 2) + individualObjects["STATE"].substring(individualObjects["STATE"].length - 1);
                  let codeCount = locationObject[individualObjects.STATE][individualObjects.DISTRICT][individualObjects.CITY][individualObjects.CLASS]["count"];
                  let pad = "0000000";
                  let codenumber = pad.substring(0, pad.length - codeCount.toString().length) + codeCount;
                  let date = new Date();
                  let year = date.getFullYear()
                  individualObjects["_id"] = statecode + individualObjects["DISTRICT"].substring(0, 1) + individualObjects["CITY"].substring(0, 1) + codenumber + individualObjects["CLASS"] + year.toString().substring(year.toString().length - 2)


                }

                // console.log(individualObjects["_id"].substring(0,2));
              }
              else {
                console.log(individualObjects, "rejected");  //rejected docs
                invalidcounter++;
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
          if (duplicatecounter > 0 || invalidcounter > 0){
            logger.info(`documents deleted , duplicate = ${duplicatecounter}, invalid = ${invalidcounter} out of ${documentcounter}`)
          }


          MongoClient.connect(url, { useNewUrlParser: true }, (err, db) => {
            if (err) throw err;

            var dbo = db.db("students");

            for (sheet of sheets) {

              for (document of excelData[sheet]) {
                // console.log(document);
                if (document["NAME OF STUDENTS"] && document["SCHOOL NAME"] && document["CLASS"] && document["DISTRICT"] && document["CITY"] && document["STATE"] && document["_id"]) {

                  // console.log(finder);
                  dbo.collection("details")

                    .insertOne(document)

                }
              }
            }
            // console.log(uploadedFile.path);
            var lastSeconds = new Date().getTime() / 1000;
            logger.info(`time taken ${lastSeconds-seconds}`);
            logger.info("");
            db.close();

          })

          db.close();
        })
      })

      // console.log(excelData);
      res.send('uploaded');
     
      res.end()
    })




})



module.exports = router

//to extract data to xlsx format




