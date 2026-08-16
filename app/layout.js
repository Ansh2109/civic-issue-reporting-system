import { IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

/*
 * IBM Plex Sans — chosen over Inter for its utilitarian, slightly engineered
 * character. Designed for technical clarity and information density; has just
 * enough personality (distinctive 'a', 'g', 'l' letterforms) to feel like a
 * considered choice, not a default. Used in technical documentation,
 * public-sector tools, and serious information products.
 */
const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata = {
  title: "CivicReport — Crowdsourced Issue Reporting",
  description:
    "Report potholes, broken streetlights, garbage, and water leaks in your city. See live reports on the map and track their resolution.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={ibmPlexSans.variable}>
      <body>
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
