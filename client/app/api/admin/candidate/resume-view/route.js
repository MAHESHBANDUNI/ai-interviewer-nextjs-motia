import B2 from "backblaze-b2";
import { NextResponse } from "next/server";

const b2 = new B2({
  applicationKeyId: process.env.B2_APPLICATION_KEY_ID,
  applicationKey: process.env.B2_APPLICATION_KEY,
});

export async function GET(req) {
  try {
    const fileName = req.nextUrl.searchParams.get("file");

    if (!fileName) {
      return new NextResponse("file is required", { status: 400 });
    }

    // Authorize B2
    await b2.authorize();

    // Create temporary download authorization token
    const { data: { authorizationToken } } = await b2.getDownloadAuthorization({
      bucketId: process.env.B2_BUCKET_ID,
      fileNamePrefix: fileName,
      validDurationInSeconds: 3600, // 1 hour
    });

    // Construct raw B2 file URL
    const fileUrl = `https://f005.backblazeb2.com/file/${process.env.B2_BUCKET_NAME}/${fileName}`;

    // Fetch file with proper header
    const fileResponse = await fetch(fileUrl, {
      headers: {
        Authorization: authorizationToken,
      },
    });

    if (!fileResponse.ok) {
      return new NextResponse("File not found", { status: 404 });
    }

    const blob = await fileResponse.blob();

    // Return as inline PDF so iframe can display it
    return new NextResponse(blob, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error(err);
    return new NextResponse("Server error", { status: 500 });
  }
}
