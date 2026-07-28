import { posts } from './postsData'

export const scheduledPosts = posts.filter((post) => post.status === 'Scheduled')

export default scheduledPosts
