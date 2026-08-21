// Development adapter for the Problem Service.
//
// The real Problem Service has no implemented backend yet. This module
// simulates its interface against local mock data so the Problems UI can be
// built now against a stable contract, and swapped for a real HTTP adapter
// later (see lib/api/userService.js for what that looks like) without any
// component needing to change. No network requests are made here.
export const PROBLEM_SERVICE_MODE = 'development';

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class ProblemNotFoundError extends Error {
  constructor(slug) {
    super(`Problem "${slug}" was not found.`);
    this.slug = slug;
  }
}

// Mock "my progress" per problem — there is no Judge Service tracking real
// submissions yet, so this is fixed demo data, not derived from any user.
const PROBLEMS = [
  {
    slug: 'two-sum',
    title: 'Two Sum',
    difficulty: 'Easy',
    tags: ['Array', 'Hash Table'],
    status: 'solved',
    acceptanceRate: 54.2,
    solvedCount: 812_340,
    submissionCount: 1_498_920,
    summary: 'Find two numbers in an array that add up to a target value.',
    description:
      'Given an array of integers and a target value, return the indices of the two numbers that add up to the target.\n\nYou may assume each input has exactly one valid pair, and you may not use the same element twice. Return the answer in any order.',
    examples: [
      { input: 'nums = [2, 7, 11, 15], target = 9', output: '[0, 1]', explanation: 'nums[0] + nums[1] = 2 + 7 = 9.' },
      { input: 'nums = [3, 2, 4], target = 6', output: '[1, 2]', explanation: 'nums[1] + nums[2] = 2 + 4 = 6.' },
    ],
    constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9', 'Exactly one valid answer exists.'],
    signature: { name: 'twoSum', params: ['nums', 'target'] },
  },
  {
    slug: 'valid-parentheses',
    title: 'Valid Parentheses',
    difficulty: 'Easy',
    tags: ['String', 'Stack'],
    status: 'attempted',
    acceptanceRate: 41.6,
    solvedCount: 601_204,
    submissionCount: 1_445_710,
    summary: 'Decide whether a string of brackets is properly closed and nested.',
    description:
      "Given a string made only of the characters '(', ')', '{', '}', '[' and ']', determine whether every opening bracket is closed by the same type of bracket, and brackets are closed in the correct order.",
    examples: [
      { input: 's = "()[]{}"', output: 'true', explanation: 'Every bracket is matched and correctly nested.' },
      { input: 's = "(]"', output: 'false', explanation: "The '(' is closed by ']' instead of ')'." },
    ],
    constraints: ['1 <= s.length <= 10^4', "s consists only of the characters '()[]{}'."],
    signature: { name: 'isValid', params: ['s'] },
  },
  {
    slug: 'climbing-stairs',
    title: 'Climbing Stairs',
    difficulty: 'Easy',
    tags: ['Dynamic Programming', 'Math'],
    status: 'todo',
    acceptanceRate: 51.9,
    solvedCount: 498_112,
    submissionCount: 959_430,
    summary: 'Count the distinct ways to climb n stairs taking 1 or 2 steps at a time.',
    description:
      'You are climbing a staircase with n steps. Each move you can climb either 1 or 2 steps. Return the number of distinct sequences of moves that reach the top.',
    examples: [
      { input: 'n = 2', output: '2', explanation: 'Reach the top with (1, 1) or (2).' },
      { input: 'n = 3', output: '3', explanation: 'Reach the top with (1,1,1), (1,2), or (2,1).' },
    ],
    constraints: ['1 <= n <= 45'],
    signature: { name: 'climbStairs', params: ['n'] },
  },
  {
    slug: 'reverse-linked-list',
    title: 'Reverse Linked List',
    difficulty: 'Easy',
    tags: ['Linked List', 'Recursion'],
    status: 'solved',
    acceptanceRate: 72.3,
    solvedCount: 705_884,
    submissionCount: 976_120,
    summary: 'Reverse the direction of a singly linked list in place.',
    description: 'Given the head of a singly linked list, reverse the list and return the new head.',
    examples: [
      { input: 'head = [1,2,3,4,5]', output: '[5,4,3,2,1]', explanation: 'Every next-pointer is flipped.' },
      { input: 'head = []', output: '[]', explanation: 'An empty list reverses to itself.' },
    ],
    constraints: ['The number of nodes is in the range [0, 5000].', '-5000 <= Node.val <= 5000'],
    signature: { name: 'reverseList', params: ['head'] },
  },
  {
    slug: 'add-two-numbers',
    title: 'Add Two Numbers',
    difficulty: 'Medium',
    tags: ['Linked List', 'Math'],
    status: 'todo',
    acceptanceRate: 39.4,
    solvedCount: 388_204,
    submissionCount: 984_760,
    summary: 'Add two numbers represented as reversed digit linked lists.',
    description:
      'You are given two non-empty linked lists representing two non-negative integers, with digits stored in reverse order, one digit per node. Add the two numbers and return the sum as a linked list in the same reversed-digit form.',
    examples: [
      { input: 'l1 = [2,4,3], l2 = [5,6,4]', output: '[7,0,8]', explanation: '342 + 465 = 807.' },
      { input: 'l1 = [0], l2 = [0]', output: '[0]', explanation: '0 + 0 = 0.' },
    ],
    constraints: ['The number of nodes in each list is in the range [1, 100].', '0 <= Node.val <= 9', 'Neither list has leading zeros, except the number 0 itself.'],
    signature: { name: 'addTwoNumbers', params: ['l1', 'l2'] },
  },
  {
    slug: 'longest-substring-without-repeating-characters',
    title: 'Longest Substring Without Repeating Characters',
    difficulty: 'Medium',
    tags: ['String', 'Sliding Window', 'Hash Table'],
    status: 'attempted',
    acceptanceRate: 34.1,
    solvedCount: 610_552,
    submissionCount: 1_789_230,
    summary: 'Find the length of the longest run of a string with no repeated characters.',
    description: 'Given a string, find the length of the longest contiguous substring that contains no repeating characters.',
    examples: [
      { input: 's = "abcabcbb"', output: '3', explanation: 'The longest such substring is "abc".' },
      { input: 's = "bbbbb"', output: '1', explanation: 'The longest such substring is "b".' },
    ],
    constraints: ['0 <= s.length <= 5 * 10^4', 's consists of English letters, digits, symbols, and spaces.'],
    signature: { name: 'lengthOfLongestSubstring', params: ['s'] },
  },
  {
    slug: 'merge-intervals',
    title: 'Merge Intervals',
    difficulty: 'Medium',
    tags: ['Array', 'Sorting'],
    status: 'todo',
    acceptanceRate: 46.7,
    solvedCount: 355_009,
    submissionCount: 761_440,
    summary: 'Collapse a list of intervals so that none of the remaining ones overlap.',
    description:
      'Given an array of intervals where each interval is [start, end], merge all overlapping intervals and return an array of the non-overlapping intervals that cover every interval in the input.',
    examples: [
      { input: 'intervals = [[1,3],[2,6],[8,10],[15,18]]', output: '[[1,6],[8,10],[15,18]]', explanation: '[1,3] and [2,6] overlap and merge into [1,6].' },
      { input: 'intervals = [[1,4],[4,5]]', output: '[[1,5]]', explanation: 'Intervals touching at an endpoint are considered overlapping.' },
    ],
    constraints: ['1 <= intervals.length <= 10^4', 'intervals[i].length == 2', '0 <= start <= end <= 10^5'],
    signature: { name: 'merge', params: ['intervals'] },
  },
  {
    slug: 'course-schedule',
    title: 'Course Schedule',
    difficulty: 'Medium',
    tags: ['Graph', 'Topological Sort', 'Breadth-First Search'],
    status: 'todo',
    acceptanceRate: 45.8,
    solvedCount: 289_004,
    submissionCount: 630_910,
    summary: 'Decide whether every course can be finished given its prerequisites.',
    description:
      'There are n courses labeled 0 to n - 1. You are given a list of prerequisite pairs [a, b] meaning course a requires course b to be completed first. Return true if it is possible to finish all courses.',
    examples: [
      { input: 'numCourses = 2, prerequisites = [[1,0]]', output: 'true', explanation: 'Take course 0, then course 1.' },
      { input: 'numCourses = 2, prerequisites = [[1,0],[0,1]]', output: 'false', explanation: 'Course 0 and 1 depend on each other, forming a cycle.' },
    ],
    constraints: ['1 <= numCourses <= 2000', '0 <= prerequisites.length <= 5000'],
    signature: { name: 'canFinish', params: ['numCourses', 'prerequisites'] },
  },
  {
    slug: 'binary-tree-level-order-traversal',
    title: 'Binary Tree Level Order Traversal',
    difficulty: 'Medium',
    tags: ['Tree', 'Breadth-First Search'],
    status: 'attempted',
    acceptanceRate: 63.5,
    solvedCount: 421_330,
    submissionCount: 663_500,
    summary: 'Return a binary tree’s node values grouped level by level.',
    description: 'Given the root of a binary tree, return the values of its nodes grouped by level, from top to bottom, left to right within each level.',
    examples: [
      { input: 'root = [3,9,20,null,null,15,7]', output: '[[3],[9,20],[15,7]]', explanation: 'Level 0 has 3, level 1 has 9 and 20, level 2 has 15 and 7.' },
      { input: 'root = []', output: '[]', explanation: 'An empty tree has no levels.' },
    ],
    constraints: ['The number of nodes is in the range [0, 2000].', '-1000 <= Node.val <= 1000'],
    signature: { name: 'levelOrder', params: ['root'] },
  },
  {
    slug: 'median-of-two-sorted-arrays',
    title: 'Median of Two Sorted Arrays',
    difficulty: 'Hard',
    tags: ['Array', 'Binary Search', 'Divide and Conquer'],
    status: 'todo',
    acceptanceRate: 28.3,
    solvedCount: 154_882,
    submissionCount: 547_910,
    summary: 'Find the median of two already-sorted arrays in logarithmic time.',
    description:
      'Given two sorted arrays, return the median of the combined set of all their elements. An efficient solution runs in O(log(m+n)) time, better than simply merging both arrays.',
    examples: [
      { input: 'nums1 = [1,3], nums2 = [2]', output: '2.0', explanation: 'The merged array is [1,2,3]; its median is 2.' },
      { input: 'nums1 = [1,2], nums2 = [3,4]', output: '2.5', explanation: 'The merged array is [1,2,3,4]; its median is (2+3)/2.' },
    ],
    constraints: ['nums1.length + nums2.length >= 1', '-10^6 <= nums1[i], nums2[i] <= 10^6'],
    signature: { name: 'findMedianSortedArrays', params: ['nums1', 'nums2'] },
  },
  {
    slug: 'n-queens',
    title: 'N-Queens',
    difficulty: 'Hard',
    tags: ['Backtracking'],
    status: 'todo',
    acceptanceRate: 58.9,
    solvedCount: 98_442,
    submissionCount: 167_120,
    summary: 'Place n chess queens on an n×n board so that none attack each other.',
    description:
      'The n-queens puzzle asks for a placement of n queens on an n×n chessboard such that no two queens share a row, column, or diagonal. Return every distinct board arrangement that satisfies this, each represented as a list of strings using \'Q\' and \'.\'.',
    examples: [
      { input: 'n = 4', output: '[[".Q..","...Q","Q...","..Q."],["..Q.","Q...","...Q",".Q.."]]', explanation: 'There are exactly two distinct solutions for a 4×4 board.' },
      { input: 'n = 1', output: '[["Q"]]', explanation: 'A single queen trivially satisfies the constraints.' },
    ],
    constraints: ['1 <= n <= 9'],
    signature: { name: 'solveNQueens', params: ['n'] },
  },
];

