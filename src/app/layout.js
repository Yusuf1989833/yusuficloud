import { Figtree } from "next/font/google";
import "./globals.css";

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
});

export const metadata = {
  title: "iCloud",
  description: "Log in to iCloud to access your photos, mail, notes, documents and more. Sign in with your Apple Account or create a new account to start using Apple services.",
  icons: {
    icon: '/icon.ico',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${figtree.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}