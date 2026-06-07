import React, { forwardRef, useContext, useRef, useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import trackImage from "../image/trackImage.png"
import cartIcon from "../image/cartIcon.png"
import { usePlayer } from "../context/PlayerContext"
import { AuthContext } from "../context"

const PostItem = forwardRef(({ post, queue = [], remove }, ref) => {
  const router = useNavigate()
  const { togglePlay, currentTrack, isPlaying } = usePlayer()
  const { isAuth } = useContext(AuthContext)

  const isCurrentlyPlaying = currentTrack?.id === post.id && isPlaying
  const queueIndex = queue.findIndex(t => t.id === post.id)

  const wrapperRef = useRef(null)
  const trackRef = useRef(null)
  const [isOverflowing, setIsOverflowing] = useState(false)

  useEffect(() => {
    const check = () => {
      if (wrapperRef.current && trackRef.current) {
        setIsOverflowing(trackRef.current.scrollWidth > wrapperRef.current.clientWidth)
      }
    }
    check()
    const ro = new ResizeObserver(check)
    if (wrapperRef.current) ro.observe(wrapperRef.current)
    return () => ro.disconnect()
  }, [post.title])

  function handleTogglePlay(e) {
    e.stopPropagation()
    if (!post.demo_file_url) return
    togglePlay(post, queue.length ? queue : [post], queueIndex >= 0 ? queueIndex : 0)
  }

  return (
    <div ref={ref} className="trackCard">
      <div className="trackImageBox">
        <img
          src={post.image_url || trackImage}
          alt="track"
          className="trackImage"
        />

        <button
          className={`playButton ${isCurrentlyPlaying ? "isPlaying" : ""}`}
          onClick={handleTogglePlay}
        >
          <span className={isCurrentlyPlaying ? "pauseIcon" : "playIcon"}>
            {isCurrentlyPlaying ? "⏸" : "▶"}
          </span>
        </button>
      </div>

      <div className="trackTitleWrapper" ref={wrapperRef}>
        <div className={`trackTitleTrack ${isOverflowing ? "trackTitleScroll" : ""}`} ref={trackRef}>
          <span>{post.title}</span>
        </div>
      </div>

      <button
        className="priceButton"
        onClick={() => router(`/posts/${post.id}`)}
      >
        <div className="priceContent">
          <img src={cartIcon} className="priceIcon" alt="" />
          <h3 className="priceTitle">
            <span className="priceText">
              {post.price
                ? `${Number(post.price).toLocaleString("uk-UA")} ₴`
                : "—"}
            </span>
          </h3>
        </div>
      </button>
    </div>
  )
})

export default PostItem
