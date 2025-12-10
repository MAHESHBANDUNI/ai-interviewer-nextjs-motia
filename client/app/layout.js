import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { UserProvider } from "./UserProvider";
import ToastManager from './components/ui/toastWrapper';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "AI Interviewer"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <UserProvider>
          {children}
          <ToastManager />
        </UserProvider>
      </body>
    </html>
  );
}
