import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Drishti | AI-Powered Exam Monitoring & Review",
  description: "Drishti — AI-assisted exam creation, proctoring and review. Create exams, monitor securely, and help students review using AI-driven insights.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico" }
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
