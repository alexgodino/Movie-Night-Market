"use client";

import { useActionState, useState } from "react";
import { ImagePlus, Search } from "lucide-react";
import type { FormState } from "@/lib/actions";
import { createMovieNightAction } from "@/lib/actions";
import { formatRuntime } from "@/lib/format";

const initialState: FormState = {};
const optionNumbers = [1, 2, 3, 4, 5];

type PreviousRunnerUp = {
  title: string;
  year: number;
} | null;

type TmdbMovieResult = {
  id: number;
  title: string;
  overview: string;
  posterUrl: string | null;
  thumbnailUrl: string | null;
  year: number | null;
  runtimeMinutes: number | null;
};

function MovieOptionFields({ position }: { position: number }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TmdbMovieResult[]>([]);
  const [searchState, setSearchState] = useState<"idle" | "searching" | "error">("idle");
  const [message, setMessage] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [posterUrl, setPosterUrl] = useState("");
  const [year, setYear] = useState("");
  const [runtimeMinutes, setRuntimeMinutes] = useState("");

  async function searchTmdb() {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 2) {
      setMessage("Enter at least two characters to search.");
      setSearchState("error");
      return;
    }

    setSearchState("searching");
    setMessage("");

    try {
      const response = await fetch(`/api/tmdb/search?q=${encodeURIComponent(trimmedQuery)}`);
      const payload = (await response.json()) as {
        results?: TmdbMovieResult[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || "TMDB search failed.");
      }

      setResults(payload.results ?? []);
      setSearchState("idle");
      setMessage((payload.results ?? []).length === 0 ? "No matches found." : "");
    } catch (error) {
      setResults([]);
      setSearchState("error");
      setMessage(error instanceof Error ? error.message : "Could not search TMDB.");
    }
  }

  function selectMovie(movie: TmdbMovieResult) {
    setTitle(movie.title);
    setDescription(movie.overview);
    setPosterUrl(movie.posterUrl ?? "");
    setYear(movie.year ? String(movie.year) : "");
    setRuntimeMinutes(movie.runtimeMinutes ? String(movie.runtimeMinutes) : "");
    setResults([]);
    setQuery(movie.title);
    setMessage("Movie details filled in. You can still edit every field.");
    setSearchState("idle");
  }

  return (
    <section className="section-card rounded-[2rem] p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
        Movie {position}
      </p>
      <div className="mt-4 grid gap-4">
        <div>
          <label
            htmlFor={`movieSearch-${position}`}
            className="text-sm font-semibold text-[var(--ink-1)]"
          >
            Search TMDB
          </label>
          <div className="mt-2 flex gap-2">
            <input
              id={`movieSearch-${position}`}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void searchTmdb();
                }
              }}
              placeholder="Search movie title"
              className="min-w-0 flex-1 rounded-[1.4rem] border border-[var(--line)] bg-white px-4 py-4 text-base text-[var(--ink-1)] shadow-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
            />
            <button
              type="button"
              onClick={() => void searchTmdb()}
              disabled={searchState === "searching"}
              className="tap-button inline-flex items-center justify-center border border-[var(--line)] bg-white px-4 text-[var(--ink-1)]"
              aria-label={`Search TMDB for movie ${position}`}
            >
              <Search className="size-5" />
            </button>
          </div>
          {message ? (
            <p className="mt-2 text-sm font-medium text-[var(--ink-2)]">{message}</p>
          ) : null}
        </div>

        {results.length > 0 ? (
          <div className="grid gap-2">
            {results.map((movie) => (
              <button
                key={movie.id}
                type="button"
                onClick={() => selectMovie(movie)}
                className="flex w-full items-center gap-3 rounded-[1.25rem] border border-[var(--line)] bg-white p-2 text-left transition hover:border-[var(--accent-soft)]"
              >
                {movie.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={movie.thumbnailUrl}
                    alt=""
                    className="h-16 w-11 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <span className="h-16 w-11 shrink-0 rounded-lg bg-[var(--surface-2)]" />
                )}
                <span className="min-w-0">
                  <span className="block font-bold text-[var(--ink-1)]">{movie.title}</span>
                  <span className="block text-sm text-[var(--ink-2)]">
                    {movie.year ?? "Year TBD"}{" "}
                    {movie.runtimeMinutes ? `• ${formatRuntime(movie.runtimeMinutes)}` : ""}
                  </span>
                </span>
              </button>
            ))}
          </div>
        ) : null}

        <div>
          <label
            htmlFor={`movieTitle-${position}`}
            className="text-sm font-semibold text-[var(--ink-1)]"
          >
            Title
          </label>
          <input
            id={`movieTitle-${position}`}
            name={`movieTitle-${position}`}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            className="mt-2 w-full rounded-[1.4rem] border border-[var(--line)] bg-white px-4 py-4 text-lg text-[var(--ink-1)] shadow-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor={`movieYear-${position}`}
              className="text-sm font-semibold text-[var(--ink-1)]"
            >
              Year
            </label>
            <input
              id={`movieYear-${position}`}
              name={`movieYear-${position}`}
              value={year}
              onChange={(event) => setYear(event.target.value)}
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="2010"
              className="mt-2 w-full rounded-[1.4rem] border border-[var(--line)] bg-white px-4 py-4 text-base text-[var(--ink-1)] shadow-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
            />
          </div>
          <div>
            <label
              htmlFor={`movieRuntimeMinutes-${position}`}
              className="text-sm font-semibold text-[var(--ink-1)]"
            >
              Runtime
            </label>
            <input
              id={`movieRuntimeMinutes-${position}`}
              name={`movieRuntimeMinutes-${position}`}
              value={runtimeMinutes}
              onChange={(event) => setRuntimeMinutes(event.target.value)}
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="120"
              className="mt-2 w-full rounded-[1.4rem] border border-[var(--line)] bg-white px-4 py-4 text-base text-[var(--ink-1)] shadow-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor={`movieDescription-${position}`}
            className="text-sm font-semibold text-[var(--ink-1)]"
          >
            Description / blurb
          </label>
          <textarea
            id={`movieDescription-${position}`}
            name={`movieDescription-${position}`}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            required
            rows={4}
            className="mt-2 w-full resize-y rounded-[1.4rem] border border-[var(--line)] bg-white px-4 py-4 text-base leading-7 text-[var(--ink-1)] shadow-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
          />
        </div>

        <div>
          <label
            htmlFor={`moviePosterUrl-${position}`}
            className="text-sm font-semibold text-[var(--ink-1)]"
          >
            Poster image URL
          </label>
          <input
            id={`moviePosterUrl-${position}`}
            name={`moviePosterUrl-${position}`}
            type="url"
            inputMode="url"
            value={posterUrl}
            onChange={(event) => setPosterUrl(event.target.value)}
            placeholder="https://..."
            className="mt-2 w-full rounded-[1.4rem] border border-[var(--line)] bg-white px-4 py-4 text-base text-[var(--ink-1)] shadow-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
          />
        </div>

        <div>
          <label
            htmlFor={`moviePosterFile-${position}`}
            className="tap-button inline-flex w-full items-center justify-center gap-2 border border-[var(--line)] bg-white text-[var(--ink-1)]"
          >
            <ImagePlus className="size-5" />
            Upload poster instead
          </label>
          <input
            id={`moviePosterFile-${position}`}
            name={`moviePosterFile-${position}`}
            type="file"
            accept="image/*"
            className="sr-only"
          />
        </div>
      </div>
    </section>
  );
}

