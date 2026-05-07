import { readFile } from "fs/promises";
import { extname, join } from "path";
import { NextResponse } from "next/server";

type Props = {
  params: Promise<{
    file: string;
  }>;
};

const contentTypes: Record<string, string> = {
  ".gif": "image/gif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

function getPosterUploadDir() {
  return (
    process.env.POSTER_UPLOAD_DIR?.trim() ||
    join(/*turbopackIgnore: true*/ process.cwd(), "public", "uploads")
  );
}

export async function GET(_request: Request, { params }: Props) {
  const { file } = await params;

  if (!/^[a-z0-9][a-z0-9.-]*\.(gif|jpe?g|png|webp)$/i.test(file)) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const extension = extname(file).toLowerCase();
    const bytes = await readFile(join(getPosterUploadDir(), file));

    return new NextResponse(bytes, {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Type": contentTypes[extension] ?? "application/octet-stream",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
