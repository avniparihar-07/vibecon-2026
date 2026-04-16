// ---- LinkedIn ----
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

export const buildEmbedUrl = (activityId) => {
  if (!activityId) return null;
  if (activityId.includes(':')) {
    const [type, id] = activityId.split(':');
    return `https://www.linkedin.com/embed/feed/update/urn:li:${type}:${id}`;
  }
  return `https://www.linkedin.com/embed/feed/update/urn:li:activity:${activityId}`;
};

// ---- X / Twitter ----
const TWEET_REGEX = /(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/i;

export const extractTweetId = (url) => {
  if (!url) return null;
  const match = url.match(TWEET_REGEX);
  return match ? match[1] : null;
};

export const isValidTweetUrl = (url) => {
  if (!url) return false;
  return (url.toLowerCase().includes('x.com/') || url.toLowerCase().includes('twitter.com/')) && !!extractTweetId(url);
};

export const buildTweetEmbedUrl = (tweetId) => {
  if (!tweetId) return null;
  return `https://platform.twitter.com/embed/Tweet.html?id=${tweetId}&theme=light&dnt=true`;
};

// ---- Universal ----
// Returns { platform, id } or null
export const parsePostUrl = (url) => {
  if (!url) return null;

  const activityId = extractActivityId(url);
  if (activityId) return { platform: 'linkedin', id: activityId };

  const tweetId = extractTweetId(url);
  if (tweetId) return { platform: 'x', id: `tweet:${tweetId}` };

  return null;
};

export const isValidPostUrl = (url) => !!parsePostUrl(url);
