// These adapters intentionally make no network calls until their service contracts exist.
// Keeping the boundary here lets feature UI connect later without coupling to transport details.
export const problemService = { status: 'unavailable' };
export const judgeService = { status: 'unavailable' };
