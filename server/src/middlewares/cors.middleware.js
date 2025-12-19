export const corsMiddleware = async (req, ctx, next) => {
  const origin = req.headers?.origin;

  const allowedOrigins = [
    process.env.CLIENT_SERVER_URL
  ].filter(Boolean);

  const corsHeaders = {
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
    "Vary": "Origin",
  };

  // Reflect allowed origin
  if (origin && allowedOrigins.includes(origin)) {
    corsHeaders["Access-Control-Allow-Origin"] = origin;
  }

  // Handle preflight
  if (req.method === "OPTIONS") {
    return {
      status: 204,
      headers: corsHeaders,
    };
  }

  const response = await next();

  return {
    ...response,
    headers: {
      ...(response?.headers || {}),
      ...corsHeaders,
    },
  };
};
