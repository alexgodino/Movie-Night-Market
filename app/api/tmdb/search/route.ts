import { NextResponse } from "next/server";

type TmdbSearchMovie = {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  release_date: string;
};

type TmdbMovieDetails = TmdbSearchMovie & {
  runtime: number | null;
};

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p";

function getAuthHeaders(): Record<string, string> {
  const token = process.env.TMDB_ACCESS_TOKEN?.trim() || process.env.TMDB_BEARER_TOKEN?.trim();

  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

function withApiKey(url: URL) {
  const apiKey = process.env.TMDB_API_KEY?.trim();

  if (apiKey) {
    url.searchParams.set("api_key", apiKey);
  }

  return url;
}

async function tmdbFetch<T>(path: string, params: Record<string, string> = {}) {
  const url = withApiKey(new URL(`${TMDB_BASE_URL}${path}`));
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`TMDB request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

function posterUrl(path: string | null, size: "w92" | "w500") {
  return path ? `${TMDB_IMAGE_BASE_URL}/${size}${path}` : null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  if (
    !process.env.TMDB_API_KEY?.trim() &&
    !process.env.TMDB_ACCESS_TOKEN?.trim() &&
    !process.env.TMDB_BEARER_TOKEN?.trim()
  ) {
    return NextResponse.json(
      { error: "TMDB_API_KEY or TMDB_ACCESS_TOKEN is not configured." },
      { status: 500 },
    );
  }

  try {
    const search = await tmdbFetch<{ results: TmdbSearchMovie[] }>("/search/movie", {
      query,
      language: "en-US",
      include_adult: "false",
      page: "1",
    });

    const details = await Promise.all(
      search.results.slice(0, 6).map((movie) => tmdbFetch<TmdbMovieDetails>(`/movie/${movie.id}`)),
    );

    return NextResponse.json({
      results: details.map((movie) => ({
        id: movie.id,
        title: movie.title,
        overview: movie.overview,
        posterUrl: posterUrl(movie.poster_path, "w500"),
        thumbnailUrl: posterUrl(movie.poster_path, "w92"),
        year: movie.release_date ? Number(movie.release_date.slice(0, 4)) : null,
        runtimeMinutes: movie.runtime ?? null,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not search TMDB.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
