// Extracts LinkedIn post identifier including the URN type.
// Returns "activity:123456" or "ugcPost:123456" or "share:123456"
const URN_PATTERNS = [
  { regex: /activity[:\-](\d{15,22})/i, type: 'activity' },
  { regex: /ugcPost[:\-](\d{15,22})/i, type: 'ugcPost' },
  { regex: /share[:\-](\d{15,22})/i, type: 'share' },
];

export const extractActivityId = (url) => {
  if (!url) return null;
  for (const { regex, type } of URN_PATTERNS) {
    const match = url.match(regex);
    if (match) return `${type}:${match[1]}`;
  }
  return null;
};

export const isValidLinkedInPostUrl = (url) => {
  if (!url) return false;
  return url.toLowerCase().includes('linkedin.com') && !!extractActivityId(url);
};

// Builds embed URL from stored activity_id.
// Handles both new format "ugcPost:123" and legacy plain number "123".
export const buildEmbedUrl = (activityId) => {
  if (!activityId) return null;
  if (activityId.includes(':')) {
    const [type, id] = activityId.split(':');
    return `https://www.linkedin.com/embed/feed/update/urn:li:${type}:${id}`;
  }
  // Legacy: plain number defaults to activity
  return `https://www.linkedin.com/embed/feed/update/urn:li:activity:${activityId}`;
};
