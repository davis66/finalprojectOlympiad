let mongoose = require('mongoose')

const server = 'dave-ggjzh.mongodb.net'
const db = 'new'
const user = 'davis66'
const password = 'Dddarren9'

mongoose.connect(`mongodb+srv://${user}:${password}@${server}/${db}`, {'useNewUrlParser': true})
mongoose.set('useCreateIndex', true);

let CustomerSchema = new mongoose.Schema({},{strict:false })

module.exports = mongoose.model('Customer', CustomerSchema)
