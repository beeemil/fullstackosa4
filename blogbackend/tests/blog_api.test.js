const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)
const Blog = require('../models/blog')
const helper = require('./test_helper')

const bcrypt = require('bcrypt')
const User = require('../models/user')
const { usersInDb } = require('./test_helper')


describe('When there are initially some blogs saved', () => {
    beforeEach(async () => {
        await Blog.deleteMany({})
        await Blog.insertMany(helper.initialBlogs)
    })

    test('all blogs are returned', async () => {
        const response = await api.get('/api/blogs')
        expect(response.body).toHaveLength(helper.initialBlogs.length)
    })

    test('blogs are returned as json', async () => {
        await api
        .get('/api/blogs')
        .expect(200)
        .expect('Content-Type', /application\/json/)
    })

    test('Blog has property id', async () => {
        const response = await api.get('/api/blogs')
        const ids = response.body.map(b => b.id)
        expect(ids).toBeDefined()
    })

    test('a specific blog is within the returned blogs', async () => {
        const response = await api.get('/api/blogs')
    
        const titles = response.body.map(r => r.title)
        expect(titles).toContain(
        'React patterns'
        )
    })

    describe('Viewing a specific blog', () => {
        test('Succeeds with a valid id', async () => {
            const blogsAtStart = await helper.blogsInDb()
            const blogToView = blogsAtStart[0]
            const resultBlog = await api
                .get(`/api/blogs/${blogToView.id}`)
                .expect(200)
                .expect('Content-Type', /application\/json/)

            const processedBlogToView = JSON.parse(JSON.stringify(blogToView))
            expect(resultBlog.body).toEqual(processedBlogToView)
        })

        test('fails with statuscode 404 if blog does not exist', async () => {
            const validNonexistingId = await helper.nonExistingId()
            console.log(validNonexistingId)
    
            await api
            .get(`/api/blogs/${validNonexistingId}`)
            .expect(404)
        })

        test('fails with statuscode 400 id is invalid', async () => {
            const invalidId = '5a3d5da59070081a82a3445'
    
            await api
            .get(`/api/blogs/${invalidId}`)
            .expect(400)
        })

    })

    describe('Addition of a new blog', () => {
        test('Blog without title is not added', async () => {
            const newBlog = { author: 'eemil',  url: "nourl.url", likes: 1 }
            await api
            .post('/api/blogs')
            .send(newBlog)
            .expect(400)
        
            const blogsAtEnd = await helper.blogsInDb()
        
            expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
        })

        test('a valid blog can be added ', async () => {
            const newBlog = { title: 'willremovethissoon', author: 'eemil',  url: "nourl.url", likes: 1}
        
            await api
            .post('/api/blogs')
            .send(newBlog)
            .expect(200)
            .expect('Content-Type', /application\/json/)
        
            const blogsAtEnd = await helper.blogsInDb()
            expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)
        
            const titles = blogsAtEnd.map(b => b.title)
            expect(titles).toContain(
            'willremovethissoon'
            )
        })

        test('Likes set to 0 if not defined', async () => {
            const newBlog = { title: "NoLikesToZeroLikes", author: 'Meemil',  url: "HurlUrl.com" }

            await api
                .post('/api/blogs')
                .send(newBlog)
                .expect(200)
                .expect('Content-Type', /application\/json/)
        
            const blogsAtEnd = await helper.blogsInDb()
            expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)
            
            const likes = blogsAtEnd.map(b => b.likes)
            expect(likes).toContain(0)
        })
    })

    describe('Updating an existing blog', () => {
        test('Succeeds if update is ok', async () => {
            const blogsAtStart = await helper.blogsInDb()
            const blogToUpdate = blogsAtStart[0]
            blogToUpdate.author = 'Testi Testman'

            await api
                .put(`/api/blogs/${blogToUpdate.id}`)
                .send(blogToUpdate)
                .expect(200)
            
            const blogsAtEnd = await helper.blogsInDb()
            expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
            const authors = blogsAtEnd.map(blog => blog.author)
            expect(authors).toContain('Testi Testman')
        })

    })

    describe('deletion of a blog', () => {
        test('Succeeds with 204 if id is valid', async () => {
            const blogsAtStart = await helper.blogsInDb()
            const blogToDelete = blogsAtStart[0]
    
            await api
                .delete(`/api/blogs/${blogToDelete.id}`)
                .expect(204)
    
            const blogsAtEnd = await helper.blogsInDb()
    
            expect(blogsAtEnd).toHaveLength(
            helper.initialBlogs.length - 1
            )
    
            const titles = blogsAtEnd.map(r => r.title)
    
            expect(titles).not.toContain(blogToDelete.title)
        })
        })
})



describe('when there is initially one user at db', () => {
  beforeEach(async () => {
    await User.deleteMany({})

    const passwordHash = await bcrypt.hash('sekret', 10)
    const user = new User({ username: 'root', name: 'juuri', passwordHash })

    await user.save()
  })

  test('creation succeeds with a fresh username', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'memil',
      name: 'Eemil',
      password: 'salainen',
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length + 1)

    const usernames = usersAtEnd.map(u => u.username)
    expect(usernames).toContain(newUser.username)
  })

  test('creation fails when username is taken', async () => {
      const usersAtStart = await helper.usersInDb()

      const newUser = {
          username: 'root',
          name: 'Kayttaja3000',
          password: 'password'
      }

      const result = await api
        .post('/api/users')
        .send(newUser)
        .expect(400)
        .expect('Content-type', /application\/json/)

    expect(result.body.error).toContain('`username` to be unique')
    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length)

  })
})


afterAll(() => {
    mongoose.connection.close()
}) 