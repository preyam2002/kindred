import NextAuth from "next-auth";
import Twitter from "next-auth/providers/twitter";
import type { Account, User as NextAuthUser, Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import type { NextAuthConfig } from "next-auth";
import { supabase } from "@/lib/db/supabase";

// Extended types for custom properties
interface ExtendedUser extends NextAuthUser {
  dbUserId?: string;
  dbUsername?: string;
}

interface TwitterAccount extends Account {
  screen_name?: string;
}

export const authOptions: NextAuthConfig = {
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true, // Required for production deployments - uses request headers for redirect URIs
  providers: [
    Twitter({
      clientId: process.env.TWITTER_CLIENT_ID || "",
      clientSecret: process.env.TWITTER_CLIENT_SECRET || "",
      // Use OAuth 2.0 (required for X/Twitter)
      authorization: {
        url: "https://x.com/i/oauth2/authorize",
        params: {
          scope: "users.read tweet.read offline.access",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }: { user: ExtendedUser; account?: Account | null }) {
      // Handle Twitter/X OAuth (may not have email)
      if (account?.provider === "twitter") {
        try {
          // Validate Supabase configuration
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
          const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
          
          if (!supabaseUrl || !supabaseAnonKey) {
            console.error("Supabase environment variables are not configured");
            return false;
          }

          const twitterId = account.providerAccountId;

          if (!twitterId) {
            console.error("Twitter providerAccountId is missing");
            return false;
          }

          const screenName =
            (account as TwitterAccount).screen_name || user.name || `twitter_${twitterId}`;

          // Generate a placeholder email if none provided (Twitter often doesn't provide email)
          const email = user.email || `twitter_${twitterId}@twitter.local`;

          // Check if user exists by email (or by Twitter ID if we stored it)
          // Retry on network errors
          let existingUser = null;
          let lookupError = null;
          let lookupAttempts = 0;
          const maxLookupAttempts = 3;
          
          while (lookupAttempts < maxLookupAttempts) {
            const result = await supabase
              .from("users")
              .select("*")
              .eq("email", email)
              .maybeSingle();
            
            existingUser = result.data;
            lookupError = result.error;
            
            // Check if it's a network error
            const isNetworkError = lookupError && (
              lookupError.message?.includes("fetch failed") ||
              lookupError.message?.includes("TypeError") ||
              lookupError.message?.includes("ECONNREFUSED") ||
              lookupError.message?.includes("ENOTFOUND")
            );
            
            if (!lookupError || !isNetworkError) {
              break; // Success or non-network error
            }
            
            // Retry on network error with exponential backoff
            lookupAttempts++;
            if (lookupAttempts < maxLookupAttempts) {
              const delay = Math.min(1000 * Math.pow(2, lookupAttempts - 1), 5000);
              console.warn(`Network error during lookup, retrying in ${delay}ms (attempt ${lookupAttempts}/${maxLookupAttempts})`);
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }

          // Log any lookup errors but continue (might be a new user)
          if (lookupError) {
            console.error("Error looking up Twitter user:", lookupError);
          }

          if (!existingUser) {
            // Create new user with Twitter username
            // Clean and validate username
            let username = screenName
              .replace(/[^a-zA-Z0-9_]/g, "")
              .substring(0, 50);
            if (!username || username.length < 3) {
              username = `twitter_${twitterId}`.substring(0, 50);
            }

            // Try to insert, if username conflict, try with Twitter ID suffix
            let insertError = null;
            let attempts = 0;
            let finalUsername = username;

            while (attempts < 3) {
              // Build insert data without avatar if column doesn't exist
              const insertData: {
                email: string;
                username: string;
                avatar?: string;
              } = {
                email,
                username: finalUsername,
              };

              // Only add avatar if we have an image (will fail gracefully if column doesn't exist)
              if (user.image) {
                insertData.avatar = user.image;
              }

              const { data: insertedUser, error } = await supabase
                .from("users")
                .insert(insertData)
                .select()
                .single();

              if (!error && insertedUser) {
                insertError = null;
                console.log("Successfully created Twitter user:", {
                  id: insertedUser.id,
                  username: insertedUser.username,
                  email: insertedUser.email,
                });
                // Store the user ID immediately so JWT callback can use it
                user.dbUserId = insertedUser.id;
                user.dbUsername = insertedUser.username;
                break;
              }

              if (!error) {
                insertError = null;
                break;
              }

              console.error(`Insert attempt ${attempts + 1} failed:`, {
                code: error.code,
                message: error.message,
                details: error.details,
                hint: error.hint,
              });

              // Check if it's a network error
              const isNetworkError = error.message?.includes("fetch failed") ||
                error.message?.includes("TypeError") ||
                error.message?.includes("ECONNREFUSED") ||
                error.message?.includes("ENOTFOUND");

              // Retry on network errors with exponential backoff
              if (isNetworkError && attempts < 2) {
                const delay = Math.min(1000 * Math.pow(2, attempts), 5000);
                console.warn(`Network error during insert, retrying in ${delay}ms (attempt ${attempts + 1}/3)`);
                await new Promise(resolve => setTimeout(resolve, delay));
                attempts++;
                insertError = error;
                continue;
              }

              // Check for avatar column missing error (PGRST204)
              const isAvatarColumnMissing =
                error.code === "PGRST204" && error.message?.includes("avatar");

              // If avatar column is missing, retry without avatar
              if (isAvatarColumnMissing && insertData.avatar && attempts < 2) {
                console.warn(
                  "Avatar column not found, retrying without avatar"
                );
                delete insertData.avatar;
                attempts++;
                insertError = error;
                continue;
              }

              // Check for username conflict (PostgreSQL unique constraint violation)
              const isUsernameConflict =
                error.code === "23505" &&
                (error.message?.includes("username") ||
                  error.message?.includes("users_username_key"));

              // Check for email conflict
              const isEmailConflict =
                error.code === "23505" &&
                (error.message?.includes("email") ||
                  error.message?.includes("users_email_key"));

              if (isUsernameConflict && attempts < 2) {
                finalUsername = `${username}_${twitterId.substring(
                  0,
                  10
                )}`.substring(0, 50);
                attempts++;
                insertError = error;
                continue;
              } else if (isEmailConflict) {
                // Email already exists - user might already be in system, try to find them
                console.log(
                  "Email conflict detected, checking if user exists:",
                  email
                );
                const { data: existingByEmail } = await supabase
                  .from("users")
                  .select("*")
                  .eq("email", email)
                  .maybeSingle();

                if (existingByEmail) {
                  console.log(
                    "User already exists with this email, skipping insert"
                  );
                  // Store the user ID for JWT callback
                  user.dbUserId = existingByEmail.id;
                  user.dbUsername = existingByEmail.username;
                  insertError = null;
                  break;
                }
              }

              insertError = error;
              break;
            }

            if (insertError) {
              console.error(
                "Error creating Twitter user after retries:",
                insertError
              );
              console.error("Twitter user data:", {
                email,
                username: finalUsername,
                image: user.image,
                twitterId,
                screenName,
              });
              return false;
            }
          } else {
            // User exists - store ID for JWT callback
            user.dbUserId = existingUser.id;
            user.dbUsername = existingUser.username;

            // Update existing user (avatar and username might have changed)
            const updateData: { avatar?: string; username?: string } = {};
            if (user.image && user.image !== existingUser.avatar) {
              updateData.avatar = user.image;
            }

            // Update username if screen_name changed (but keep it safe)
            const newUsername = screenName
              .replace(/[^a-zA-Z0-9_]/g, "")
              .substring(0, 50);
            if (
              newUsername &&
              newUsername.length >= 3 &&
              newUsername !== existingUser.username
            ) {
              // Check if new username is available
              const { data: usernameCheck } = await supabase
                .from("users")
                .select("id")
                .eq("username", newUsername)
                .maybeSingle();

              if (!usernameCheck || usernameCheck.id === existingUser.id) {
                updateData.username = newUsername;
              }
            }

            // Only update if there's something to update
            if (Object.keys(updateData).length > 0) {
              const { error: updateError } = await supabase
                .from("users")
                .update(updateData)
                .eq("id", existingUser.id);

              if (updateError) {
                console.error("Error updating Twitter user:", updateError);
                // Don't fail sign-in if update fails
              }
            }
          }
        } catch (error) {
          console.error("Unexpected error in Twitter signIn callback:", error);
          // Return false only for critical errors
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }: { token: JWT; user?: ExtendedUser; account?: Account | null }) {
      // When user signs in, store their ID in the token
      if (user) {
        // Check if signIn callback stored the user ID (for Twitter/OAuth users)
        if (user.dbUserId) {
          token.id = user.dbUserId;
          token.username = user.dbUsername || user.name || undefined;
          return token;
        }

        // If user already has an ID (from credentials provider), use it
        if (user.id) {
          token.id = user.id;
          token.username = user.dbUsername || user.name || undefined;
        } else if (user.email) {
          // For OAuth providers, fetch user ID from database
          const { data: dbUser, error: emailError } = await supabase
            .from("users")
            .select("id, username")
            .eq("email", user.email)
            .maybeSingle();

          if (dbUser) {
            token.id = dbUser.id;
            token.username = dbUser.username;
          } else if (emailError) {
            console.error(
              "Error fetching user by email in JWT callback:",
              emailError
            );
          }
        }

        // If we still don't have a user ID, try provider-specific lookups
        if (!token.id) {
          if (account?.provider === "twitter" && account.providerAccountId) {
            // Handle Twitter users - try both email patterns
            const twitterId = account.providerAccountId;
            const twitterEmail =
              user.email || `twitter_${twitterId}@twitter.local`;

            // Try to find by email first
            let { data: dbUser } = await supabase
              .from("users")
              .select("id, username")
              .eq("email", twitterEmail)
              .maybeSingle();

            // If not found and email was placeholder, try the actual Twitter email if provided
            if (!dbUser && user.email && user.email !== twitterEmail) {
              const { data: altUser } = await supabase
                .from("users")
                .select("id, username")
                .eq("email", user.email)
                .maybeSingle();
              if (altUser) dbUser = altUser;
            }

            if (dbUser) {
              token.id = dbUser.id;
              token.username = dbUser.username;
            } else {
              console.error(
                `Twitter user not found in database after sign-in. Email: ${twitterEmail}, Twitter ID: ${twitterId}`
              );
            }
          }
        }
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      // Use token data (which has the ID) if available
      if (token.id) {
        session.user.id = token.id as string;
        session.user.username = (token.username as string) || undefined;
      } else if (session.user?.email) {
        // Fallback: fetch from database if token doesn't have ID
        const { data: user, error: userError } = await supabase
          .from("users")
          .select("id, username")
          .eq("email", session.user.email)
          .maybeSingle();

        if (user) {
          session.user.id = user.id;
          session.user.username = user.username;
        } else if (userError) {
          console.error("Error fetching user in session callback:", userError);
        } else {
          console.warn(
            `User not found in session callback for email: ${session.user.email}`
          );
        }
      }

      // If still no ID, log warning
      if (!session.user.id) {
        console.error("Session callback: No user ID found for session", {
          email: session.user?.email,
          tokenId: token.id,
          tokenUsername: token.username,
        });
      }

      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
};

// Create and export the auth handler
export const { auth, handlers, signIn, signOut } = NextAuth(authOptions);

