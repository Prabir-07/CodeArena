// Development adapter for the Contest Service.
//
// There is no Contest Service backend yet — this module simulates its
// interface against local mock data, composing the existing Problem Service
// adapter for each contest's problems (so problem statements/examples/
// constraints are never duplicated). No network requests are made here.
export const CONTEST_SERVICE_MODE = 'development';

import { problemService } from './problemService';

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class ContestNotFoundError extends Error {
  constructor(slug) {
    super(`Contest "${slug}" was not found.`);
    this.slug = slug;
  }
}

function minutesFromNow(minutes) {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

export function computeStatus(startTime, endTime, now = new Date()) {
  const start = new Date(startTime);
  const end = new Date(endTime);
  if (now < start) return 'Upcoming';
  if (now > end) return 'Completed';
  return 'Running';
}

export function statusTone(status) {
  if (status === 'Running') return 'success';
  if (status === 'Upcoming') return 'warning';
  return 'neutral';
}

const STANDARD_RULES = [
  'Each problem has a fixed point value; there is no partial credit.',
  'You may submit as many times as you like — only your best accepted submission counts.',
  'Any language available in the editor may be used for any problem.',
  'Standard per-problem time and memory limits apply.',
];

// Mock contest schedule, timed relative to whenever this loads so the mix of
// Upcoming/Running/Completed stays correct no matter when it's viewed —
// same approach as judgeService's/dashboardService's mock timestamps.
const CONTESTS = [
  {
    slug: 'weekly-sprint-42',
    title: 'Weekly Sprint #42',
    startTime: minutesFromNow(-40),
    endTime: minutesFromNow(80),
    durationMinutes: 120,
    participantCount: 1240,
    description: 'A fast-paced weekly contest covering core data structures. Solve as many problems as you can within the time limit.',
    rules: STANDARD_RULES,
    problems: [
      { slug: 'two-sum', points: 100 },
      { slug: 'valid-parentheses', points: 150 },
      { slug: 'merge-intervals', points: 250 },
      { slug: 'course-schedule', points: 350 },
    ],
  },
  {
    slug: 'two-pointers-and-strings',
    title: 'Two Pointers & Strings',
    startTime: minutesFromNow(-10),
    endTime: minutesFromNow(110),
    durationMinutes: 120,
    participantCount: 2103,
    description: 'Sharpen your two-pointer and sliding-window technique across three curated problems.',
    rules: STANDARD_RULES,
    problems: [
      { slug: 'valid-parentheses', points: 100 },
      { slug: 'longest-substring-without-repeating-characters', points: 250 },
      { slug: 'merge-intervals', points: 300 },
    ],
  },
  {
    slug: 'beginner-arena',
    title: 'Beginner Arena',
    startTime: minutesFromNow(2 * 24 * 60),
    endTime: minutesFromNow(2 * 24 * 60 + 90),
    durationMinutes: 90,
    participantCount: 340,
    description: 'A gentle, no-pressure contest for newcomers still building confidence with the fundamentals.',
    rules: [...STANDARD_RULES, 'There is no penalty for wrong submissions — take your time.'],
    problems: [
      { slug: 'climbing-stairs', points: 100 },
      { slug: 'reverse-linked-list', points: 100 },
      { slug: 'valid-parentheses', points: 150 },
    ],
  },
  {
    slug: 'backtracking-bash',
    title: 'Backtracking Bash',
    startTime: minutesFromNow(6 * 60),
    endTime: minutesFromNow(6 * 60 + 60),
    durationMinutes: 60,
    participantCount: 214,
    description: 'Two classic backtracking problems, back to back — precision over speed.',
    rules: STANDARD_RULES,
    problems: [
      { slug: 'climbing-stairs', points: 100 },
      { slug: 'n-queens', points: 400 },
    ],
  },
  {
    slug: 'algorithmic-clash-round-12',
    title: 'Algorithmic Clash — Round 12',
    startTime: minutesFromNow(-3 * 24 * 60 - 150),
    endTime: minutesFromNow(-3 * 24 * 60),
    durationMinutes: 150,
    participantCount: 8402,
    description: 'A mixed-difficulty round testing recursion, strings, and array manipulation under time pressure.',
    rules: STANDARD_RULES,
    problems: [
      { slug: 'add-two-numbers', points: 200 },
      { slug: 'longest-substring-without-repeating-characters', points: 300 },
      { slug: 'binary-tree-level-order-traversal', points: 300 },
      { slug: 'median-of-two-sorted-arrays', points: 500 },
    ],
  },
  {
    slug: 'graph-theory-marathon',
    title: 'Graph Theory Marathon',
    startTime: minutesFromNow(-10 * 24 * 60 - 180),
    endTime: minutesFromNow(-10 * 24 * 60),
    durationMinutes: 180,
    participantCount: 5614,
    description: 'An extended-format contest focused entirely on graph traversal and topological reasoning.',
    rules: [...STANDARD_RULES, 'This is an extended-format round with a longer time limit than usual.'],
    problems: [
      { slug: 'course-schedule', points: 300 },
      { slug: 'binary-tree-level-order-traversal', points: 250 },
      { slug: 'n-queens', points: 450 },
    ],
  },
];

function findContest(slug) {
  return CONTESTS.find((contest) => contest.slug === slug) || null;
}

function toSummary(contest) {
  const { slug, title, description, startTime, endTime, durationMinutes, participantCount, problems } = contest;
  return {
    slug,
    title,
    description,
    startTime,
    endTime,
    durationMinutes,
    participantCount,
    problemCount: problems.length,
    status: computeStatus(startTime, endTime),
  };
}

export async function listContests(filters = {}) {
  const { search = '', status = 'all', page = 1, pageSize = 6 } = filters;
  await delay(280);

  const query = search.trim().toLowerCase();
  const filtered = CONTESTS.filter((contest) => {
    if (query && !contest.title.toLowerCase().includes(query)) return false;
    if (status !== 'all' && computeStatus(contest.startTime, contest.endTime) !== status) return false;
    return true;
  });

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize).map(toSummary);

  return { items, total, page, pageSize };
}

// Returns the contest with each problem entry resolved to the full Problem
// Service object (title, difficulty, description, examples, ...), so pages
// never need to juggle two adapters themselves.
export async function getContest(slug) {
  await delay(220);
  const contest = findContest(slug);
  if (!contest) throw new ContestNotFoundError(slug);

  const problems = await Promise.all(
    contest.problems.map(async (entry, index) => ({
      slug: entry.slug,
      points: entry.points,
      order: index,
      problem: await problemService.getProblem(entry.slug),
    }))
  );

  return {
    slug: contest.slug,
    title: contest.title,
    description: contest.description,
    rules: contest.rules,
    startTime: contest.startTime,
    endTime: contest.endTime,
    durationMinutes: contest.durationMinutes,
    participantCount: contest.participantCount,
    status: computeStatus(contest.startTime, contest.endTime),
    problems,
  };
}

export const contestService = {
  listContests,
  getContest,
  computeStatus,
  statusTone,
};
