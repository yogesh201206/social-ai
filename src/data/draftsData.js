import { posts } from './postsData'

export const draftPosts = posts.filter((post) => post.status === 'Draft')

export default draftPosts
