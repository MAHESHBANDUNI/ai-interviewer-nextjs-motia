import { StatusCodes } from 'http-status-codes';

export const errorHandlerMiddleware = async (req, context, next) => {
  const { logger, response } = context;

  try {
    // Run next middleware/handler
    return await next();
  } catch (error) {
    ctx.logger.error('recent error', { error: error.error })

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
      ctx.logger.error('Authorization error', { error: error.error })
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
      status: error.status || StatusCodes.INTERNAL_SERVER_ERROR,
      body: {
        ...error,
        message: error.message,
        ...(process.env === 'development' && { stack: error.stack })
      }
    };
  }
};