function toSummary(problem) {
  const { slug, title, difficulty, tags, status, acceptanceRate, summary } = problem;
  return { slug, title, difficulty, tags, status, acceptanceRate, summary };
}

function findProblem(slug) {
  return PROBLEMS.find((problem) => problem.slug === slug) || null;
}

export async function listProblems(filters = {}) {
  const { search = '', difficulty = 'all', tag = 'all', status = 'all', page = 1, pageSize = 8 } = filters;
  await delay(280);

  const query = search.trim().toLowerCase();
  const filtered = PROBLEMS.filter((problem) => {
    if (query && !problem.title.toLowerCase().includes(query)) return false;
    if (difficulty !== 'all' && problem.difficulty !== difficulty) return false;
    if (tag !== 'all' && !problem.tags.includes(tag)) return false;
    if (status !== 'all' && problem.status !== status) return false;
    return true;
  });

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize).map(toSummary);

  return { items, total, page, pageSize };
}

export async function getProblem(slug) {
  await delay(220);
  const problem = findProblem(slug);
  if (!problem) throw new ProblemNotFoundError(slug);
  return problem;
}

export async function getProblemStats(slug) {
  await delay(160);
  const problem = findProblem(slug);
  if (!problem) throw new ProblemNotFoundError(slug);
  const { difficulty, acceptanceRate, solvedCount, submissionCount } = problem;
  return { difficulty, acceptanceRate, solvedCount, submissionCount };
}

