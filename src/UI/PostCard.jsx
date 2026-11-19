function PostCard({ post }) {
  const createdAt = post.created_at ? new Date(post.created_at) : null;
  const timestamp =
    createdAt && !Number.isNaN(createdAt.getTime())
      ? createdAt.toLocaleString()
      : "Just now";

  return (
    <article className="post-item">
      <header className="post-header">
        <span className="post-username">{post.user?.name || "Guest User"}</span>
        <time
          className="post-timestamp"
          dateTime={post.created_at || undefined}
        >
          {timestamp}
        </time>
      </header>
      <p className="post-message">{post.message}</p>
    </article>
  );
}

export default PostCard;
