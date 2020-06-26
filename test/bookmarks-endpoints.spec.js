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

        context(`Given an XSS attack bookmark`, () => {
            const maliciousBookmark = {
                id: 50,
                title: 'Naughty naughty very naughty <script>alert("xss");</script>',
                url: 'hackme.com',
                description: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
                rating: 4
            }
    
            beforeEach('insert malicious article', () => {
                return db
                    .into('bookmarks_list')
                    .insert([ maliciousBookmark ])
            })
    
            it('removes XSS attack content', () => {
            return supertest(app)
                .get(`/bookmarks/${maliciousBookmark.id}`)
                .expect(200)
                .expect(res => {
                expect(res.body.title).to.eql('Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;')
                expect(res.body.description).to.eql(`Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`)
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

    describe.only(`POST /bookmarks/:id`, () => {
        it(`Creates a bookmark, responds with 201 and the new bookmark`, () => {
            this.retries(3)
            const newBookmark = {
                id: 1000,
                title: 'Test new bookmark',
                url: 'www.thisisatest.com',
                description: 'This is sample description',
                rating: '5'
            }

            return supertest(app)
                .post('/bookmarks')
                .send(newBookmark)
                .expect(201)
                .expect(res => {
                    expect(res.body.title).to.eql(newBookmark.title)
                    expect(res.body.url).to.eql(newBookmark.url)
                    expect(res.body.description).to.eql(newBookmark.description)
                    expect(res.body.rating).to.eql(newBookmark.rating)
                    expect(res.body).to.have.property('id')
                    expect(res.headers.location).to.eql(`/bookmarks/${res.body.id}`)
                })
        })
    })

    describe(`DELETE /bookmarks/:id`, () => {
        context('Given there are bookmarks in the database and one matches the id', () => {
            const testBookmarks = makeBookmarksArray()

            beforeEach('insert bookmarks', () => {
                return db
                    .into('bookmarks_list')
                    .insert(testBookmarks)
            })

            it('Delete /bookmarks/:id responds with 204 and the bookmark is deleted', () =>  {
                const idToRemove = 2;
                const expectedBookmarks = testBookmarks.filter(bookmark => bookmark.id !== idToRemove);

                return supertest(app)
                    .delete(`/bookmarks/${idToRemove}`)
                    .expect(204)
                    .then(res => {
                        supertest(app)
                            .get(`/bookmarks`)
                            .expect(expectedBookmarks)
                    })

            })
        })

        context('Given no bookmarks', () => {
            it(`responds with 404`, () => {
                const bookmarkId = 123456
                return supertest(app)
                    .delete(`/bookmarks/${bookmarkId}`)
                    .expect(404, {
                        error: { message: `Bookmark doesn't exist`}
                    })
            })
        });
    });
});