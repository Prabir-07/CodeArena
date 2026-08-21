// Development adapter for the Dashboard / Progress experience.
//
// There is no Dashboard/Progress backend yet. Problem titles now come from
// the real Problem Service, but every progress figure below is mock data of
// this module's own: nothing here is tied to the signed-in user's real
// activity, because no Judge Service tracks it yet.
export const DASHBOARD_SERVICE_MODE = 'development';

import { judgeService } from './judgeService';
import { problemService } from './problemService';

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Matches the "7 day streak" shown on the anonymous homepage hero, so the
// app's mock numbers don't contradict themselves.
const MOCK_CURRENT_STREAK_DAYS = 7;

// Mock only. This used to be derived from a `status` field on the Problem
// Service mock's problem list; that adapter now calls the real Problem
// Service, which deliberately owns no per-user progress, so the breakdown
// lives here instead — alongside the rest of the Dashboard's mock data, and
// with the same values it showed before. It is replaced when submission data
// (Judge Service, or a read model built from it) can supply real counts.
const MOCK_PROGRESS_BY_DIFFICULTY = [
  { difficulty: 'Easy', solved: 2, attempted: 1, total: 4 },
  { difficulty: 'Medium', solved: 0, attempted: 2, total: 5 },
  { difficulty: 'Hard', solved: 0, attempted: 0, total: 2 },
];

async function getProgressSummary() {
  await delay(120);
  return MOCK_PROGRESS_BY_DIFFICULTY.map((entry) => ({ ...entry }));
}

function daysAgo(days) {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

// Mock only — there is no per-user activity feed without a real Judge/Problem
// Service, so these reference the same mock problems used elsewhere for
// consistency but are otherwise fabricated.
const MOCK_ACTIVITY = [
  { id: 'act-1', type: 'solved', problemSlug: 'two-sum', problemTitle: 'Two Sum', occurredAt: daysAgo(1) },
  { id: 'act-2', type: 'streak', detail: 'Reached a 7-day streak', occurredAt: daysAgo(1) },
  { id: 'act-3', type: 'attempted', problemSlug: 'longest-substring-without-repeating-characters', problemTitle: 'Longest Substring Without Repeating Characters', occurredAt: daysAgo(2) },
  { id: 'act-4', type: 'submitted', problemSlug: 'climbing-stairs', problemTitle: 'Climbing Stairs', occurredAt: daysAgo(3) },
  { id: 'act-5', type: 'solved', problemSlug: 'reverse-linked-list', problemTitle: 'Reverse Linked List', occurredAt: daysAgo(5) },
  { id: 'act-6', type: 'attempted', problemSlug: 'valid-parentheses', problemTitle: 'Valid Parentheses', occurredAt: daysAgo(6) },
];

// Problems Solved/Attempted are derived from the mock progress breakdown
// above (not a separate invented number) so the Dashboard's own figures stay
// consistent with each other. Total Submissions is likewise the real count of
// the Judge adapter's mock submission history, not an arbitrary figure.
export async function getStats() {
  await delay(180);
  const [breakdown, submissions] = await Promise.all([getProgressSummary(), judgeService.getSubmissionHistory()]);
  const problemsSolved = breakdown.reduce((sum, entry) => sum + entry.solved, 0);
  const problemsAttempted = breakdown.reduce((sum, entry) => sum + entry.attempted, 0);
  return {
    problemsSolved,
    problemsAttempted,
    totalSubmissions: submissions.length,
    currentStreakDays: MOCK_CURRENT_STREAK_DAYS,
  };
}

export async function getProgressOverview() {
  return getProgressSummary();
}

export async function getRecentActivity(limit = 6) {
  await delay(200);
  return MOCK_ACTIVITY.slice(0, limit);
}

// Enriches Judge Service submissions (which only know a problem's slug) with
// the problem's title from the real Problem Service, so the UI never has to
// reach into two adapters itself. A lookup failure falls back to the slug,
// which also keeps the Dashboard usable if the Problem Service is down.
export async function getRecentSubmissions(limit = 5) {
  await delay(220);
  const submissions = await judgeService.getSubmissionHistory();
  const sorted = [...submissions].sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)).slice(0, limit);
  return Promise.all(
    sorted.map(async (submission) => {
      let problemTitle = submission.slug;
      try {
        const problem = await problemService.getProblem(submission.slug);
        problemTitle = problem.title;
      } catch {
        // Keep the slug as a fallback label if the problem lookup fails.
      }
      return { ...submission, problemSlug: submission.slug, problemTitle };
    })
  );
}

export const dashboardService = {
  getStats,
  getProgressOverview,
  getRecentActivity,
  getRecentSubmissions,
};
