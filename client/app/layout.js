import { Geist, Geist_Mono, Poppins } from "next/font/google";
import "./globals.css";
import { UserProvider } from "./UserProvider";
import ToastManager from './components/ui/toastWrapper';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata = {
  title: "AI Interviewer"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} ${geistSans.variable} antialiased`}
      >
        <UserProvider>
          {children}
          <ToastManager />
        </UserProvider>
      </body>
    </html>
  );
}
