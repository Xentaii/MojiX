export function createClassName(...values: Array<string | undefined | false>) {
  return values.filter(Boolean).join(' ');
}

export function formatEmojiName(name: string) {
  if (name !== name.toUpperCase()) {
    return name.charAt(0).toLocaleUpperCase() + name.slice(1);
  }

  return name
    .toLowerCase()
    .replace(/\b([a-z])/g, (match) => match.toUpperCase());
}
