// Popular media items for demo/try mode
// Users rate these to get instant matches without signup

export interface DemoMediaItem {
  id: string;
  title: string;
  type: "movie" | "anime" | "book" | "music";
  year?: number;
  artist?: string;
  author?: string;
  imageUrl: string;
  description: string;
  genres?: string[];
  spotifyUrl?: string; // For music playback
}

export const DEMO_MOVIES: DemoMediaItem[] = [
  {
    id: "inception",
    title: "Inception",
    type: "movie",
    year: 2010,
    imageUrl: "https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
    description: "A thief who steals corporate secrets through dream-sharing technology",
    genres: ["Sci-Fi", "Action", "Thriller"],
  },
  {
    id: "pulp-fiction",
    title: "Pulp Fiction",
    type: "movie",
    year: 1994,
    imageUrl: "https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
    description: "Intertwining tales of crime and redemption in Los Angeles",
    genres: ["Crime", "Drama"],
  },
  {
    id: "shawshank",
    title: "The Shawshank Redemption",
    type: "movie",
    year: 1994,
    imageUrl: "https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
    description: "Two imprisoned men bond over years, finding redemption",
    genres: ["Drama"],
  },
  {
    id: "dark-knight",
    title: "The Dark Knight",
    type: "movie",
    year: 2008,
    imageUrl: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    description: "Batman faces the Joker in a battle for Gotham's soul",
    genres: ["Action", "Crime", "Drama"],
  },
  {
    id: "interstellar",
    title: "Interstellar",
    type: "movie",
    year: 2014,
    imageUrl: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    description: "A team of explorers travel through a wormhole in space",
    genres: ["Sci-Fi", "Drama", "Adventure"],
  },
  {
    id: "parasite",
    title: "Parasite",
    type: "movie",
    year: 2019,
    imageUrl: "https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
    description: "A poor family schemes to become employed by a wealthy family",
    genres: ["Thriller", "Drama", "Comedy"],
  },
  {
    id: "fight-club",
    title: "Fight Club",
    type: "movie",
    year: 1999,
    imageUrl: "https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
    description: "An insomniac and a soap salesman form an underground fight club",
    genres: ["Drama"],
  },
  {
    id: "godfather",
    title: "The Godfather",
    type: "movie",
    year: 1972,
    imageUrl: "https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
    description: "The aging patriarch of an organized crime dynasty transfers control",
    genres: ["Crime", "Drama"],
  },
];

export const DEMO_ANIME: DemoMediaItem[] = [
  {
    id: "death-note",
    title: "Death Note",
    type: "anime",
    year: 2006,
    imageUrl: "https://cdn.myanimelist.net/images/anime/9/9453.jpg",
    description: "A high school student discovers a supernatural notebook",
    genres: ["Mystery", "Supernatural", "Thriller"],
  },
  {
    id: "fmab",
    title: "Fullmetal Alchemist: Brotherhood",
    type: "anime",
    year: 2009,
    imageUrl: "https://cdn.myanimelist.net/images/anime/1223/96541.jpg",
    description: "Two brothers search for the Philosopher's Stone",
    genres: ["Action", "Adventure", "Drama"],
  },
  {
    id: "steins-gate",
    title: "Steins;Gate",
    type: "anime",
    year: 2011,
    imageUrl: "https://cdn.myanimelist.net/images/anime/5/73199.jpg",
    description: "A group of friends discover time travel",
    genres: ["Sci-Fi", "Thriller"],
  },
  {
    id: "aot",
    title: "Attack on Titan",
    type: "anime",
    year: 2013,
    imageUrl: "https://cdn.myanimelist.net/images/anime/10/47347.jpg",
    description: "Humanity fights for survival against giant humanoid Titans",
    genres: ["Action", "Drama", "Fantasy"],
  },
  {
    id: "cowboy-bebop",
    title: "Cowboy Bebop",
    type: "anime",
    year: 1998,
    imageUrl: "https://cdn.myanimelist.net/images/anime/4/19644.jpg",
    description: "A bounty hunter crew travels through space",
    genres: ["Action", "Sci-Fi"],
  },
  {
    id: "one-punch",
    title: "One Punch Man",
    type: "anime",
    year: 2015,
    imageUrl: "https://cdn.myanimelist.net/images/anime/12/76049.jpg",
    description: "A hero who can defeat any opponent with a single punch",
    genres: ["Action", "Comedy"],
  },
  {
    id: "demon-slayer",
    title: "Demon Slayer",
    type: "anime",
    year: 2019,
    imageUrl: "https://cdn.myanimelist.net/images/anime/1286/99889.jpg",
    description: "A boy fights demons to save his sister",
    genres: ["Action", "Supernatural"],
  },
  {
    id: "code-geass",
    title: "Code Geass",
    type: "anime",
    year: 2006,
    imageUrl: "https://cdn.myanimelist.net/images/anime/5/50331.jpg",
    description: "A prince gains the power to control minds",
    genres: ["Action", "Drama", "Mecha"],
  },
];

