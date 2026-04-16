// Mirror of backend/parse_linkedin.py — keep the regexes in sync.
const URN_PATTERNS = [
  /activity[:\-](\d{15,22})/i,
  /ugcPost[:\-](\d{15,22})/i,
  /share[:\-](\d{15,22})/i,
];

export const extractActivityId = (url) => {
  if (!url) return null;
  for (const pattern of URN_PATTERNS) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

export const isValidLinkedInPostUrl = (url) => {
  if (!url) return false;
  return url.toLowerCase().includes('linkedin.com') && !!extractActivityId(url);
};

export const buildEmbedUrl = (activityId) =>
  `https://www.linkedin.com/embed/feed/update/urn:li:activity:${activityId}`;
