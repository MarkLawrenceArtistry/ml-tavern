// ============================================================
// FILE: src/pages/Board.jsx
// ============================================================
import { useSearchParams } from 'react-router-dom';
import FeedList from '../components/FeedList';
import PostDetail from '../components/PostDetail';

const MAP = {
  pilot: { tag: 'Pilot Service', title: 'Pilot Services' },
  buy_sell: { tag: 'Buy and Sell', title: 'Buy & Sell Market' },
  esports: { tag: 'LF Team', title: 'Esports Team Finder' },
};

export default function Board({ boardType }) {
  const [searchParams] = useSearchParams();
  const postId = searchParams.get('post');
  const cfg = MAP[boardType];

  if (postId) {
    return <PostDetail postId={postId} boardType={boardType} />;
  }

  return <FeedList tagFilter={cfg.tag} title={cfg.title} />;
}