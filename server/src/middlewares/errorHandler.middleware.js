import { ApiError } from "../utils/apiError.util";

export const errorHandlerMiddleware = async (req, ctx, next) => {
  const { logger, response } = ctx;

  try {
    // Run next middleware/handler
    return await next();
  } catch (error) {
    logger.error('recent error', { error: error.error })

    // If the error is not an ApiError, convert it
    if (!(error instanceof ApiError)) {
      const status =
        error.status ||
        (error.name === 'PrismaClientKnownRequestError' ? 400 : 500);

      const message = error.message || 'Internal Server Error';

      error = new ApiError(
        status,
        message,
        error.errors || [],
        err.stack
      );
    }

    if (error.status === 401) {
      logger.error('Authorization error', { error: error.error })
      return { status: 401, body: { error: error.error } }
    }

    // Structured logging
    logger.error({
      status: error.status || 500,
      message: error.message,
      ...(process.env === 'development' && { stack: error.stack })
    });

    // Final fallback response
    return {
      status: error.status || 500,
      body: {
        ...error,
        message: error.message,
        ...(process.env.MOTIA_ENV === 'development' && { stack: error.stack })
      }
    };
  }
};
