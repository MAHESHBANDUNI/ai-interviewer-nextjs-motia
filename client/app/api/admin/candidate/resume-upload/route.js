import { NextResponse } from "next/server";
import B2 from "backblaze-b2";

const b2 = new B2({
  applicationKeyId: process.env.B2_APPLICATION_KEY_ID,
  applicationKey: process.env.B2_APPLICATION_KEY,
});

export async function POST(req) {
  try {
    console.log('Enterred')
    const formData = await req.formData();
    const resume = formData.get("resume");

    if(!resume){
        return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    await b2.authorize();

    const buffer = Buffer.from(await resume.arrayBuffer());
    const uniqueFileName = `${Date.now()}-resume`;
    const arrayBuffer = await resume.arrayBuffer();

    const uploadUrlResponse = await b2.getUploadUrl({
      bucketId: process.env.B2_BUCKET_ID,
    });

    await b2.uploadFile({
      uploadUrl: uploadUrlResponse.data.uploadUrl,
      uploadAuthToken: uploadUrlResponse.data.authorizationToken,
      fileName: `documents/${uniqueFileName}`,
      data: buffer,
      contentType: resume.type,
    });

    const fileUrl = `https://f005.backblazeb2.com/file/${process.env.B2_BUCKET_NAME}/documents/${uniqueFileName}`;

    return NextResponse.json({ resumeUrl: fileUrl },{status: 200});
  }
  catch (err) {
    console.log("Error in uploading candidate resume:", err);
    return NextResponse.json({ error: "Error processing request" }, { status: 500 });
  }
}