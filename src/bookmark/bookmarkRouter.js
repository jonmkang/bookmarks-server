const express = require('express');
const bodyParser = express.json();
const logger = require('../logger');
const { bookmarkList } = require('../bookmarkList')
const bookmarkRouter = express.Router()
const { v4: uuid } = require("uuid");
const BookmarksService = require('../BookmarksService')
const app = require('../app')


bookmarkRouter
    .route('/bookmarks')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        BookmarksService.getAllBookmarks(knexInstance)
            .then(bookmarks => {
                res
                    .json(bookmarks)
            })
            .catch(next)
    })
    .post(bodyParser, (req, res) => {
        const { title, url, description, rating } = req.body;

        if (!title) {
            logger.error(`Title is required`);
            return res
              .status(400)
              .send('Invalid data');
        }
        
        if (!url) {
            logger.error(`URL is required`);
            return res
                .status(400)
                .send('Invalid data');
        }

        if (!description) {
            logger.error(`Description is required`);
            return res
              .status(400)
              .send('Invalid data');
        }
        
        if (!rating) {
            logger.error(`Rating is required`);
            return res
                .status(400)
                .send('Invalid data');
        }

        const id = uuid();

        const bookmark = {
            title,
            url,
            description,
            rating,
            id
        }

        bookmarkList.push(bookmark)

        logger.info(`Bookmark created`)

        res
            .status(201)
            .json(bookmark);
    })

bookmarkRouter  
    .route('/bookmarks/:id')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')

        BookmarksService.getById(knexInstance, req.params.id)
            .then(bookmark => {
                if(!bookmark){
                    logger.error(`Bookmark with id ${req.params.id} not found`)
                    return res.status(404).json({
                        error: { message: `Bookmark doesn't exist`}
                    })
                }
                res.json(bookmark)
            })
            .catch(next)
    })
    .delete((req, res) => {
        const { id } = req.params;
        const bookmarkIndex = bookmarkList.findIndex(b => b.id == id);

        if(bookmarkIndex == -1){
            logger.error(`Bookmark with id ${id} not found`)
            return res 
                .status(404)
                .send('Bookmark not found')
        }

        bookmarkList.splice(bookmarkIndex, 1);
        res.json(bookmarkList)
            .status(200)
            .send(`Bookmark with id ${id} deleted`)

    })


module.exports = bookmarkRouter;