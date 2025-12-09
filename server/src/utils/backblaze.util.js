import B2 from "backblaze-b2";

const b2 = new B2({
  applicationKeyId: process.env.B2_APPLICATION_KEY_ID,
  applicationKey: process.env.B2_APPLICATION_KEY,
});

export const UploadResume = async(resume) => {
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

    return {arrayBuffer, fileUrl}
  }
