import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Hardcoded moods (these match the database seed data)
    // In production, these would come from the mood_tags table
    const moods = [
      {
        id: "1",
        name: "happy",
        description: "Uplifting and joyful content",
        category: "emotion",
        emoji: "😊",
      },
      {
        id: "2",
        name: "sad",
        description: "Melancholic and emotional content",
        category: "emotion",
        emoji: "😢",
      },
      {
        id: "3",
        name: "energetic",
        description: "High-energy and exciting content",
        category: "energy_level",
        emoji: "⚡",
      },
      {
        id: "4",
        name: "relaxing",
        description: "Calm and soothing content",
        category: "energy_level",
        emoji: "😌",
      },
      {
        id: "5",
        name: "thought-provoking",
        description: "Deep and philosophical content",
        category: "intellectual",
        emoji: "🤔",
      },
      {
        id: "6",
        name: "escapist",
        description: "Immersive fantasy and adventure",
        category: "purpose",
        emoji: "🌟",
      },
      {
        id: "7",
        name: "inspiring",
        description: "Motivational and uplifting",
        category: "emotion",
        emoji: "💪",
      },
      {
        id: "8",
        name: "nostalgic",
        description: "Reminiscent and sentimental",
        category: "emotion",
        emoji: "🕰️",
      },
      {
        id: "9",
        name: "thrilling",
        description: "Suspenseful and intense",
        category: "energy_level",
        emoji: "🎢",
      },
      {
        id: "10",
        name: "cozy",
        description: "Comfortable and warm content",
        category: "atmosphere",
        emoji: "☕",
      },
      {
        id: "11",
        name: "dark",
        description: "Mature and serious themes",
        category: "tone",
        emoji: "🌑",
      },
      {
        id: "12",
        name: "lighthearted",
        description: "Fun and easy-going",
        category: "tone",
        emoji: "🎈",
      },
      {
        id: "13",
        name: "romantic",
        description: "Love and relationships",
        category: "theme",
        emoji: "💕",
      },
      {
        id: "14",
        name: "adventurous",
        description: "Exploration and discovery",
        category: "theme",
        emoji: "🗺️",
      },
      {
        id: "15",
        name: "mysterious",
        description: "Intrigue and puzzles",
        category: "theme",
        emoji: "🔍",
      },
    ];

    return NextResponse.json({ moods });
  } catch (error) {
    console.error("Error fetching moods:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
