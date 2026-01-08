import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

function cleanApiErrorMessage(error) {
  try {
    if (error.startsWith("API Error:")) {
      const json = error.replace(/^API Error: \d+ - /, "");
      return JSON.parse(json).message || "Authentication failed";
    }
  } catch {}
  return error || "Authentication failed";
}

export const authOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },

      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password)
            throw new Error("Missing email or password");

          const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/auth/signin`,{
            method: 'POST',
            headers: {'Content-type':'application/json'},
            body: JSON.stringify({email: credentials?.email, password: credentials?.password})
          })
          if(!response.ok){
            throw new Error('Invalid credentials',{status: 400});
          }
          const data = await response.json();

          return {
            id: data?.user?.userId,
            email: data?.user?.email,
            name: data?.user?.firstName + " " + data?.user?.lastName,
            role: data?.user?.role,
            token: data?.user?.token
          };
        } catch (err) {
          throw new Error(cleanApiErrorMessage(err.message));
        }
      }
    })
  ],

  session: { strategy: "jwt" },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.token = user.token
      }
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.role = token.role;
        session.user.token = token.token
      }
      return session;
    }
  },

  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin"
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NEXT_ENV !== "production"
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
