import React, { createRef } from 'react'
import PostItem from "./PostItem"
import { CSSTransition, TransitionGroup } from 'react-transition-group'
import "../styles/PostList.css";

const PostList = ({ posts, remove }) => {
  if (!posts.length) {
    return (
      <div className="emptyCatalog">
        <h1>Треки не знайдено</h1>
        <p>Спробуйте змінити пошуковий запит або обрати інший фільтр.</p>
      </div>
    )
  }

  return (
    <TransitionGroup className="trackGrid">
      {posts.map((post, index) => {
        const nodeRef = createRef(null)
        return (
          <CSSTransition
            key={post.id}
            nodeRef={nodeRef}
            timeout={500}
            classNames="post"
          >
            <PostItem
              ref={nodeRef}
              remove={remove}
              number={index + 1}
              post={post}
              queue={posts}
            />
          </CSSTransition>
        )
      })}
    </TransitionGroup>
  )
}

export default PostList
