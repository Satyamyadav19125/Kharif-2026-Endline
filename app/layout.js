import "./globals.css";

export const metadata = {
  title: "Endline 2026 — Survey Progress",
  description:
    "Live progress of the Kharif 2026 Endline Survey — farms surveyed, village by village.",
};

export const viewport = {
  themeColor: "#15803d",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// Apply saved light/dark theme before paint (no flash). Uses the `.dark` class.
const themeScript = `
(function(){
  try{
    var t = localStorage.getItem('endline_theme') || 'system';
    var dark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', !!dark);
  }catch(e){}
})();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
