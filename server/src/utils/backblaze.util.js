import B2 from "backblaze-b2";
import { error } from "console";
import { ApiError } from "./apiError.util";

const b2 = new B2({
  applicationKeyId: process.env.B2_APPLICATION_KEY_ID,
  applicationKey: process.env.B2_APPLICATION_KEY,
});

export const UploadResume = async (resume) => {
  if (!resume || !resume.data || !resume.filename) {
    throw new ApiError(400, "Invalid resume upload payload");
  }

  try {
    // 1️⃣ Convert base64 → buffer
    const buffer = Buffer.from(resume.data, "base64");

    // 2️⃣ Also get arrayBuffer to return
    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    );

    // 3️⃣ Authorize B2
    await b2.authorize();

    // 4️⃣ Generate unique filename
    const ext = resume.filename.split(".").pop();
    const uniqueFileName = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${ext}`;

    // 5️⃣ Prepare upload URL
    const uploadUrlResponse = await b2.getUploadUrl({
      bucketId: process.env.B2_BUCKET_ID,
    });

    const { uploadUrl, authorizationToken } = uploadUrlResponse.data;

    // 6️⃣ Upload to Backblaze
    await b2.uploadFile({
      uploadUrl,
      uploadAuthToken: authorizationToken,
      fileName: `documents/${uniqueFileName}`,
      data: buffer,
      contentType: resume.type,
    });

    // 7️⃣ Construct URL
    const fileUrl = `https://f005.backblazeb2.com/file/${process.env.B2_BUCKET_NAME}/documents/${uniqueFileName}`;

    return { arrayBuffer, fileUrl };
  } catch (err) {
    console.error("Backblaze upload error:", err);
    throw new ApiError(500, "Failed to upload resume");
  }
};


// export const UploadResume = async(resume) => {
//     await b2.authorize();

//     const buffer = Buffer.from(await resume.arrayBuffer());
//     const uniqueFileName = `${Date.now()}-resume`;
//     const arrayBuffer = await resume.arrayBuffer();

//     const uploadUrlResponse = await b2.getUploadUrl({
//       bucketId: process.env.B2_BUCKET_ID,
//     });

//     await b2.uploadFile({
//       uploadUrl: uploadUrlResponse.data.uploadUrl,
//       uploadAuthToken: uploadUrlResponse.data.authorizationToken,
//       fileName: `documents/${uniqueFileName}`,
//       data: buffer,
//       contentType: resume.type,
//     });

//     const fileUrl = `https://f005.backblazeb2.com/file/${process.env.B2_BUCKET_NAME}/documents/${uniqueFileName}`;

//     return {arrayBuffer, fileUrl}
//   }

// export const ViewResume = async({file}) => {
//   try{
//     if (!file) {
//       throw new ApiError(404, 'File not found');
//     }

//     // Authorize B2
//     await b2.authorize();

//     // Create temporary download authorization token
//     const { data: { authorizationToken } } = await b2.getDownloadAuthorization({
//       bucketId: process.env.B2_BUCKET_ID,
//       fileNamePrefix: file,
//       validDurationInSeconds: 3600, // 1 hour
//     });

//     // Construct raw B2 file URL
//     const fileUrl = `https://f005.backblazeb2.com/file/${process.env.B2_BUCKET_NAME}/${file}`;

//     // Fetch file with proper header
//     const fileResponse = await fetch(fileUrl, {
//       headers: {
//         Authorization: authorizationToken,
//       },
//     });

//     if (!fileResponse.ok) {
//       throw new ApiError(404, 'File not found');
//     }

//     const arrayBuffer = await fileResponse.arrayBuffer();
//     const pdfBytes = new Uint8Array(arrayBuffer);

//     return pdfBytes;
//   } catch (err) {
//     console.error(err);
//     throw new ApiError(400, `Failed to retrieve resume: ${file}`);
//   }
// }

// Node fetch is available in Node 18+
// If you're on older Node, uncomment the next line:
// const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));


// export const ViewResume = async (fileName) => {
//   if (!fileName) throw new ApiError(400, "fileName is required");

