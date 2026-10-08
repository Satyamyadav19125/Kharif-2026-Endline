import "./globals.css";

export const metadata = {
  title: "Endline 2026 — Survey Progress",
  description:
    "Live progress of the Kharif 2026 Endline Survey — how many farms are surveyed, village by village.",
};

export const viewport = {
  themeColor: "#0b6b3a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// Apply saved light/dark theme before paint (no flash).
const themeScript = `
(function(){
  try{
    var t = localStorage.getItem('endline_theme') || 'system';
    var dark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (dark) document.documentElement.setAttribute('data-theme','dark');
    else document.documentElement.setAttribute('data-theme','light');
  }catch(e){}
})();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
