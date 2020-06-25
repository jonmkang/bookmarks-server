require('dotenv').config()
const { expect } = require('chai')
const knex = require('knex')
const app = require('../src/app')
const { contentSecurityPolicy } = require('helmet')
const supertest = require('supertest')
const { makeBookmarksArray } = require('./bookmarks.fixtures')

//You can either put the header for authorization, or move app.use(bookmarkRouter) above the token validation

describe('Bookmarks Endpoints', function() {
    let db;

    before(`make knex instance`, () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL,
        })
        app.set('db', db)
    })

    before('clean the table', () => db('bookmarks_list').truncate());

    
    after('disconnect from db', () => db.destroy());

    afterEach('cleanup', () => db('bookmarks_list').truncate());

    describe(`GET /bookmarks`, () => {
        context('Given there are bookmarks in the database', () => {
            const testBookmarks = makeBookmarksArray();

            beforeEach('insert bookmarks', () => {
                return db
                    .into('bookmarks_list')
                    .insert(testBookmarks)
            })

            //You must set the header for Authorization with the correct bearer token for the test to work
            it('GET /bookmarks responds with 200 and all of the bookmarks', () => {
                
                return supertest(app)
                    .get('/bookmarks')
                    .expect(200, testBookmarks)
            })
        })

        context('Given there are no bookmarks in the database', () => {
            
            //You must set the header for Authorization with the correct bearer token for the test to work
            it('GET /bookmarks responds with 200 and an empty array', () => {
                return supertest(app)
                    .get('/bookmarks')
                    .expect(200, [])
            })
        })
    })

    describe('GET /bookmarks/:id', () => {
        context('Given there are bookmarks in the database and one which matches the id', () => {
            const testBookmarks = makeBookmarksArray();

            beforeEach('insert bookmarks', () => {
                return db
                    .into('bookmarks_list')
                    .insert(testBookmarks)
            })

            //You must set the header for Authorization with the correct bearer token for the test to work
            it('GET /bookmarks/:id responds with 200 and the bookmark found', () => {

                return supertest(app)
                    .get('/bookmarks/1')
                    .expect(200, testBookmarks[0])
            })

            //You must set the header for Authorization with the correct bearer token for the test to work
            it('GET /bookmarks/:id responds with 404 if the bookmark is not found', () => {

                return supertest(app)
                    .get('/bookmarks/1235')
                    .expect(404, {
                        error: { message: `Bookmark doesn't exist`}
                    })
            })
        })

        context('Given there are no bookmarks in the database', () => {
            
            //You must set the header for Authorization with the correct bearer token for the test to work
            it(`responds with 404`, () => {
                return supertest(app)
                    .get(`/bookmarks/1234`)
                    .expect(404, {
                        error: { message: `Bookmark doesn't exist`}
                    })
                    
            })
        })
    })

})