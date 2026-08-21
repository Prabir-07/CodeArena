// Development adapter for the Leaderboard Service.
//
// There is no Leaderboard Service backend yet — this module serves local
// mock standings shaped the way a future real ranking API plausibly would
// be, so the leaderboard UI can be built now and swapped to a real HTTP
// adapter later without any component changing. Contest standings compose
// the Contest Service development adapter so an unknown contest slug fails
// the same way it does everywhere else. No network requests are made here.
export const LEADERBOARD_SERVICE_MODE = 'development';

import { contestService } from './contestService';

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Ranked best-first. rankChange is positions gained (+) or lost (-) since the
// previous ranking period; 0 means unchanged. All avatars are null so the UI
// exercises its initials fallback and no remote images are fetched.
const RANKED_USERS = [
  { username: 'nova_dev', displayName: 'Nova Petrova', avatar: null, problemsSolved: 412, rating: 2841, contestsPlayed: 63, rankChange: 0 },
  { username: 'kaito_s', displayName: 'Kaito Sato', avatar: null, problemsSolved: 398, rating: 2790, contestsPlayed: 58, rankChange: 2 },
  { username: 'amara_b', displayName: 'Amara Bello', avatar: null, problemsSolved: 383, rating: 2744, contestsPlayed: 71, rankChange: -1 },
  { username: 'lin_wei', displayName: 'Lin Wei', avatar: null, problemsSolved: 366, rating: 2698, contestsPlayed: 44, rankChange: 4 },
  { username: 'devuser', displayName: 'Dana Rivera', avatar: null, problemsSolved: 341, rating: 2610, contestsPlayed: 39, rankChange: -2 },
  { username: 'marek_z', displayName: 'Marek Zielinski', avatar: null, problemsSolved: 330, rating: 2564, contestsPlayed: 52, rankChange: 1 },
  { username: 'priya_n', displayName: 'Priya Nair', avatar: null, problemsSolved: 318, rating: 2508, contestsPlayed: 47, rankChange: 0 },
  { username: 'tobi_a', displayName: 'Tobi Adeyemi', avatar: null, problemsSolved: 305, rating: 2461, contestsPlayed: 35, rankChange: 6 },
  { username: 'sofia_r', displayName: 'Sofia Rossi', avatar: null, problemsSolved: 291, rating: 2402, contestsPlayed: 41, rankChange: -3 },
  { username: 'jonas_h', displayName: 'Jonas Hoffmann', avatar: null, problemsSolved: 277, rating: 2350, contestsPlayed: 29, rankChange: 2 },
  { username: 'yuki_t', displayName: 'Yuki Tanaka', avatar: null, problemsSolved: 264, rating: 2288, contestsPlayed: 33, rankChange: 0 },
  { username: 'omar_f', displayName: 'Omar Farouk', avatar: null, problemsSolved: 250, rating: 2231, contestsPlayed: 26, rankChange: -4 },
  { username: 'elena_k', displayName: 'Elena Kovac', avatar: null, problemsSolved: 238, rating: 2174, contestsPlayed: 38, rankChange: 3 },
  { username: 'rahul_m', displayName: 'Rahul Mehta', avatar: null, problemsSolved: 226, rating: 2119, contestsPlayed: 22, rankChange: 1 },
  { username: 'chen_l', displayName: 'Chen Lu', avatar: null, problemsSolved: 214, rating: 2063, contestsPlayed: 31, rankChange: -1 },
  { username: 'ines_c', displayName: 'Inês Carvalho', avatar: null, problemsSolved: 199, rating: 1998, contestsPlayed: 19, rankChange: 5 },
  { username: 'daniel_o', displayName: 'Daniel Okoro', avatar: null, problemsSolved: 187, rating: 1944, contestsPlayed: 24, rankChange: 0 },
  { username: 'mira_s', displayName: 'Mira Solberg', avatar: null, problemsSolved: 172, rating: 1881, contestsPlayed: 17, rankChange: -2 },
  { username: 'aleks_v', displayName: 'Aleksander Volkov', avatar: null, problemsSolved: 158, rating: 1822, contestsPlayed: 28, rankChange: 2 },
  { username: 'noor_h', displayName: 'Noor Haddad', avatar: null, problemsSolved: 143, rating: 1760, contestsPlayed: 14, rankChange: 7 },
  { username: 'pablo_g', displayName: 'Pablo Gómez', avatar: null, problemsSolved: 129, rating: 1694, contestsPlayed: 21, rankChange: -5 },
  { username: 'hana_p', displayName: 'Hana Park', avatar: null, problemsSolved: 114, rating: 1622, contestsPlayed: 12, rankChange: 1 },
  { username: 'liam_ok', displayName: "Liam O'Keefe", avatar: null, problemsSolved: 98, rating: 1548, contestsPlayed: 16, rankChange: 0 },
  { username: 'zara_i', displayName: 'Zara Iqbal', avatar: null, problemsSolved: 81, rating: 1470, contestsPlayed: 9, rankChange: 3 },
];

