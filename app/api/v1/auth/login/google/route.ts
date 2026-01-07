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
import type { GoogleOAuthRequestBody } from "@/lib/api-auth/types";

/**
 * POST /api/v1/auth/login/google
 * Login or register using Google OAuth idToken
 *
 * The client (Flutter/mobile app) should:
 * 1. Use Google Sign-In SDK to authenticate
 * 2. Get the idToken from the credential
 * 3. Send the idToken to this endpoint
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GoogleOAuthRequestBody;

    // Validate required fields
    const validation = validateRequired(body, ["idToken"]);
    if (!validation.valid) {
      return validation.response;
    }

    const { idToken } = body;

    // Verify the Google idToken
    const googleUserInfo = await verifyGoogleIdToken(idToken);
    if (!googleUserInfo) {
      return apiErrors.oauthError("Invalid Google token");
    }

    const { email, name, picture, sub: googleId } = googleUserInfo;

    // Check if user exists with this Google account
    let account = await db.account.findFirst({
      where: {
        providerId: "google",
        accountId: googleId,
      },
      include: { user: true },
    });

    let user;
    let isNewUser = false;

    if (account) {
      // Existing user with Google account
      user = account.user;
    } else {
      // Check if user exists with this email
      const existingUser = await db.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (existingUser) {
        // Link Google account to existing user
        await db.account.create({
          data: {
            id: crypto.randomUUID(),
            accountId: googleId,
            providerId: "google",
            userId: existingUser.id,
            accessToken: idToken,
          },
        });
        user = existingUser;
      } else {
        // Create new user with Google account
        const userId = crypto.randomUUID();
        user = await db.user.create({
          data: {
            id: userId,
            email: email.toLowerCase(),
            name: name || email.split("@")[0],
            image: picture,
            emailVerified: true, // Google emails are verified
            role: "Student",
          },
        });

        // Create the Google account link
        await db.account.create({
          data: {
            id: crypto.randomUUID(),
            accountId: googleId,
            providerId: "google",
            userId: user.id,
            accessToken: idToken,
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
    console.error("Google OAuth error:", error);
    return apiErrors.internalError();
  }
}

/**
 * Verify Google ID token and extract user info
 * Uses Google's tokeninfo endpoint for verification
 */
async function verifyGoogleIdToken(
  idToken: string
): Promise<GoogleUserInfo | null> {
  try {
    // Use Google's tokeninfo endpoint to verify the token
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`
    );

    if (!response.ok) {
      console.error("Google token verification failed:", response.status);
      return null;
    }

    const payload = await response.json();

    // Verify the token is for our app
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (payload.aud !== clientId) {
      console.error("Google token audience mismatch");
      return null;
    }

    // Verify token is not expired
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && parseInt(payload.exp) < now) {
      console.error("Google token expired");
      return null;
    }

    return {
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      emailVerified: payload.email_verified === "true",
    };
  } catch (error) {
    console.error("Error verifying Google token:", error);
    return null;
  }
}

interface GoogleUserInfo {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
  emailVerified: boolean;
}
