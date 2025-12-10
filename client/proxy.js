import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Role configurations
const ROLE_CONFIG = {
  Admin: {
    dashboard: "/admin/dashboard",
    allowedPaths: ["/admin"],
    apiPrefixes: ["/api/admin", "/api/revalidate",'/api/inngest'],
  },
  Candidate: {
    dashboard: "/candidate/interviews",
    allowedPaths: ["/candidate"],
    apiPrefixes: ["/api/candidates",'/api/assemblyai-token','/api/tts','/api/inngest'],
    authRoutes: [
      "/auth/signin"
    ],
    signoutRedirect: "/auth/signin",
  },
};

// Public routes
const PUBLIC_ROUTES = [
  "/auth/signin",
  "/auth/signup",
  "/api/public",
  "/api/auth",
  "/api/inngest"
];

export default withAuth(
  function proxy(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // 1. Handle signout redirects
    if (pathname === "/auth/signout" || pathname === "/api/auth/signout") {
      return NextResponse.redirect(
        new URL("/auth/signin", req.url)
      );
    }

    // 2. Check public routes
    if (isPublicRoute(pathname)) return NextResponse.next();

    // 3. Check interview links
    if (pathname.startsWith("/candidate/interviews")) {
      if (!token) {
        const signinUrl = new URL("/auth/signin", req.url);
        return NextResponse.redirect(signinUrl);
      }
      else if(token.role != 'Candidate'){
        const redirectUrl = new URL(ROLE_CONFIG[token.role].dashboard, req.url);
        console.log('req url',req.url);
        return NextResponse.redirect(redirectUrl);
      }
      return NextResponse.next();
    }

    // 4. Handle API routes
    if (pathname.startsWith("/api")) {
      return handleApiRoute(req, token);
    }

    // 5. Redirect unauthenticated users
    if (!token) {
      const signinUrl = new URL(
        "/auth/signin",
        req.url
      );
      return NextResponse.redirect(signinUrl);
    }

    // 6. Role-based access control
    const userRole = token.role;
    const roleConfig = ROLE_CONFIG[userRole];

    if (!roleConfig) {
      const signinUrl = "/auth/signin";
      return NextResponse.redirect(new URL(signinUrl, req.url));
    }

    // Check if route is allowed for this role
    const isAllowedRoute = roleConfig.allowedPaths.some((p) =>
      pathname.startsWith(p)
    );

    if (!isAllowedRoute) {
      return NextResponse.redirect(new URL(roleConfig.dashboard, req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        const { pathname } = req.nextUrl;

        // Allow public routes
        if (isPublicRoute(pathname)) {
          return true;
        }

        // Other protected routes just need valid token
        return !!token;
      },
    },
    pages: {
      signIn: "/auth/signin", // Default signin page
      error: "/auth/signin", // Default error page
    },
  }
);

// Helper functions
function isPublicRoute(pathname) {
  return PUBLIC_ROUTES.some((route) => {
    if (route === "/") return pathname === "/";
    return pathname.startsWith(route);
  });
}

function handleApiRoute(req, token) {
  const { pathname } = new URL(req.url);

  if (isPublicRoute(pathname)) return NextResponse.next();

  if (!token) return unauthorizedResponse();

  const userRole = token.role;
  const roleConfig = ROLE_CONFIG[userRole];

  if (!roleConfig) return forbiddenResponse();

  const isAllowedApiRoute = roleConfig.apiPrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (!isAllowedApiRoute) {
    return forbiddenResponse();
  }

  return NextResponse.next();
}

function unauthorizedResponse() {
  return new NextResponse(
    JSON.stringify({ success: false, message: "Unauthorized" }),
    { status: 401, headers: { "Content-Type": "application/json" } }
  );
}

function forbiddenResponse() {
  return new NextResponse(
    JSON.stringify({ success: false, message: "Forbidden" }),
    { status: 403, headers: { "Content-Type": "application/json" } }
  );
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images|processor\\.js|api/inngest).*)',
  ],
};

