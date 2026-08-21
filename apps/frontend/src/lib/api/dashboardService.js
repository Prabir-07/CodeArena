// Development adapter for the Dashboard / Progress experience.
//
// There is no Dashboard/Progress backend yet — this module composes the
// existing Problem and Judge development adapters, plus a little mock data
// of its own, into the shapes a future real Dashboard API would plausibly
// return. Every value here is derived from local mock data or hardcoded —
// no network requests are made, and nothing is tied to the signed-in user's
// real activity (there is no Judge Service tracking that yet).
export const DASHBOARD_SERVICE_MODE = 'development';

import { judgeService } from './judgeService';
import { problemService } from './problemService';

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Matches the "7 day streak" shown on the anonymous homepage hero, so the
// app's mock numbers don't contradict themselves.
const MOCK_CURRENT_STREAK_DAYS = 7;

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

// Problems Solved/Attempted are derived from problemService's mock progress
// data (not a separate invented number) so the Dashboard never disagrees
// with what /problems shows. Total Submissions is likewise the real count of
// the Judge adapter's mock submission history, not an arbitrary figure.
export async function getStats() {
  await delay(180);
  const [breakdown, submissions] = await Promise.all([problemService.getProgressSummary(), judgeService.getSubmissionHistory()]);
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
  return problemService.getProgressSummary();
}

export async function getRecentActivity(limit = 6) {
  await delay(200);
  return MOCK_ACTIVITY.slice(0, limit);
}

// Enriches Judge Service submissions (which only know a problem's slug) with
// the problem's title from the Problem Service adapter, so the UI never has
// to reach into two adapters itself.
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
