/**
 * Parses frontmatter from markdown content
 * @param content Markdown content with frontmatter
 * @returns An object containing metadata and the remaining content
 */
export const parseFrontmatter = (content: string) => {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
  const match = content.match(frontmatterRegex);
  
  const metadata: Record<string, any> = {};
  let body = content;

  if (match) {
    const frontmatterBlock = match[1];
    body = content.replace(frontmatterRegex, '').trim();
    
    frontmatterBlock.split('\n').forEach(line => {
      const [key, ...value] = line.split(':');
      if (key && value) {
        let val = value.join(':').trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        if (val.startsWith('[') && val.endsWith(']')) {
             metadata[key.trim()] = val.slice(1, -1).split(',').map(s => s.trim());
        } else {
             metadata[key.trim()] = val;
        }
      }
    });
  }
  return { metadata, body };
};