//   const B2_KEY_ID = process.env.B2_APPLICATION_KEY_ID;
//   const B2_APP_KEY = process.env.B2_APPLICATION_KEY;
//   const BUCKET_ID = process.env.B2_BUCKET_ID;
//   const BUCKET_NAME = process.env.B2_BUCKET_NAME;
//   const validDurationInSeconds = 60 * 60;

//   try {
//     // Basic authorization
//     const basicAuth =
//       "Basic " + Buffer.from(`${B2_KEY_ID}:${B2_APP_KEY}`).toString("base64");

//     // 1️⃣ authorize account
//     const authRes = await fetch(
//       "https://api.backblazeb2.com/b2api/v2/b2_authorize_account",
//       {
//         method: "GET",
//         headers: { Authorization: basicAuth },
//       }
//     );

//     const auth = await authRes.json();

//     if (!auth.downloadUrl || !auth.apiUrl) {
//       throw new ApiError(400, "Invalid Backblaze key: missing apiUrl/downloadUrl");
//     }

//     // 2️⃣ get download auth token
//     const downloadAuthRes = await fetch(
//       `${auth.apiUrl}/b2api/v2/b2_get_download_authorization`,
//       {
//         method: "POST",
//         headers: {
//           Authorization: auth.authorizationToken,
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           bucketId: BUCKET_ID,
//           fileNamePrefix: fileName,
//           validDurationInSeconds,
//         }),
//       }
//     );

//     const downloadAuth = await downloadAuthRes.json();

//     if (!downloadAuth.authorizationToken) {
//       throw new ApiError(400, 
//         `Download authorization failed: ${JSON.stringify(downloadAuth)}`
//       );
//     }

//     // 3️⃣ Build signed URL
//     const encoded = encodeURIComponent(fileName);
//     const signedUrl = 
//       `${auth.downloadUrl}/file/${BUCKET_NAME}/${encoded}` +
//       `?Authorization=${downloadAuth.authorizationToken}` +
//       `&b2ContentDisposition=inline`;

//     return {
//       url: signedUrl,
//       expiresAt: Date.now() + validDurationInSeconds * 1000,
//     };
//   } catch (err) {
//     throw new ApiError(400, `Failed to create Backblaze signed URL: ${err.message}`);
//   }
// };

export const ViewResume = async (fileName, logger) => {
  if (!fileName) throw new ApiError(400, "fileName is required");

  const B2_KEY_ID = process.env.B2_APPLICATION_KEY_ID;
  const B2_APP_KEY = process.env.B2_APPLICATION_KEY;
  const BUCKET_ID = process.env.B2_BUCKET_ID;
  const BUCKET_NAME = process.env.B2_BUCKET_NAME;

  const basicAuth =
    "Basic " + Buffer.from(`${B2_KEY_ID}:${B2_APP_KEY}`).toString("base64");

  // 1) Authorize
  const authRes = await fetch(
    "https://api.backblazeb2.com/b2api/v2/b2_authorize_account",
    {
      method: "GET",
      headers: { Authorization: basicAuth },
    }
  );

  const auth = await authRes.json();

  if (!auth.downloadUrl) {
    logger?.error("Invalid B2 authorization:", auth);
    throw new ApiError(400, "Failed to authorize Backblaze");
  }

  // 2) Build private download URL (NO SIGNED TOKEN REQUIRED)
  const encoded = encodeURIComponent(fileName);
  const privateUrl = `${auth.downloadUrl}/file/${BUCKET_NAME}/${encoded}`;

  // 3) Fetch file from Backblaze with master authorization
  const fileRes = await fetch(privateUrl, {
    method: "GET",
    headers: {
      Authorization: auth.authorizationToken,
    },
  });

  if (!fileRes.ok) {
    const txt = await fileRes.text();
    // logger?.error("Backblaze download failed:", txt);
    throw new ApiError(400, `Failed to fetch file: ${fileRes.status}`);
  }

  // Return the raw stream + headers
  return {
    stream: fileRes.body,
    contentType: fileRes.headers.get("content-type") || "application/pdf",
    contentLength: fileRes.headers.get("content-length"),
  };
};

