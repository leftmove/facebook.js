import { cache } from "react";

const GITHUB_API_URL = "https://api.github.com";
const REPO_OWNER = "leftmove";
const REPO_NAME = "facebook.js";

interface GitHubResponse {
  content: string;
  encoding: string;
  sha: string;
}

export const getReadme = cache(async () => {
  const response = await fetch(
    `${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}/readme`,
    {
      headers: {
        Accept: "application/vnd.github.v3+json",
        ...(process.env.GITHUB_TOKEN
          ? { Authorization: `token ${process.env.GITHUB_TOKEN}` }
          : {}),
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch README");
  }

  const data: GitHubResponse = await response.json();
  const content = Buffer.from(data.content, "base64").toString("utf-8");
  return content;
});

export const getRepoInfo = cache(async () => {
  const response = await fetch(
    `${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}`,
    {
      headers: {
        Accept: "application/vnd.github.v3+json",
        ...(process.env.GITHUB_TOKEN
          ? { Authorization: `token ${process.env.GITHUB_TOKEN}` }
          : {}),
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch repo info");
  }

  return response.json();
});