export async function getProblemTags() {
  await delay(120);
  const counts = new Map();
  for (const problem of PROBLEMS) {
    for (const tag of problem.tags) {
      counts.set(tag, (counts.get(tag) || 0) + 1);
    }
  }
  return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([tag, count]) => ({ tag, count }));
}

// Aggregates the same mock "my progress" status used by the Problems list
// (see the comment on PROBLEMS above) by difficulty, so anything showing
// solved/attempted counts — e.g. the Dashboard — always agrees with /problems.
export async function getProgressSummary() {
  await delay(120);
  const byDifficulty = new Map();
  for (const problem of PROBLEMS) {
    const entry = byDifficulty.get(problem.difficulty) || { difficulty: problem.difficulty, solved: 0, attempted: 0, total: 0 };
    entry.total += 1;
    if (problem.status === 'solved') entry.solved += 1;
    if (problem.status === 'attempted') entry.attempted += 1;
    byDifficulty.set(problem.difficulty, entry);
  }
  const order = ['Easy', 'Medium', 'Hard'];
  return order.filter((difficulty) => byDifficulty.has(difficulty)).map((difficulty) => byDifficulty.get(difficulty));
}

export const problemService = {
  listProblems,
  getProblem,
  getProblemStats,
  getProblemTags,
  getProgressSummary,
};
