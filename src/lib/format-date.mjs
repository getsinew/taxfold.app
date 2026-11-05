// The one date formatter. UTC so the build host's timezone can never move a date.
const medium = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeZone: 'UTC' });

export const formatDate = (date) => medium.format(date);
export const sameDay = (a, b) => a.toISOString().slice(0, 10) === b.toISOString().slice(0, 10);