export function NightBuilder({ previousRunnerUp }: { previousRunnerUp: PreviousRunnerUp }) {
  const [state, action, pending] = useActionState(createMovieNightAction, initialState);
  const [includeRunnerUp, setIncludeRunnerUp] = useState(false);
  const activeOptionNumbers = includeRunnerUp && previousRunnerUp ? [1, 2, 3, 4] : optionNumbers;

  return (
    <form action={action} encType="multipart/form-data" className="space-y-5 pb-32">
      <section className="glass-panel rounded-[2rem] p-5">
        <h1 className="headline text-4xl">Create movie night</h1>
        <p className="mt-3 text-base leading-7 text-[var(--ink-2)]">
          Search TMDB to fill each option quickly, then edit anything before publishing.
        </p>
        <div className="mt-5 grid gap-4">
          <div>
            <label htmlFor="title" className="text-sm font-semibold text-[var(--ink-1)]">
              Night title
            </label>
            <input
              id="title"
              name="title"
              defaultValue="Friday Movie Night"
              className="mt-2 w-full rounded-[1.4rem] border border-[var(--line)] bg-white px-4 py-4 text-lg text-[var(--ink-1)] shadow-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
            />
          </div>
          <div>
            <label htmlFor="votingEndsAt" className="text-sm font-semibold text-[var(--ink-1)]">
              Optional voting close time
            </label>
            <input
              id="votingEndsAt"
              type="datetime-local"
              name="votingEndsAt"
              className="mt-2 w-full rounded-[1.4rem] border border-[var(--line)] bg-white px-4 py-4 text-lg text-[var(--ink-1)] shadow-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
            />
          </div>
          {previousRunnerUp ? (
            <label className="flex items-start gap-3 rounded-[1.4rem] border border-[var(--line)] bg-white px-4 py-4 text-left">
              <input
                type="checkbox"
                name="includeLastRunnerUp"
                checked={includeRunnerUp}
                onChange={(event) => setIncludeRunnerUp(event.target.checked)}
                className="mt-1 size-4 shrink-0 accent-[var(--surface-4)]"
              />
              <span>
                <span className="block text-sm font-bold text-[var(--ink-1)]">
                  Include last night&apos;s runner-up
                </span>
                <span className="mt-1 block text-sm text-[var(--ink-2)]">
                  Adds {previousRunnerUp.title} ({previousRunnerUp.year}) as the fifth option.
                </span>
              </span>
            </label>
          ) : null}
        </div>
      </section>

      {state.error ? (
        <p className="rounded-2xl border border-[var(--accent-soft)] bg-[#fff4ef] px-4 py-3 text-sm font-semibold text-[var(--accent-strong)]">
          {state.error}
        </p>
      ) : null}

      <div className="space-y-4">
        {activeOptionNumbers.map((position) => (
          <MovieOptionFields key={position} position={position} />
        ))}
        {includeRunnerUp && previousRunnerUp ? (
          <section className="section-card rounded-[2rem] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
              Movie 5
            </p>
            <h2 className="headline mt-2 text-2xl text-[var(--ink-1)]">
              {previousRunnerUp.title}
            </h2>
            <p className="mt-1 text-sm font-semibold text-[var(--ink-2)]">
              Last night&apos;s runner-up
            </p>
          </section>
        ) : null}
      </div>

      <div className="sticky-action-bar">
        <div className="mx-auto w-full max-w-3xl rounded-[1.6rem] border border-[var(--line)] bg-white/95 p-3 shadow-[0_16px_40px_rgba(23,33,31,0.14)]">
          <button
            type="submit"
            disabled={pending}
            className="tap-button w-full bg-[var(--accent)] text-lg text-white"
          >
            {pending ? "Creating night..." : "Create movie night"}
          </button>
        </div>
      </div>
    </form>
  );
}
