//Кастомные хуки

import {useMemo} from "react";

export const useSortedPosts = (posts, sort) => {
    const sortedPosts = useMemo(() => {
        if(sort) {
          return [...posts].sort((a, b) => a[sort].localeCompare(b[sort]))
        }
        return posts;
      }, [sort, posts])
      
    return sortedPosts;
}

export const usePosts = (posts, sort, query) => {
    const sortedPosts = useSortedPosts(posts, sort);
    const sortedAndSerchedPost = useMemo(() => {
        const normalizedQuery = query.toLowerCase().trim();
        if (!normalizedQuery) return sortedPosts;
        return sortedPosts.filter(post => post.title.toLowerCase().includes(normalizedQuery))
    },
    [query, sortedPosts])

    return sortedAndSerchedPost;
}