const GLOBAL_ENTRIES = RANKED_USERS.map((user, index) => ({ ...user, rank: index + 1 }));

export async function getGlobalLeaderboard(options = {}) {
  const { search = '', page = 1, pageSize = 10, currentUsername = null } = options;
  await delay(260);

  const query = search.trim().toLowerCase();
  const filtered = GLOBAL_ENTRIES.filter((entry) => {
    if (!query) return true;
    return entry.username.toLowerCase().includes(query) || entry.displayName.toLowerCase().includes(query);
  });

  const total = filtered.length;
  const start = (page - 1) * pageSize;

  return {
    items: filtered.slice(start, start + pageSize),
    total,
    page,
    pageSize,
    // The signed-in user's own standing, returned alongside the page so the
    // UI can pin it even when their rank falls outside the visible page.
    // Null when they are not ranked (or nobody is signed in).
    currentUserEntry: currentUsername ? GLOBAL_ENTRIES.find((entry) => entry.username === currentUsername) || null : null,
  };
}

// Deterministic pseudo-random so a given contest always produces the same
// standings across reloads, instead of reshuffling on every request.
function seededValue(seed, max) {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash % max;
}

function buildContestStandings(contest) {
  const participantPool = RANKED_USERS.slice(0, Math.min(RANKED_USERS.length, 18));
  const totalProblems = contest.problems.length;
  const maxScore = contest.problems.reduce((sum, entry) => sum + entry.points, 0);

  return participantPool
    .map((user) => {
      const seed = `${contest.slug}:${user.username}`;
      const solved = seededValue(seed, totalProblems + 1);
      // Score the first `solved` problems in listed order, so score always
      // stays consistent with the contest's real point values.
      const score = contest.problems.slice(0, solved).reduce((sum, entry) => sum + entry.points, 0);
      const penaltyMinutes = solved === 0 ? 0 : 20 + seededValue(`${seed}:penalty`, contest.durationMinutes);
      return { username: user.username, displayName: user.displayName, avatar: user.avatar, solved, score, penaltyMinutes, totalProblems, maxScore };
    })
    .sort((a, b) => b.score - a.score || a.penaltyMinutes - b.penaltyMinutes || a.username.localeCompare(b.username))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function getContestLeaderboard(slug, options = {}) {
  const { page = 1, pageSize = 10, currentUsername = null } = options;
  // Throws ContestNotFoundError for an unknown slug — reused deliberately so
  // the contest leaderboard handles bad slugs exactly like the other
  // contest pages do.
  const contest = await contestService.getContest(slug);
  await delay(200);

  // A contest that has not started has no standings yet; the UI shows its
  // empty state rather than fabricating results.
  const standings = contest.status === 'Upcoming' ? [] : buildContestStandings(contest);
  const total = standings.length;
  const start = (page - 1) * pageSize;

  return {
    contest: {
      slug: contest.slug,
      title: contest.title,
      status: contest.status,
      participantCount: contest.participantCount,
      problemCount: contest.problems.length,
    },
    items: standings.slice(start, start + pageSize),
    total,
    page,
    pageSize,
    currentUserEntry: currentUsername ? standings.find((entry) => entry.username === currentUsername) || null : null,
  };
}

export const leaderboardService = {
  getGlobalLeaderboard,
  getContestLeaderboard,
};
