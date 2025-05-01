import { NextResponse } from "next/server";
import { Octokit } from "@octokit/rest";

// Initialize Octokit with GitHub token
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

// Cache duration - 24 hours
const CACHE_DURATION = 24 * 60 * 60;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path");

  if (!path) {
    return NextResponse.json(
      { error: "Path parameter is required" },
      { status: 400 }
    );
  }

  try {
    const response = await octokit.repos.getContent({
      owner: "leftmove",
      repo: "facebook.js",
      path: `src/${path}`,
    });

    if ("content" in response.data) {
      // Decode base64 content
      const content = Buffer.from(response.data.content, "base64").toString();

      // Create response with caching headers
      return new NextResponse(JSON.stringify({ content }), {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate`,
        },
      });
    }

    return NextResponse.json({ error: "File not found" }, { status: 404 });
  } catch (error) {
    console.error("Error fetching GitHub content:", error);
    return NextResponse.json(
      { error: "Failed to fetch content from GitHub" },
      { status: 500 }
    );
  }
}
