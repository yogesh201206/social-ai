import { posts } from './postsData'

export const publishedPosts = posts.filter((post) => post.status === 'Published')

export default publishedPosts
