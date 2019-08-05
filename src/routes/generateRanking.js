let express = require('express')
let router = express.Router()
const MongoClient = require('mongodb').MongoClient;
const url = require('../config/config').simpleURI;;
const formidable = require('formidable')

const logger = require("../config/config").logger;


router.post('/generateRanking', (req, res) => {

    new formidable.IncomingForm().parse(req)



        .on('field', (name, field) => {                  //to parse field data ..to be further used to pass filter options 
            // console.log('Field', name, "'" + field + "'")
        })


        .on('file', (name, file) => {
            // loggere.info('Uploaded file', name, file.name)
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





            MongoClient.connect(url, { useNewUrlParser: true }, function (err, db) {
                if (err) throw err;

                let dbo = db.db("students");


                dbo.collection("details").find({}).toArray(function (err, result) { // can add present year here 
                    if (err) throw err;

                    var cityLevelObject = {}; //this will be used to create 4 objects /marks with respect to school,city,district,state//class will be used for national ranking 
                    var districtLevelObject = {}
                    var stateLevelObject = {}
                    var classLevelObject = {}
                    let rankingParameter = [];


                    for (document of result) {

                        // let validForRanking = 0;

                        for (individualField in document) {

                            if (individualField.indexOf("MARKS") !== -1) {
                                if (!(isNaN(document[individualField]))) {
                                    // validForRanking = 1;

                                    if (rankingParameter.indexOf(individualField) === -1) {
                                        rankingParameter.push(individualField);               //marks on the basis of which the individual students will be ranked 
                                    }

                                }
                                else {
                                    // document[individualField] = null;
                                }

                            }

                        }

                        // if (validForRanking === 1) {    // to check if the mark ssare enetered and not just selecetd 

                        if (!(cityLevelObject[document.CLASS])) { //sort bottom level object for each 

                            cityLevelObject[document.CLASS] = { [document.STATE]: { [document.DISTRICT]: { [document.CITY]: { "document": [document] } } } };

                            districtLevelObject[document.CLASS] = { [document.STATE]: { [document.DISTRICT]: { "document": [document] } } };

                            stateLevelObject[document.CLASS] = { [document.STATE]: { "document": [document] } };

                            classLevelObject[document.CLASS] = { "document": [document] };
                        }
                        else if (!(cityLevelObject[document.CLASS][document.STATE])) {

                            cityLevelObject[document.CLASS][document.STATE] = { [document.DISTRICT]: { [document.CITY]: { "document": [document] } } };

                            districtLevelObject[document.CLASS][document.STATE] = { [document.DISTRICT]: { "document": [document] } };

                            stateLevelObject[document.CLASS][document.STATE] = { "document": [document] };

                            classLevelObject[document.CLASS]["document"].push(document);
                        }
                        else if (!(cityLevelObject[document.CLASS][document.STATE][document.DISTRICT])) {

                            cityLevelObject[document.CLASS][document.STATE][document.DISTRICT] = { [document.CITY]: { "document": [document] } };

                            districtLevelObject[document.CLASS][document.STATE][document.DISTRICT] = { "document": [document] };

                            stateLevelObject[document.CLASS][document.STATE]["document"].push(document);

                            classLevelObject[document.CLASS]["document"].push(document);
                        }
                        else if (!(cityLevelObject[document.CLASS][document.STATE][document.DISTRICT][document.CITY])) {

                            cityLevelObject[document.CLASS][document.STATE][document.DISTRICT][document.CITY] = { "document": [document] };

                            districtLevelObject[document.CLASS][document.STATE][document.DISTRICT]["document"].push(document);

                            stateLevelObject[document.CLASS][document.STATE]["document"].push(document);

                            classLevelObject[document.CLASS]["document"].push(document);
                        }
                        else {
                            cityLevelObject[document.CLASS][document.STATE][document.DISTRICT][document.CITY]["document"].push(document);

                            districtLevelObject[document.CLASS][document.STATE][document.DISTRICT]["document"].push(document);

                            stateLevelObject[document.CLASS][document.STATE]["document"].push(document);

                            classLevelObject[document.CLASS]["document"].push(document);
                        }
                        // }
                    }
                    // console.log(JSON.stringify(cityLevelObject, null, 3));
                    // console.log(JSON.stringify(districtLevelObject, null, 3));
                    // console.log(JSON.stringify(stateLevelObject, null, 3));
                    // console.log(JSON.stringify(classLevelObject, null, 3));
                    console.log(rankingParameter);




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

                    var subsets = combine(rankingParameter);
                    console.log(subsets);


                    for (parameter of subsets) {         //individual parameter subsets that will run on loop 

                        let tempToStoreHighestMark = 0;
                        let tempCompare = 0;


                        let rankSubjectCategory = "ranking in ";
                        if (parameter.length !== 1) {                                                                      //this module creates ranking  field for the object  
                            for (individualParameter of parameter) {

                                rankSubjectCategory += `${individualParameter.substring(0, individualParameter.indexOf("MARKS") - 1)} and `;

                            }

                            rankSubjectCategory = rankSubjectCategory.substring(0, rankSubjectCategory.length - 5);

                        }
                        else {
                            rankSubjectCategory += `${parameter[0].substring(0, parameter[0].indexOf("MARKS") - 1)}`;
                        }
                        // console.log(rankSubjectCategory);  //rank key is made //its for column /field in the database




                        for (studentClass in cityLevelObject) {
                            /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

                            let rankKey = rankSubjectCategory + "(AIR)"

                            classLevelObject[studentClass]["document"].sort(function (a, b) {
                                let result = 0;
                                for (individualParameter of parameter) {
                                    if (a[individualParameter] && b[individualParameter]) {
                                        result = result + (b[individualParameter] - a[individualParameter])
                                    }
                                    else {
                                        result = 1;
                                        break;
                                    }
                                }


                                return result;

                            });




                            for (document of classLevelObject[studentClass]["document"]) {
                                let firstRankIndicator = 1;
                                for (individualParameter of parameter) {
                                    if (isNaN(document[individualParameter])) {   // check if the document has all the parameter using this loop if it does, change the indicator and mark it as rank 1
                                        firstRankIndicator = 0;
                                        document[rankKey] = 0; // might not be required but lets see
                                        break;
                                    }
                                    else {
                                        tempToStoreHighestMark = tempToStoreHighestMark + document[individualParameter];
                                    }



                                }
                                if (firstRankIndicator === 1) {  //if indicator is 1 set the rank key to 1 and break ;
                                    document[rankKey] = 1;

                                    break;
                                }

                            }





                            // for (let index = 0, rank = 2; index < classLevelObject[studentClass]["document"].length; index++) {
                            let rank = 1;
                            for (document of classLevelObject[studentClass]["document"]) {
                                // console.log(document,"document");
                                // console.log(rankKey,"rankkey");


                                if (document[rankKey]) {
                                    // console.log("this")
                                    if (document[rankKey] === 0) {       //if rank is 0 delete the key value pair
                                        document[rankKey] = null;
                                    }
                                    continue;               //ends the current loop because rank has been alloted  
                                }
                                let rankIndicator = 1;

                                for (individualParameter of parameter) {
                                    if (isNaN(document[individualParameter])) {   // check if the document has all the parameter using this loop if it doesNT, change the indicator and mark it as rank 0
                                        rankIndicator = 0;
                                        document[rankKey] = null; // might not be required but lets see
                                        break;
                                    }
                                    else {

                                        tempCompare = tempCompare + document[individualParameter];
                                        // console.log(tempCompare,"tempCompare")
                                    }
                                }

                                if (rankIndicator === 1) {
                                    if (tempToStoreHighestMark === tempCompare) {
                                        document[rankKey] = rank;
                                        //first index is array index second index(location index for result array) is key of the object from that index 
                                    }
                                    else {
                                        document[rankKey] = rank + 1;
                                        // console.log("here")
                                        tempToStoreHighestMark = tempCompare;
                                        rank++;

                                    }
                                }
                            }


                            // console.log(classLevelObject[studentClass]["document"], "class");




                            /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


                            for (state in cityLevelObject[studentClass]) {
                                // console.log(stateLevelObject[studentClass][state]["document"],"state");


                                /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

                                let rankKey = rankSubjectCategory + "( STATE RANKING )"

                                stateLevelObject[studentClass][state]["document"].sort(function (a, b) {
                                    let result = 0;
                                    for (individualParameter of parameter) {
                                        if (a[individualParameter] && b[individualParameter]) {
                                            result = result + (b[individualParameter] - a[individualParameter])
                                        }
                                        else {
                                            result = 1;
                                            break;
                                        }
                                    }


                                    return result;

                                });




                                for (document of stateLevelObject[studentClass][state]["document"]) {
                                    let firstRankIndicator = 1;
                                    for (individualParameter of parameter) {
                                        if (isNaN(document[individualParameter])) {   // check if the document has all the parameter using this loop if it does, change the indicator and mark it as rank 1
                                            firstRankIndicator = 0;
                                            document[rankKey] = 0; // might not be required but lets see
                                            break;
                                        }
                                        else {
                                            tempToStoreHighestMark = tempToStoreHighestMark + document[individualParameter];
                                        }



                                    }
                                    if (firstRankIndicator === 1) {  //if indicator is 1 set the rank key to 1 and break ;
                                        document[rankKey] = 1;

                                        break;
                                    }

                                }





                                // for (let index = 0, rank = 2; index < cstateLevelObject[studentClass][state]["document"].length; index++) {
                                let rank = 1;
                                for (document of stateLevelObject[studentClass][state]["document"]) {
                                    // console.log(document,"document");
                                    // console.log(rankKey,"rankkey");


                                    if (document[rankKey]) {
                                        // console.log("this")
                                        if (document[rankKey] === 0) {       //if rank is 0 delete the key value pair
                                            document[rankKey] = null;
                                        }
                                        continue;               //ends the current loop because rank has been alloted  
                                    }
                                    let rankIndicator = 1;

                                    for (individualParameter of parameter) {
                                        if (isNaN(document[individualParameter])) {   // check if the document has all the parameter using this loop if it doesNT, change the indicator and mark it as rank 0
                                            rankIndicator = 0;
                                            document[rankKey] = null; // might not be required but lets see
                                            break;
                                        }
                                        else {

                                            tempCompare = tempCompare + document[individualParameter];
                                            // console.log(tempCompare,"tempCompare")
                                        }
                                    }

                                    if (rankIndicator === 1) {
                                        if (tempToStoreHighestMark === tempCompare) {
                                            document[rankKey] = rank;
                                            //first index is array index second index(location index for result array) is key of the object from that index 
                                        }
                                        else {
                                            document[rankKey] = rank + 1;
                                            // console.log("here")
                                            tempToStoreHighestMark = tempCompare;
                                            rank++;

                                        }
                                    }
                                }


                                // console.log(stateLevelObject[studentClass][state]["document"], "state");
                                // console.log(classLevelObject[studentClass]["document"], "class");




                                /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


                                for (district in cityLevelObject[studentClass][state]) {
                                    // console.log(districtLevelObject[studentClass][state][district]["document"],"district");


                                    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

                                    let rankKey = rankSubjectCategory + "( DISTRICT RANKING )"

                                    districtLevelObject[studentClass][state][district]["document"].sort(function (a, b) {
                                        let result = 0;
                                        for (individualParameter of parameter) {
                                            if (a[individualParameter] && b[individualParameter]) {
                                                result = result + (b[individualParameter] - a[individualParameter])
                                            }
                                            else {
                                                result = 1;
                                                break;
                                            }
                                        }


                                        return result;

                                    });




                                    for (document of districtLevelObject[studentClass][state][district]["document"]) {
                                        let firstRankIndicator = 1;
                                        for (individualParameter of parameter) {
                                            if (isNaN(document[individualParameter])) {   // check if the document has all the parameter using this loop if it does, change the indicator and mark it as rank 1
                                                firstRankIndicator = 0;
                                                document[rankKey] = 0; // might not be required but lets see
                                                break;
                                            }
                                            else {
                                                tempToStoreHighestMark = tempToStoreHighestMark + document[individualParameter];
                                            }



                                        }
                                        if (firstRankIndicator === 1) {  //if indicator is 1 set the rank key to 1 and break ;
                                            document[rankKey] = 1;

                                            break;
                                        }

                                    }





                                    // for (let index = 0, rank = 2; index < districtLevelObject[studentClass][state][district]["document"].length; index++) {
                                    let rank = 1;
                                    for (document of districtLevelObject[studentClass][state][district]["document"]) {
                                        // console.log(document,"document");
                                        // console.log(rankKey,"rankkey");


                                        if (document[rankKey]) {
                                            // console.log("this")
                                            if (document[rankKey] === 0) {       //if rank is 0 delete the key value pair
                                                document[rankKey] = null;
                                            }
                                            continue;               //ends the current loop because rank has been alloted  
                                        }
                                        let rankIndicator = 1;

                                        for (individualParameter of parameter) {
                                            if (isNaN(document[individualParameter])) {   // check if the document has all the parameter using this loop if it doesNT, change the indicator and mark it as rank 0
                                                rankIndicator = 0;
                                                document[rankKey] = null; // might not be required but lets see
                                                break;
                                            }
                                            else {

                                                tempCompare = tempCompare + document[individualParameter];
                                                // console.log(tempCompare,"tempCompare")
                                            }
                                        }

                                        if (rankIndicator === 1) {
                                            if (tempToStoreHighestMark === tempCompare) {
                                                document[rankKey] = rank;
                                                //first index is array index second index(location index for result array) is key of the object from that index 
                                            }
                                            else {
                                                document[rankKey] = rank + 1;
                                                // console.log("here")
                                                tempToStoreHighestMark = tempCompare;
                                                rank++;

                                            }
                                        }
                                    }


                                    // console.log(classLevelObject[studentClass]["document"], "class");




                                    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


                                    for (city in cityLevelObject[studentClass][state][district]) {



                                        // console.log(cityLevelObject[studentClass][state][district][city]["document"],"city");

                                        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

                                        let rankKey = rankSubjectCategory + "( CITY RANKING )"

                                        cityLevelObject[studentClass][state][district][city]["document"].sort(function (a, b) {
                                            let result = 0;
                                            for (individualParameter of parameter) {
                                                if (a[individualParameter] && b[individualParameter]) {
                                                    result = result + (b[individualParameter] - a[individualParameter])
                                                }
                                                else {
                                                    result = 1;
                                                    break;
                                                }
                                            }


                                            return result;

                                        });




                                        for (document of cityLevelObject[studentClass][state][district][city]["document"]) {
                                            let firstRankIndicator = 1;
                                            for (individualParameter of parameter) {
                                                if (isNaN(document[individualParameter])) {   // check if the document has all the parameter using this loop if it does, change the indicator and mark it as rank 1
                                                    firstRankIndicator = 0;
                                                    document[rankKey] = 0; // might not be required but lets see
                                                    break;
                                                }
                                                else {
                                                    tempToStoreHighestMark = tempToStoreHighestMark + document[individualParameter];
                                                }



                                            }
                                            if (firstRankIndicator === 1) {  //if indicator is 1 set the rank key to 1 and break ;
                                                document[rankKey] = 1;

                                                break;
                                            }

                                        }





                                        // for (let index = 0, rank = 2; index < districtLevelObject[studentClass][state][district]["document"].length; index++) {
                                        let rank = 1;
                                        for (document of cityLevelObject[studentClass][state][district][city]["document"]) {
                                            // console.log(document,"document");
                                            // console.log(rankKey,"rankkey");


                                            if (document[rankKey]) {
                                                // console.log("this")
                                                if (document[rankKey] === 0) {       //if rank is 0 delete the key value pair
                                                    document[rankKey] = null;
                                                }
                                                continue;               //ends the current loop because rank has been alloted  
                                            }
                                            let rankIndicator = 1;

                                            for (individualParameter of parameter) {
                                                if (isNaN(document[individualParameter])) {   // check if the document has all the parameter using this loop if it doesNT, change the indicator and mark it as rank 0
                                                    rankIndicator = 0;
                                                    document[rankKey] = null; // might not be required but lets see
                                                    break;
                                                }
                                                else {

                                                    tempCompare = tempCompare + document[individualParameter];
                                                    // console.log(tempCompare,"tempCompare")
                                                }
                                            }

                                            if (rankIndicator === 1) {
                                                if (tempToStoreHighestMark === tempCompare) {
                                                    document[rankKey] = rank;
                                                    //first index is array index second index(location index for result array) is key of the object from that index 
                                                }
                                                else {
                                                    document[rankKey] = rank + 1;
                                                    // console.log("here")
                                                    tempToStoreHighestMark = tempCompare;
                                                    rank++;

                                                }
                                            }
                                        }


                                        // console.log(cityLevelObject[studentClass][state][district][city]["document"], "class");




                                        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////




                                    }

                                }

                            }


                        }
                        // console.log(classLevelObject[studentClass]["document"], "class");


                        //insert in the databse code 


                        // break; //to maake parameter loop run only once// remove for final product 

                    }
                    // console.log(JSON.stringify(classLevelObject,null,3));


                    MongoClient.connect(url, { useNewUrlParser: true }, (err, db) => {
                        if (err) throw err;

                        var dbo = db.db("students");

                        for (studentclass in classLevelObject) {
                            for (document of classLevelObject[studentclass]["document"]) {
                                for (property in document) {
                                    if (document[property] === 'NA') {
                                        document[property] = null;
                                    }
                                }
                                // console.log(document);



                                let finder = { "_id": document["_id"] }
                                delete document["_id"];
                                // console.log(finder);
                                // console.log(document);




                                dbo.collection("ranks")

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
                        var lastSeconds = new Date().getTime() / 1000;
                        logger.info(`time taken ${lastSeconds - seconds}`);
                        logger.info("");


                        db.close();

                    })




                    setTimeout(()=>{res.send("randing generated you may now download the file")},10000)
                    // res.end();

                })
            })
        })
})


module.exports = router;
