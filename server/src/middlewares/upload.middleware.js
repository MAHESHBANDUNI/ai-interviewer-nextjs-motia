export const handleUpload = async (req, ctx, next) => {
    ctx.logger.info('Body: ',req);
  try {
    if (!req.rawBody) {
      return {
        status: 400,
        body: { error: "Resume file is required" }
      };
    }

    const contentType = req.headers["content-type"] ?? "";

    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];

    if (!allowed.includes(contentType)) {
      return {
        status: 400,
        body: { error: "Only PDF, DOC, DOCX allowed" }
      };
    }

    req.file = {
      buffer: req.rawBody,
      mimetype: contentType,
      size: req.rawBody.length
    };

    return next();

  } catch (err) {
    ctx.logger.error("Upload error:", err);
    return {
      status: 500,
      body: { error: "Upload failed" }
    };
  }
};
