import { db } from "@/lib/db";
import {
  successResponse,
  apiErrors,
  validateRequired,
} from "@/lib/api-auth/response";
import {
  formatUserResponse,
  formatSessionResponse,
} from "@/lib/api-auth/middleware";
import type { GitHubOAuthRequestBody } from "@/lib/api-auth/types";

/**
 * POST /api/v1/auth/login/github
 * Login or register using GitHub OAuth authorization code
 *
 * The client (Flutter/mobile app) should:
 * 1. Open GitHub OAuth URL in a browser/webview
 * 2. Handle the callback and extract the authorization code
 * 3. Send the code to this endpoint
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GitHubOAuthRequestBody;

    // Validate required fields
    const validation = validateRequired(body, ["code"]);
    if (!validation.valid) {
      return validation.response;
    }

    const { code } = body;

    // Exchange authorization code for access token
    const tokenResponse = await exchangeCodeForToken(code);
    if (!tokenResponse) {
      return apiErrors.oauthError("Failed to exchange GitHub code for token");
    }

    // Fetch user info from GitHub
    const githubUser = await fetchGitHubUser(tokenResponse.access_token);
    if (!githubUser) {
      return apiErrors.oauthError("Failed to fetch GitHub user info");
    }

    // Get user's primary email if not public
    let email = githubUser.email;
    if (!email) {
      email = await fetchGitHubPrimaryEmail(tokenResponse.access_token);
    }

    if (!email) {
      return apiErrors.oauthError(
        "Could not retrieve email from GitHub. Please make sure your email is public or grant email permission."
      );
    }

    // Check if user exists with this GitHub account
    let account = await db.account.findFirst({
      where: {
        providerId: "github",
        accountId: githubUser.id.toString(),
      },
      include: { user: true },
    });

    let user;
    let isNewUser = false;

    if (account) {
      // Existing user with GitHub account
      user = account.user;

      // Update the access token
      await db.account.update({
        where: { id: account.id },
        data: { accessToken: tokenResponse.access_token },
      });
    } else {
      // Check if user exists with this email
      const existingUser = await db.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (existingUser) {
        // Link GitHub account to existing user
        await db.account.create({
          data: {
            id: crypto.randomUUID(),
            accountId: githubUser.id.toString(),
            providerId: "github",
            userId: existingUser.id,
            accessToken: tokenResponse.access_token,
          },
        });
        user = existingUser;
      } else {
        // Create new user with GitHub account
        const userId = crypto.randomUUID();
        user = await db.user.create({
          data: {
            id: userId,
            email: email.toLowerCase(),
            name: githubUser.name || githubUser.login,
            image: githubUser.avatar_url,
            emailVerified: true, // GitHub emails are verified
            role: "Student",
          },
        });

        // Create the GitHub account link
        await db.account.create({
          data: {
            id: crypto.randomUUID(),
            accountId: githubUser.id.toString(),
            providerId: "github",
            userId: user.id,
            accessToken: tokenResponse.access_token,
          },
        });

        isNewUser = true;
      }
    }

    // Create a session for the user
    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const session = await db.session.create({
      data: {
        id: crypto.randomUUID(),
        token: sessionToken,
        userId: user.id,
        expiresAt,
        ipAddress: request.headers.get("x-forwarded-for") || null,
        userAgent: request.headers.get("user-agent") || null,
      },
    });

    return successResponse({
      token: sessionToken,
      user: formatUserResponse(user),
      session: formatSessionResponse(session),
      isNewUser,
    });
  } catch (error) {
    console.error("GitHub OAuth error:", error);
    return apiErrors.internalError();
  }
}

/**
 * Exchange authorization code for access token
 */
async function exchangeCodeForToken(
  code: string
): Promise<GitHubTokenResponse | null> {
  try {
    const response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    if (!response.ok) {
      console.error("GitHub token exchange failed:", response.status);
      return null;
    }

    const data = await response.json();

    if (data.error) {
      console.error("GitHub token error:", data.error_description);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error exchanging GitHub code:", error);
    return null;
  }
}

/**
 * Fetch user info from GitHub API
 */
async function fetchGitHubUser(
  accessToken: string
): Promise<GitHubUser | null> {
  try {
    const response = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      console.error("GitHub user fetch failed:", response.status);
      return null;
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching GitHub user:", error);
    return null;
  }
}

/**
 * Fetch user's primary email from GitHub API
 */
async function fetchGitHubPrimaryEmail(
  accessToken: string
): Promise<string | null> {
  try {
    const response = await fetch("https://api.github.com/user/emails", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      return null;
    }

    const emails: GitHubEmail[] = await response.json();
    const primaryEmail = emails.find((e) => e.primary && e.verified);

    return primaryEmail?.email || null;
  } catch (error) {
    console.error("Error fetching GitHub emails:", error);
    return null;
  }
}

interface GitHubTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
}

interface GitHubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
}
