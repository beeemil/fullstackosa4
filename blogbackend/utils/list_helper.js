const _ = require('lodash')


const dummy = (blogs) => {
    return 1
}

const totalLikes = (blogs) => {
    return blogs.reduce((sum, blog) => sum + blog.likes, 0)
}

const favoriteBlog = (blogs) => {
    return blogs.length === 0 ? {} : blogs.reduce((a, b) => (a.likes > b.likes) ? a: b)
}

const mostBlogs = (blogs) => {
    const aBlogs = _.keyBy(blogs, 'author')
    console.log("ablogs", aBlogs)
    // return( blogs.reduce((blog, val) => {
    //         blog[val.author] = (blog[val.author] || 0) + 1
    //         return blog
    // }, {})
    // )

}

module.exports = {
    dummy,
    favoriteBlog,
    mostBlogs,
    totalLikes
}