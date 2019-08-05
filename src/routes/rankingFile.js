
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



router.get('/rankFile', (req, res) => {
    var parameterObject = {};
    var iteratorLoop = 0;
    let fieldAndNameArray = [];


    new formidable.IncomingForm().parse(req)
        .on('field', (name, field) => {                  //to parse field data ..to be further used to pass filter options 
            // console.log('Field', name, ":", field, typeof (field))
            name = name.toUpperCase();
            field = field.toUpperCase().trim();


            if (name.indexOf("SUBJECT") !== -1 || name.indexOf("MARKS") !== -1) {
                iteratorLoop++;
                // console.log(name)
            }


            if (field) {             //process only if the field is not empty
                if (!(isNaN(field))) {
                    field = parseInt(field)
                }
                parameterObject[name] = field;
                fieldAndNameArray.push([name, field]);
            }



        })
        .on('file', (name, file) => {
            // console.log('Uploaded file', name, file.name)
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
            var seconds = new Date().getTime() / 1000;
            logger.info(fieldAndNameArray);
            // console.log(iteratorLoop);
            iteratorLoop = Math.round(iteratorLoop / 2);
            // console.log(iteratorLoop)




            if (parameterObject["SEAT NO"]) {
                parameterObject["_id"] = parameterObject["SEAT NO"];
                delete parameterObject["SEAT NO"];
            }


            // console.log(parameterObject, "parameterObject"); // to be used as a parameter to update marks (so module 3 - update marks file)// although here it is used to be aded in required data array





            let requiredDataColumns = [];
            let rankingIn = [];
            // console.log(requiredDataColumns);
            for (iterator = 1; iterator <= iteratorLoop; iterator++) {         //iteration can be incremented to accomodate more subject mark parameter  //iteration to be automized
                if (parameterObject[`SUBJECT${iterator}`] && parameterObject[`MARKS${iterator}`]) {  //if exists

                    requiredDataColumns.push(`${parameterObject[`SUBJECT${iterator}`]} MARKS (${parameterObject[`MARKS${iterator}`]})`) //this file is to slect subject 
                    rankingIn.push(parameterObject[`SUBJECT${iterator}`]);



                    // updateParameter[`${parameterObject[`SUBJECT${iterator}`]} MARKS (${parameterObject[`MARKS${iterator}`]})`] = "NA";
                    delete parameterObject[`SUBJECT${iterator}`];
                    delete parameterObject[`MARKS${iterator}`];
                }
                else {                                                          //problem secnario of either marks or marks absent solved 
                    delete parameterObject[`SUBJECT${iterator}`];
                    delete parameterObject[`MARKS${iterator}`];
                }
            }

            var combine = function (a) {
                var fn = function (n, src, got, all) {
                    if (n == 0) {
                        if (got.length > 0) {
                            all[all.length] = got;
                        }
                        return;
                    }
                    for (var j = 0; j < src.length; j++) {
                        fn(n - 1, src.slice(j + 1), got.concat([src[j]]), all);
                    }
                    return;
                }
                var all = [];
                for (var i = 1; i < a.length; i++) {
                    fn(i, a, [], all);
                }
                all.push(a);
                return all;
            }

            var subsets = combine(rankingIn);
            subsets.sort(function (a, b) {
                let sumOfa = 0; // A variable to store the length
                let sumOfb = 0;
                for (let i = 0; i < a.length; i++) {
                    sumOfa += a[i].length; // add length of each String
                }
                for (let i = 0; i < b.length; i++) {
                    sumOfb += b[i].length; // add length of each String
                }
                return sumOfb - sumOfa;
            });
            // console.log(subsets);


            requiredDataColumns = requiredDataColumns.concat(Object.keys(parameterObject).filter(function (item) {
                return requiredDataColumns.indexOf(item) < 0;
            }))

            requiredDataColumns = requiredDataColumns.concat(defaultrequiredDataColumns.filter(function (item) {
                return requiredDataColumns.indexOf(item) < 0;
            }));
            // console.log(requiredDataColumns);
            // console.log(rankingIn, "rankingIn");



            MongoClient.connect(url, { useNewUrlParser: true }, (err, db) => {
                if (err) throw err;

                var dbo = db.db("students");

                dbo.collection("ranks").find(parameterObject).toArray(function (err, result) {   //GETS ALL DATA WITH RESPECT TO PARAMETERES SELECTED OR ELSE IT GIVES ALL THE DATA IF NOT MENTIONED 
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
                        var marksavailable = true;

                        for (informationKeys in individualDocument) {  //individualdocuments of result
                            var valid = false;
                            
                            if (informationKeys.indexOf("ranking in") !== -1) {
                                for (set of subsets) {
                                    // console.log(set);

                                    let setLength = 0;
                                    for (var i = 0; i < set.length; i++) {
                                        if (informationKeys.indexOf(set[i]) !== -1) {
                                            setLength = setLength + set[i].length;
                                            valid = true;
                                        } else {
                                            valid = false;
                                            break;
                                        }
                                    }
                                    // console.log(setLength, "length");
                                    if (valid === true) {  //if arrayPassed is true after the previous loop it means this loop is valid 

                                        if (!((informationKeys.substring(0, (informationKeys.indexOf("(")))).length <= (12 + 5 * (i - 1) + setLength))) {
                                            valid = false;
                                        }

                                        // console.log(valid);
                                        break;
                                    }
                                    // console.log(valid);


                                }
                            }



                            if ((requiredDataColumns.indexOf(informationKeys) === -1 && !valid) && iteratorLoop !== 0) {

                                delete individualDocument[informationKeys];                 //deletes the data which is not required especially done for other subjects marks data if selected//marks get deleted here 
                                // console.log("deleted",informationKeys);
                            }
                            else if (!(finalResultDocument[informationKeys])) {
                                finalResultDocument[informationKeys] = individualDocument[informationKeys];
                                if (informationKeys.indexOf("MARKS") !== -1) {
                                    if (!individualDocument[informationKeys]) {
                                        marksavailable = false;
                                    }
                                }

                            }
                            

                        }

                        if (!marksavailable) {
                            continue;
                        }
                        else{
                            resultToDisplay.push(finalResultDocument);
                        }

                    }
                    // console.log(resultToDisplay);


                    xlsx.write(`${DOWNLOAD_DIR}/rank.xlsx`, resultToDisplay, function (error) {
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
            // winston.logger.info("rankfile");
            res.end()
        })

})


module.exports = router
