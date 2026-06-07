import React, { useState, useRef, useMemo, useEffect } from "react";

// Импорт компонентов
import PostList from "../Components/PostList";
import PostForm from "../Components/PostForm";
import PostFilter from "../Components/PostFilter";
import PostService from "../API/PostService"; // Исправлено: Service вместо Sevice

// Импорт UI компонентов
import MyButton from "../Components/UI/button/MyButton";
import MyModal from "../Components/UI/modal/MyModal";
import Loader from "../Components/UI/loader/Loader";
import Pagination from "../Components/UI/pagination/Pagination";

// Импорт кастомных хуков и утилит
import { usePosts } from "../Components/hooks/usePosts";
import { useFetching } from "../Components/hooks/useFetching";
import { getPageCount } from "../utils/pages"
import { useObserver } from "../Components/hooks/useObserver";


function Posts() {
  const [posts, setPosts] = useState([])
  const[filter, setFilter] = useState({sort:'', query: ''})
  const [modal, setModal] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const sortedAndSerchedPost = usePosts(posts, filter.sort, filter.query) //Вызов кастомных хуков
  const lastElement = useRef()

  
  
  const [fetchPosts, isPostsLoading, postError] = useFetching(async() => {
    const response = await PostService.getAll(limit, page);
    setPosts([...posts, ...response.data])
    const totalCount = response.headers['x-total-count']
    setTotalPages(getPageCount(totalCount, limit));
  })

  useObserver(lastElement, page < totalPages, isPostsLoading, () => {
    setPage(page + 1);
  })

  useEffect(() => {
    fetchPosts(limit, page)
  }, [page])

  //Функция которая принимает новый пост и вставляет обьект в развёрнутый массив.
  const createPost = (newPost) => {
    setPosts([...posts, newPost])
    setModal(false)
  }


  //Получаем пост из дочернего компонента
  const removePost = (post) => {
    setPosts(posts.filter(p => p.id !== post.id))
  }

  const changePage = (page) => {
    setPage(page)
    fetchPosts (limit, page)
  }

  return (
    <div className="App">
      <button onClick={fetchPosts}>Get Posts </button>
      <MyButton style={{marginTop: '30px'}}onClick={() => setModal(true)}>
        Создать пост
      </MyButton>
      <MyModal visible={modal} setVisible={setModal}>
        <PostForm create={createPost}/> {/*Создаем функцию и назовём её*/}
      </MyModal>
      <hr style={{margin: '15px 0'}}></hr>
      <PostFilter 
        filter={filter}
        setFilter={setFilter}
        />
        {postError &&
          <h1>Произошла ошибка ${postError}</h1>
        }
        <PostList remove={removePost} posts={sortedAndSerchedPost} title="Посты"/> 
        <div ref={lastElement} style={{height: 20, background: 'red'}}></div>
        {isPostsLoading &&
          <div  style={{display: 'flex', justifyContent: 'center', marginTop: '50px'}} ><Loader></Loader></div>
        }
        <Pagination 
          page={page} 
          changePage={changePage}
          totalPages={totalPages}
        >

        </Pagination>
    </div> 
  );
  
}

export default Posts;
