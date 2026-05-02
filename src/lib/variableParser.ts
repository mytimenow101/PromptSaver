const VARIABLE_PATTERN = /{{\s*([a-zA-Z0-9_-]+)\s*}}/g;

export const extractVariables = (promptBody: string): string[] => {
  const vars = new Set<string>();
  for (const match of promptBody.matchAll(VARIABLE_PATTERN)) {
    vars.add(match[1]);
  }
  return [...vars];
};

export const fillVariables = (body: string, values: Record<string, string>): string =>
  body.replace(VARIABLE_PATTERN, (_, key: string) => values[key] ?? "");
