import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "@fontsource/dm-mono/latin-400.css";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "@fontsource/silkscreen/latin-400.css";
import "@fontsource/silkscreen/latin-700.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Toodle — Test your idea before you build",
  description: "A clearer-eyed way to validate a startup idea. Answer a few focused questions, then get an honest, actionable assessment.",
  icons: { icon: "/icon.svg", shortcut: "/icon.svg", apple: "/icon.svg" },
  openGraph: { title: "Toodle", description: "Test your idea before you build.", type: "website" },
  twitter: { card: "summary", title: "Toodle", description: "Test your idea before you build." },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" data-scroll-behavior="smooth"><body>
    <svg aria-hidden="true" focusable="false" width="0" height="0" style={{position:"absolute",width:0,height:0,overflow:"hidden"}}>
      <defs>
        <filter id="headline-inner-shadow-dark"><feGaussianBlur in="SourceAlpha" stdDeviation="1.2"/><feOffset dx="0" dy="2"/><feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="shadowDiff"/><feColorMatrix in="shadowDiff" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .75 0" result="shadow"/><feComposite in="shadow" in2="SourceGraphic" operator="over"/></filter>
        <filter id="headline-inner-shadow-light"><feGaussianBlur in="SourceAlpha" stdDeviation="1.2"/><feOffset dx="0" dy="2"/><feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="shadowDiff"/><feColorMatrix in="shadowDiff" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .75 0" result="shadow"/><feComposite in="shadow" in2="SourceGraphic" operator="over"/></filter>
      </defs>
    </svg>
    <div className="grain-overlay" aria-hidden="true" />
    {children}
  </body></html>;
}
