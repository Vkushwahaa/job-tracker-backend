export function formatZodError(err) {
  const formatted = {};

  err.issues.forEach((issue) => {
    const field = issue.path[0];

    if (!formatted[field]) {
      formatted[field] = [];
    }

    formatted[field].push(issue.message);
  });

  return formatted;
}
