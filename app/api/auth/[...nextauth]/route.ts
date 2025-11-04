import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Twitter from "next-auth/providers/twitter";
import { supabase } from "@/lib/db/supabase";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true, // Required for production deployments
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    Twitter({
      clientId: process.env.TWITTER_CLIENT_ID || "",
      clientSecret: process.env.TWITTER_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Handle Google OAuth (always has email)
      if (account?.provider === "google" && user.email) {
        // Check if user exists
        const { data: existingUser } = await supabase
          .from("users")
          .select("*")
          .eq("email", user.email)
          .single();

        if (!existingUser) {
          // Create new user
          const username = user.email.split("@")[0];

          const insertData: {
            email: string;
            username: string;
            avatar?: string;
          } = {
            email: user.email,
            username,
          };

          // Only add avatar if we have an image
          if (user.image) {
            insertData.avatar = user.image;
          }

          const { error } = await supabase.from("users").insert(insertData);

          if (error) {
            console.error("Error creating user:", error);
            return false;
          }
        } else {
          // Update existing user (avatar might have changed)
          const updateData: { avatar?: string } = {};
          if (user.image && user.image !== existingUser.avatar) {
            updateData.avatar = user.image;
          }

          // Only update if there's something to update
          if (Object.keys(updateData).length > 0) {
            const { error: updateError } = await supabase
              .from("users")
              .update(updateData)
              .eq("id", existingUser.id);

            if (updateError) {
              console.error("Error updating user:", updateError);
              // Don't fail sign-in if update fails
            }
          }
        }
      }
      // Handle Twitter/X OAuth (may not have email)
      else if (account?.provider === "twitter") {
        try {
          const twitterId = account.providerAccountId;

          if (!twitterId) {
            console.error("Twitter providerAccountId is missing");
            return false;
          }

          const screenName =
            (account as any).screen_name || user.name || `twitter_${twitterId}`;

          // Generate a placeholder email if none provided (Twitter often doesn't provide email)
          const email = user.email || `twitter_${twitterId}@twitter.local`;

          // Check if user exists by email (or by Twitter ID if we stored it)
          const { data: existingUser, error: lookupError } = await supabase
            .from("users")
            .select("*")
            .eq("email", email)
            .maybeSingle();

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
                (user as any).dbUserId = insertedUser.id;
                (user as any).dbUsername = insertedUser.username;
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
                  (user as any).dbUserId = existingByEmail.id;
                  (user as any).dbUsername = existingByEmail.username;
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
            (user as any).dbUserId = existingUser.id;
            (user as any).dbUsername = existingUser.username;

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
    async jwt({ token, user, account }) {
      // When user signs in, store their ID in the token
      if (user) {
        // Check if signIn callback stored the user ID (for Twitter/OAuth users)
        if ((user as any).dbUserId) {
          token.id = (user as any).dbUserId;
          token.username =
            (user as any).dbUsername || (user as any).username || user.name;
          return token;
        }

        // If user already has an ID (from credentials provider), use it
        if (user.id) {
          token.id = user.id;
          token.username = (user as any).username || user.name;
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
    async session({ session, token }) {
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
});

export const { GET, POST } = handlers;
