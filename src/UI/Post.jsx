import { useState, useEffect } from "react";
import { getPost, storePost } from "../api/post";
import "./styles/post.css";
import PostCard from "./PostCard";

export default function Post() {
  const [posts, setPosts] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    let active = true;

    getPost()
      .then((response) => {
        if (active) {
          setPosts(response.data);
        }
      })
      .catch((err) => {
        if (active) {
          setError(
            err.response?.data?.message ||
              "Failed to load posts. Please try again."
          );
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      setError("Post cannot be empty.");
      return;
    }

    setProcessing(true);
    setError("");

    try {
      const response = await storePost({ message: trimmedMessage });
      setPosts((currentPosts) => [response.data, ...currentPosts]);
      setMessage("");
    } catch (err) {
      const validationMessage = err.response?.data?.errors?.message?.[0];
      setError(
        validationMessage ||
        err.response?.data?.message ||
          "Failed to share post. Please try again."
      );
    } finally {
      setProcessing(false);
    }
  };

  return (
    <main className="post-container">
      <section className="post-card" aria-label="Create a post">
        <h1 className="post-title">Create Post</h1>
        <form onSubmit={submit} className="post-form">
          <textarea
            value={message}
            placeholder="What's on your mind?"
            className="post-textarea"
            onChange={(event) => {
              setMessage(event.target.value);
              if (error === "Post cannot be empty.") {
                setError("");
              }
            }}
            disabled={processing}
            maxLength={5000}
            aria-label="Post message"
          />
          {error && <div className="post-error" role="alert">{error}</div>}

          <div className="post-footer">
            <button
              type="submit"
              className="post-submit-btn"
              disabled={processing || !message.trim()}
            >
              {processing ? "Posting..." : "Post"}
            </button>
          </div>
        </form>
      </section>

      <section className="post-feed-list" aria-label="Posts">
        {loading ? (
          <p>Loading posts...</p>
        ) : posts.length ? (
          posts.map((post) => <PostCard key={post.id} post={post} />)
        ) : (
          !error && <div className="post-empty-state">No posts shared yet.</div>
        )}
      </section>
    </main>
  );
}