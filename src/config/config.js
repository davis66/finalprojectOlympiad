
const server = 'dave-ggjzh.mongodb.net'

const user = 'davis66'
const password = 'Dddarren9'


var winston = require('winston');

// // define the custom settings for each transport (file, console)
// var options = {
//   file: {
//     level: 'info',
//     filename: `../../${__dirname}/combined.log`,
//     handleExceptions: true,
//     json: true,
//     maxsize: 5242880, // 5MB
//     maxFiles: 5,
//     colorize: false,
//   },
//   console: {
//     level: 'debug',
//     handleExceptions: true,
//     json: false,
//     colorize: true,
//   },
// };

// // instantiate a new Winston Logger with the settings defined above
// var logger = winston.createLogger({
//   transports: [
//     new winston.transports.File(options.file),
//     new winston.transports.Console(options.console)
//   ],
//   exitOnError: false, // do not exit on handled exceptions
// });

// // create a stream object with a 'write' function that will be used by `morgan`
// logger.stream = {
//   write: function(message, encoding) {
//     // use the 'info' log level so the output will be picked up by both transports (file and console)
//     logger.info(message);
//   },
// };
const logger = winston.createLogger({
    level: 'info',
    transports: [
    //   new winston.transports.Console(),// to show 
      new winston.transports.File({ filename: "./combined.log" })
    ]
  });





module.exports = {
    "simpleURI": `mongodb+srv://${user}:${password}@${server}`,
    "logger" : logger
}
console.log(__dirname)