export const DEMO_BOOKS: DemoMediaItem[] = [
  {
    id: "1984",
    title: "1984",
    type: "book",
    author: "George Orwell",
    year: 1949,
    imageUrl: "https://covers.openlibrary.org/b/id/7222246-L.jpg",
    description: "A dystopian social science fiction novel",
    genres: ["Dystopian", "Political Fiction"],
  },
  {
    id: "harry-potter",
    title: "Harry Potter and the Sorcerer's Stone",
    type: "book",
    author: "J.K. Rowling",
    year: 1997,
    imageUrl: "https://covers.openlibrary.org/b/id/10521270-L.jpg",
    description: "A young wizard discovers his magical heritage",
    genres: ["Fantasy", "Adventure"],
  },
  {
    id: "hobbit",
    title: "The Hobbit",
    type: "book",
    author: "J.R.R. Tolkien",
    year: 1937,
    imageUrl: "https://covers.openlibrary.org/b/id/8486410-L.jpg",
    description: "A hobbit's unexpected journey",
    genres: ["Fantasy", "Adventure"],
  },
  {
    id: "gatsby",
    title: "The Great Gatsby",
    type: "book",
    author: "F. Scott Fitzgerald",
    year: 1925,
    imageUrl: "https://covers.openlibrary.org/b/id/7222168-L.jpg",
    description: "A critique of the American Dream in the Jazz Age",
    genres: ["Classic", "Fiction"],
  },
  {
    id: "mockingbird",
    title: "To Kill a Mockingbird",
    type: "book",
    author: "Harper Lee",
    year: 1960,
    imageUrl: "https://covers.openlibrary.org/b/id/8228691-L.jpg",
    description: "A novel about racial injustice in the American South",
    genres: ["Classic", "Fiction"],
  },
  {
    id: "pride-prejudice",
    title: "Pride and Prejudice",
    type: "book",
    author: "Jane Austen",
    year: 1813,
    imageUrl: "https://covers.openlibrary.org/b/id/8400589-L.jpg",
    description: "A romantic novel of manners",
    genres: ["Romance", "Classic"],
  },
  {
    id: "dune",
    title: "Dune",
    type: "book",
    author: "Frank Herbert",
    year: 1965,
    imageUrl: "https://covers.openlibrary.org/b/id/8551916-L.jpg",
    description: "A science fiction epic set on a desert planet",
    genres: ["Sci-Fi", "Adventure"],
  },
  {
    id: "catcher",
    title: "The Catcher in the Rye",
    type: "book",
    author: "J.D. Salinger",
    year: 1951,
    imageUrl: "https://covers.openlibrary.org/b/id/8465893-L.jpg",
    description: "A teenager's journey through New York City",
    genres: ["Classic", "Coming-of-age"],
  },
];

