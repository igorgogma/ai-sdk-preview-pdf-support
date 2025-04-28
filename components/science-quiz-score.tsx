import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GlowingEffect } from "@/components/ui/glowing-effect";

interface ScienceQuizScoreProps {
  score: number | null;
  totalQuestions: number;
  totalScore?: number | null;
  totalQuestionsAll?: number;
}

export default function ScienceQuizScore({
  score,
  totalQuestions,
  totalScore = null,
  totalQuestionsAll = 0
}: ScienceQuizScoreProps) {
  const getMessage = () => {
    if (!score) return "Quiz completed! Review your answers for the non-multiple choice questions.";
    if (score === 100) return "Perfect score! Congratulations!";
    if (score >= 80) return "Great job! You did excellently!";
    if (score >= 60) return "Good effort! You're on the right track.";
    if (score >= 40) return "Not bad, but there's room for improvement.";
    return "Keep practicing, you'll get better!";
  };

  const getGradeLevel = () => {
    if (!score) return "N/A";
    if (score >= 90) return "7";
    if (score >= 80) return "6";
    if (score >= 70) return "5";
    if (score >= 60) return "4";
    if (score >= 50) return "3";
    if (score >= 40) return "2";
    return "1";
  };

  return (
    <Card className="w-full relative">
      <GlowingEffect
        spread={40}
        glow={true}
        disabled={false}
        proximity={64}
        inactiveZone={0.01}
        borderWidth={3}
      />
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Quiz Results</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {totalScore !== null && totalQuestionsAll > 0 ? (
          <>
            <div className="text-center">
              <div className="text-5xl font-bold mb-2">{totalScore}%</div>
              <div className="text-xl">IB Grade: {totalScore ? getGradeLevel() : 'N/A'}</div>
              <div className="text-sm text-muted-foreground mt-1">Overall Score (All Question Types)</div>
            </div>

            <Progress value={totalScore} className="h-2" />

            <div className="text-center text-muted-foreground">
              Your overall score is based on all {totalQuestionsAll} questions in the quiz.
            </div>

            {score !== null && totalQuestions > 0 && (
              <div className="mt-6 pt-6 border-t">
                <div className="text-center">
                  <div className="text-3xl font-bold mb-2">{score}%</div>
                  <div className="text-lg">Multiple Choice Score</div>
                </div>

                <Progress value={score} className="h-2 mt-4" />

                <div className="text-center text-muted-foreground mt-2">
                  You got approximately {Math.round((score / 100) * totalQuestions)} out of {totalQuestions} multiple choice questions correct.
                </div>
              </div>
            )}
          </>
        ) : score !== null && totalQuestions > 0 ? (
          <>
            <div className="text-center">
              <div className="text-5xl font-bold mb-2">{score}%</div>
              <div className="text-xl">IB Grade: {getGradeLevel()}</div>
            </div>

            <Progress value={score} className="h-2" />

            <div className="text-center text-muted-foreground">
              You got approximately {Math.round((score / 100) * totalQuestions)} out of {totalQuestions} multiple choice questions correct.
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="text-xl font-medium mb-2">Quiz Completed</div>
            {totalQuestions === 0 ? (
              <p className="text-muted-foreground">
                This quiz didn&apos;t contain any multiple choice questions. Review your answers to see the correct solutions.
              </p>
            ) : (
              <p className="text-muted-foreground">
                Review your answers to see how you did on the multiple choice questions and check the solutions for the other question types.
              </p>
            )}
          </div>
        )}

        <div className="text-center text-lg font-medium mt-4">
          {getMessage()}
        </div>
      </CardContent>
    </Card>
  );
}
