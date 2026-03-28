import { motion } from "framer-motion";
import type { Observation } from "../types";

interface PostCardProps {
  observation: Observation | null;
}

const suspiciousPattern =
  /\b(click here|buy now|limited offer|free|win|prize|congratulations|urgent|act now|casino|crypto|investment)\b/gi;

function highlightContent(content: string) {
  const matches = Array.from(content.matchAll(suspiciousPattern));
  if (matches.length === 0) {
    return content;
  }

  const segments: Array<string | JSX.Element> = [];
  let lastIndex = 0;

  matches.forEach((match, index) => {
    const start = match.index ?? 0;
    const end = start + match[0].length;
    if (start > lastIndex) {
      segments.push(content.slice(lastIndex, start));
    }
    segments.push(
      <mark key={`${match[0]}-${index}`} className="highlight-suspicious">
        {content.slice(start, end)}
      </mark>,
    );
    lastIndex = end;
  });

  if (lastIndex < content.length) {
    segments.push(content.slice(lastIndex));
  }

  return segments;
}

export function PostCard({ observation }: PostCardProps) {
  if (!observation) {
    return (
      <section className="empty-state">
        <h2 className="empty-title">No active post</h2>
        <p className="empty-desc">Start or restart an episode to stream a moderation case into the workspace.</p>
      </section>
    );
  }

  const reports = (observation.metadata.engagement as { reports?: number } | undefined)?.reports ?? 0;
  const repeatedPosts = (observation.metadata.repeated_posts as number | undefined) ?? 0;
  const priorViolations = (observation.author_history.prior_violations as number | undefined) ?? 0;
  const accountAge = (observation.author_history.account_age_days as number | undefined) ?? 0;
  const followerCount = (observation.author_history.follower_count as number | undefined) ?? 0;
  const community = String(observation.context.community ?? "general");
  const language = String(observation.context.language ?? "en");
  const avatar = observation.author_id.slice(0, 2).toUpperCase();

  return (
    <motion.section
      key={observation.post_id}
      className="post-card"
      initial={{ opacity: 0, x: 18, y: 6 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, x: -12, y: -4 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <div className="post-card-header">
        <div className="post-author">
          <div className="author-avatar">{avatar}</div>
          <div>
            <div className="author-name">{observation.author_id}</div>
            <div className="author-meta">
              step {observation.step_number + 1} / {observation.max_steps}
            </div>
          </div>
        </div>
        <div className="post-id-badge">{observation.post_id}</div>
      </div>

      <div className="post-content-area">
        <div className="post-content">{highlightContent(observation.content)}</div>

        <div className="post-tags">
          {reports > 5 ? <span className="tag danger">{reports} reports</span> : null}
          {Boolean(observation.metadata.contains_links) ? <span className="tag info">contains link</span> : null}
          {repeatedPosts > 3 ? <span className="tag warning">{repeatedPosts} repeated posts</span> : null}
          {reports <= 5 && !observation.metadata.contains_links && repeatedPosts <= 3 ? (
            <span className="tag success">low risk surface signal</span>
          ) : null}
        </div>

        {observation.context.explanation ? (
          <div className="post-explanation">
            <div className="context-key">Context note</div>
            <p>{String(observation.context.explanation)}</p>
          </div>
        ) : null}
      </div>

      <div className="context-grid">
        <div className="context-item">
          <div className="context-key">prior_violations</div>
          <div className="context-val">{priorViolations}</div>
        </div>
        <div className="context-item">
          <div className="context-key">account_age_days</div>
          <div className="context-val">{accountAge}</div>
        </div>
        <div className="context-item">
          <div className="context-key">follower_count</div>
          <div className="context-val">{followerCount}</div>
        </div>
        <div className="context-item">
          <div className="context-key">community</div>
          <div className="context-val">{community}</div>
        </div>
        <div className="context-item">
          <div className="context-key">language</div>
          <div className="context-val">{language}</div>
        </div>
        <div className="context-item">
          <div className="context-key">reports</div>
          <div className="context-val">{reports}</div>
        </div>
      </div>
    </motion.section>
  );
}
