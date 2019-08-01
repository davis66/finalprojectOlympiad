let express = require('express');
let app = express();
let postRoute = require('./routes/post');
let updateSubjectfile = require('./routes/updateSubjectfile');
let updateSubjectSelected = require('./routes/updateSubjectSelected');
let getUpdateMarksFile = require('./routes/updateMarksFile')
let generateRanking = require('./routes/generateRanking')
let rankFile = require('./routes/rankingFile');
let path = require('path');
let bodyParser = require('body-parser');



app.use(express.static('public'))


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// app.use(bodyParser.raw());
// app.use(bodyParser.urlencoded({ extended: false }));

app.use((req, res, next) => {
  console.log(`${new Date().toString()} => ${req.originalUrl}`, req.body)
  next()
})


app.use(postRoute) //post 
app.use(updateSubjectfile) //updateSubjectsFile
app.use(updateSubjectSelected) //updates selected subject
app.use(getUpdateMarksFile) //update marks 
app.use(generateRanking) //generates rank
app.use(rankFile) //generates rank


// Handler for 404 - Resource Not Found
app.use((req, res, next) => {
  res.status(404).send('We think you are lost!')
})

// Handler for Error 500
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.sendFile(path.join(__dirname, '../public/500.html'))
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.info(`Server has started on ${PORT}`))