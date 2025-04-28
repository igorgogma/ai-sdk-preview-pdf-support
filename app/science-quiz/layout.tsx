import { Metadata } from "next";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "IB Science Quiz Generator",
  description: "Generate custom quizzes for IB DP Chemistry, Physics, and Biology",
};

export default function ScienceQuizLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {children}
    </>
  );
}
