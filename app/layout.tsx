import "./globals.css";
import "../styles/file-input.css";
import { Metadata } from "next";
import { Toaster } from "sonner";
import { ThemeProvider } from "next-themes";
import { Inter } from "next/font/google";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { MenuBar } from "@/components/menu-bar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "IB DP Study Helper",
  description: "Generate quizzes for IB DP Chemistry, Physics, and Biology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.className}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.MathJax = {
                tex: {
                  inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
                  displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']],
                  processEscapes: true,
                  processEnvironments: true,
                  packages: ['base', 'ams', 'noerrors', 'noundefined', 'newcommand', 'boldsymbol'],
                  macros: {
                    'frac': ['\\\\frac{#1}{#2}', 2],
                    'omega': '\\\\omega',
                    'alpha': '\\\\alpha',
                    'beta': '\\\\beta',
                    'gamma': '\\\\gamma',
                    'delta': '\\\\delta',
                    'theta': '\\\\theta',
                    'lambda': '\\\\lambda',
                    'sigma': '\\\\sigma',
                    'pi': '\\\\pi',
                    'L': 'L',
                    'I': 'I',
                    'M': 'M',
                    'v': 'v',
                    'a': 'a',
                    'g': 'g',
                    'F': 'F',
                    'E': 'E',
                    'm': 'm',
                    'c': 'c'
                  }
                },
                svg: {
                  fontCache: 'global',
                  scale: 1.1
                },
                options: {
                  enableMenu: false,
                  renderActions: {
                    addMenu: [],
                    checkLoading: []
                  }
                },
                startup: {
                  ready: () => {
                    console.log('MathJax is ready');
                    MathJax.startup.defaultReady();
                  }
                }
              };
            `,
          }}
        />
        <script
          id="MathJax-script"
          async
          src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"
        />
      </head>
      <body className="dark">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <Toaster position="top-center" richColors />
          <AuroraBackground className="min-h-screen">
            <MenuBar />
            {children}
          </AuroraBackground>
        </ThemeProvider>
      </body>
    </html>
  );
}
