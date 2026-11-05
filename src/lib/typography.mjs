// Markdown bodies get curly apostrophes from Astro's smart punctuation, but frontmatter titles do not.
export const curlyApostrophes = (text) => text.replace(/(?<=[A-Za-z])'(?=[a-z])/g, '’');
