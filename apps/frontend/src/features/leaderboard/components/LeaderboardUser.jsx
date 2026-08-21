import { AppLink } from '../../../app/router';
import { Avatar } from '../../../components/ui/Avatar';

// Shared by the global and contest standings tables so the user cell looks
// and links the same in both.
export function LeaderboardUser({ entry, isCurrentUser }) {
  return (
    <div className="leaderboard-user">
      <Avatar name={entry.displayName} src={entry.avatar} className="leaderboard-avatar" />
      <div className="leaderboard-user__names">
        <AppLink to={`/users/${entry.username}`} className="leaderboard-user__name">{entry.displayName}</AppLink>
        <span className="leaderboard-user__handle">@{entry.username}{isCurrentUser && <span className="leaderboard-user__you">You</span>}</span>
      </div>
    </div>
  );
}