export const DEMO_MUSIC: DemoMediaItem[] = [
  {
    id: "bohemian-rhapsody",
    title: "Bohemian Rhapsody",
    type: "music",
    artist: "Queen",
    year: 1975,
    imageUrl: "https://i.scdn.co/image/ab67616d0000b273ce4f1737bc8a646c8c4bd25a",
    description: "An iconic rock opera by Queen",
    genres: ["Rock", "Progressive Rock"],
    spotifyUrl: "spotify:track:4u7EnebtmKWzUH433cf5Qv",
  },
  {
    id: "hotel-california",
    title: "Hotel California",
    type: "music",
    artist: "Eagles",
    year: 1976,
    imageUrl: "https://i.scdn.co/image/ab67616d0000b2734637341b9f507521afa9a778",
    description: "A haunting rock classic",
    genres: ["Rock", "Classic Rock"],
    spotifyUrl: "spotify:track:40riOy7x9W7GXjyGp4pjAv",
  },
  {
    id: "smells-like-teen-spirit",
    title: "Smells Like Teen Spirit",
    type: "music",
    artist: "Nirvana",
    year: 1991,
    imageUrl: "https://i.scdn.co/image/ab67616d0000b273e175a19e530c898d167d39bf",
    description: "Grunge anthem that defined a generation",
    genres: ["Grunge", "Alternative Rock"],
    spotifyUrl: "spotify:track:4CeeEOM32jQcH3eN9Q2dGj",
  },
  {
    id: "imagine",
    title: "Imagine",
    type: "music",
    artist: "John Lennon",
    year: 1971,
    imageUrl: "https://i.scdn.co/image/ab67616d0000b2737b2e7a5b3f81e83e0f1e2666",
    description: "A timeless anthem for peace",
    genres: ["Pop", "Rock"],
    spotifyUrl: "spotify:track:7pKfPomDEeI4TPT6EOYjn9",
  },
  {
    id: "billie-jean",
    title: "Billie Jean",
    type: "music",
    artist: "Michael Jackson",
    year: 1983,
    imageUrl: "https://i.scdn.co/image/ab67616d0000b2735ec2893173b25094d10f6a02",
    description: "The King of Pop's signature hit",
    genres: ["Pop", "R&B"],
    spotifyUrl: "spotify:track:5ChkMS8OtdzJeqyybCc9R5",
  },
  {
    id: "wonderwall",
    title: "Wonderwall",
    type: "music",
    artist: "Oasis",
    year: 1995,
    imageUrl: "https://i.scdn.co/image/ab67616d0000b273a9f6c04ba168640b48aa5795",
    description: "Britpop anthem from the 90s",
    genres: ["Rock", "Britpop"],
    spotifyUrl: "spotify:track:1wRPtKvkXNmBa1f49QyL7s",
  },
  {
    id: "sweet-child",
    title: "Sweet Child O' Mine",
    type: "music",
    artist: "Guns N' Roses",
    year: 1987,
    imageUrl: "https://i.scdn.co/image/ab67616d0000b2731c04efd2804b16276319a470",
    description: "Hard rock classic with iconic guitar riff",
    genres: ["Hard Rock"],
    spotifyUrl: "spotify:track:7o2CTH4ctstm8TNelqjb51",
  },
  {
    id: "stairway",
    title: "Stairway to Heaven",
    type: "music",
    artist: "Led Zeppelin",
    year: 1971,
    imageUrl: "https://i.scdn.co/image/ab67616d0000b2737f9b18f2c7b878f78aa83d64",
    description: "Epic rock ballad",
    genres: ["Rock", "Hard Rock"],
    spotifyUrl: "spotify:track:5CQ30WqJwcep0pYcV4AMNc",
  },
];

export function getAllDemoMedia(): DemoMediaItem[] {
  return [...DEMO_MOVIES, ...DEMO_ANIME, ...DEMO_BOOKS, ...DEMO_MUSIC];
}

export function getRandomDemoMedia(count: number = 15): DemoMediaItem[] {
  const allMedia = getAllDemoMedia();
  const shuffled = [...allMedia].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function getDemoMediaByType(type: DemoMediaItem["type"]): DemoMediaItem[] {
  switch (type) {
    case "movie":
      return DEMO_MOVIES;
    case "anime":
      return DEMO_ANIME;
    case "book":
      return DEMO_BOOKS;
    case "music":
      return DEMO_MUSIC;
    default:
      return [];
  }
}
