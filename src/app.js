require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const helmet = require('helmet')
const { NODE_ENV, API_TOKEN } = require('./config')
const bookmarkRouter = require('./bookmark/bookmarkRouter')
const e = require('express')
const logger = require('./logger');
const BookmarksService = require('./BookmarksService')

const app = express()

const morganOption = (NODE_ENV === 'production')
  ? 'tiny'
  : 'common';

app.use(morgan(morganOption));
app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello, world!')
})

app.use('/bookmarks/', bookmarkRouter)

app.use(function errorHandler(error, req, res, next) {
    let response;
    if (NODE_ENV === 'production'){
        response = { error: {message: 'server error'}}
    }else {
        console.error(error)
        response = { message: error.message, error}
    }
    res.status(500).json(response)
})

app.use(function validateBearerToken(req, res, next) {
    const authToken = req.get('Authorization')

    if (!authToken || authToken.split(' ')[1] !== API_TOKEN) {
        logger.error(`Unauthorized request to path: ${req.path}`);
      return res.status(401).json({ error: 'Unauthorized request' })
    }
    // move to the next middleware
    next()
})





module.exports = app