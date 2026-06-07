import React, { useState, useRef, useEffect, useContext, useMemo } from "react";
import { useLocation } from "react-router-dom";

import PostList from "../Components/PostList";
import PostForm from "../Components/PostForm";
import PostFilter from "../Components/filter/PostFilter";
import TrackService from "../API/TrackService";

import MyModal from "../Components/UI/modal/MyModal";
import Loader from "../Components/UI/loader/Loader";

import { useFetching } from "../Components/hooks/useFetching";
import { useObserver } from "../Components/hooks/useObserver";

import { SearchContext, AuthContext } from "../context";
import { Link } from "react-router-dom";
import "../styles/Posts.css";

function Posts() {
  const location = useLocation();
  const { isAuth } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);

  const [filter, setFilter] = useState({
    sort:     location.state?.sort  || "new",
    genre:    location.state?.genre || "",
    priceMin: null,
    priceMax: null,
    bpmMin:   null,
    bpmMax:   null,
    key:      ""
  });

  const [modal, setModal] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(6);
  const [page, setPage] = useState(1);


  const { searchQuery } = useContext(SearchContext);

  const lastElement = useRef();

  const [fetchPosts, isPostsLoading, postError] = useFetching(async () => {
    const response = await TrackService.getAll();

    setPosts(response.data);

    const totalCount = response.headers["x-total-count"];

    if (totalCount) {
      setTotalPages(Math.ceil(totalCount / limit));
    }
  });

  useObserver(
    lastElement,
    page < totalPages,
    isPostsLoading,
    () => {
      setPage(page + 1);
    }
  );

  useEffect(() => {
    fetchPosts();
  }, [page]);

  const priceBounds = useMemo(() => {
    const vals = posts.map(t => Number(t.price)).filter(p => !isNaN(p) && p > 0);
    return vals.length ? { min: Math.min(...vals), max: Math.max(...vals) } : { min: 0, max: 10000 };
  }, [posts]);

  const bpmBounds = useMemo(() => {
    const vals = posts.map(t => Number(t.bpm)).filter(b => !isNaN(b) && b > 0);
    return vals.length ? { min: Math.min(...vals), max: Math.max(...vals) } : { min: 60, max: 200 };
  }, [posts]);

  const filteredPosts = useMemo(() => {
    let result = [...posts];

    // Пошук
    const q = searchQuery?.toLowerCase().trim();
    if (q) {
      result = result.filter(t =>
        t.title?.toLowerCase().includes(q) ||
        t.genre?.toLowerCase().includes(q) ||
        t.mood?.toLowerCase().includes(q)
      );
    }

    // Жанр
    if (filter.genre) {
      result = result.filter(t => t.genre?.toLowerCase() === filter.genre.toLowerCase());
    }

    // Тональність
    if (filter.key) {
      result = result.filter(t => t.key?.toLowerCase() === filter.key.toLowerCase());
    }

    // Ціна (діапазон)
    if (filter.priceMin !== null) {
      result = result.filter(t => Number(t.price) >= filter.priceMin);
    }
    if (filter.priceMax !== null) {
      result = result.filter(t => Number(t.price) <= filter.priceMax);
    }

    // BPM (діапазон)
    if (filter.bpmMin !== null) {
      result = result.filter(t => Number(t.bpm) >= filter.bpmMin);
    }
    if (filter.bpmMax !== null) {
      result = result.filter(t => Number(t.bpm) <= filter.bpmMax);
    }

    // Сортування
    if (filter.sort === "title")     result.sort((a, b) => a.title.localeCompare(b.title));
    if (filter.sort === "priceLow")  result.sort((a, b) => Number(a.price) - Number(b.price));
    if (filter.sort === "priceHigh") result.sort((a, b) => Number(b.price) - Number(a.price));
    if (filter.sort === "bpm")       result.sort((a, b) => Number(a.bpm) - Number(b.bpm));
    if (filter.sort === "new") {
      result.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    }

    return result;
  }, [posts, filter, searchQuery]);

  const createPost = (newPost) => {
    setPosts([...posts, newPost]);
    setModal(false);
  };

  const removePost = (post) => {
    setPosts(posts.filter(p => p.id !== post.id));
  };

  return (
    <div className="App">
      <MyModal
        visible={modal}
        setVisible={setModal}
      >
        <PostForm create={createPost} />
      </MyModal>

      <PostFilter
        filter={filter}
        setFilter={setFilter}
        priceBounds={priceBounds}
        bpmBounds={bpmBounds}
      />

      {postError &&
        <h1>Произошла ошибка {postError}</h1>
      }

      <PostList
        remove={removePost}
        posts={filteredPosts}
      />

      <div
        ref={lastElement}
        style={{
          height: 20
        }}
      />

      {isPostsLoading &&
        <div style={{
          display: "flex",
          justifyContent: "center",
          marginTop: "50px"
        }}>
          <Loader />
        </div>
      }
    </div>
  );
}

export default Posts;