const express = require('express');
const bodyParser = express.json();
const logger = require('../logger');
const { bookmarkList } = require('../bookmarkList')
const bookmarkRouter = express.Router()
const { v4: uuid } = require("uuid");
const BookmarksService = require('../BookmarksService')
const app = require('../app')
const xss = require('xss')

const serializeBookmark = bookmark => ({
    id: bookmark.id,
    title: xss(bookmark.title),
    url: xss(bookmark.url),
    description: xss(bookmark.description),
    rating: xss(bookmark.rating)
})

bookmarkRouter
    .route('/')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        BookmarksService.getAllBookmarks(knexInstance)
            .then(bookmarks => {
                res.json(bookmarks.map(serializeBookmark))
            })
            .catch(next)
    })
    .post(bodyParser, (req, res) => {
        const knexInstance = req.app.get('db')
        const { title, url, description, rating } = req.body;
        const newBookmark = { title, url, description, rating }

        for (const [key, value] of Object.entries(newBookmark))
            if (value == null)
                return res.status(400).json({
                    error: { message: `Missing '${key}' in request body` }
                })
        
        if(newBookmark.rating < 1 || newBookmark.rating > 5){
            return res.status(400).json({
                error: { message: `Rating must be between 1 and 5` }
            })
        }

        BookmarksService.insertBookmark(knexInstance, newBookmark)
            .then(bookmark => {
                res
            .status(201)
            .location(`/bookmarks/${bookmark.id}`)
            .json(serializeBookmark(bookmark));
            })
        logger.info(`Bookmark created`)

        
    })

bookmarkRouter  
    .route('/:id')
    .all((req, res, next) => {
        BookmarksService.getById(req.app.get('db'), req.params.id)
        .then(bookmark => {
            if(!bookmark){
                logger.error(`Bookmark with id ${req.params.id} not found`)
                return res.status(404).json({
                    error: { message: `Bookmark doesn't exist`}
                })
            }
            res.bookmark = bookmark;
            next()
        })
        .catch(next)
    })
    .get((req, res, next) => {
        res.json(serializeBookmark(res.bookmark))
    })
    .delete((req, res, next) => {

        BookmarksService.deleteBookmark(
            req.app.get('db'),
            req.params.id
        )
        .then(
            res.status(204).end()
        )
        .catch(next)
    })
    .patch(bodyParser, (req, res, next) => {
        const { title, url, description, rating } = req.body;
        const updateBookmark = { title, url, description, rating }

        

        const numberOfValues = Object.values(updateBookmark).filter(Boolean).length
            if(numberOfValues === 0) {
                return res.status(400).json({
                    error: {
                        message: `Request body must contain either 'title', 'url', 'rating`
                    }
                })
            }
        
        if(updateBookmark.rating < 1 || updateBookmark.rating > 5){
            return res.status(400).json({
                error: { message: `Rating must be between 1 and 5` }
            })
        }

        BookmarksService.updateBookmark(req.app.get('db'), req.params.id, updateBookmark)
            .then(numRowsAffected => {
                res.status(204).end()
            })
            .catch(next)
    })


module.exports = bookmarkRouter;