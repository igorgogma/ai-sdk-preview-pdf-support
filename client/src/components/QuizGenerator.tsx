import React, { useState, useEffect } from 'react';
import { FiAward, FiCheckCircle, FiRotateCw, FiXCircle } from 'react-icons/fi';

interface QuizQuestion {
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

interface QuizSettings {
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  count: number;
}

const QuizGenerator: React.FC = () => {
  // States
  const [topics, setTopics] = useState<{id: string, title: string}[]>([]);
  const [settings, setSettings] = useState<QuizSettings>({
    topic: '',
    difficulty: 'medium',
    count: 5
  });
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load topics on component mount
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const response = await fetch('/api/ai/topics', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch topics');
        }
        
        const data = await response.json();
        setTopics(data.data.map((topic: any) => ({
          id: topic.id,
          title: topic.title
        })));
        
        // Set default topic if available
        if (data.data.length > 0) {
          setSettings(prev => ({
            ...prev,
            topic: data.data[0].title
          }));
        }
      } catch (error) {
        console.error('Error fetching topics:', error);
        setError('Failed to load topics. Please try again later.');
      }
    };

    fetchTopics();
  }, []);

  // Handle settings change
  const handleSettingsChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: name === 'count' ? parseInt(value) : value
    }));
  };

  // Generate quiz
  const handleGenerateQuiz = async () => {
    if (!settings.topic) {
      setError('Please select a topic');
      return;
    }

    setLoading(true);
    setError(null);
    setQuestions([]);
    setAnswers({});
    setShowResults(false);
    setCurrentQuestionIndex(0);

    try {
      const response = await fetch('/api/ai/practice-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(settings)
      });

      if (!response.ok) {
        throw new Error('Failed to generate questions');
      }

      const data = await response.json();
      setQuestions(data.data.questions);
    } catch (error) {
      console.error('Error generating quiz:', error);
      setError('Failed to generate quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle answer selection
  const handleAnswerSelect = (answer: string) => {
    setAnswers({
      ...answers,
      [currentQuestionIndex]: answer
    });
  };

  // Move to next question
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setShowResults(true);
    }
  };

  // Move to previous question
  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  // Submit quiz for evaluation
  const handleSubmitQuiz = async () => {
    setLoading(true);
    setError(null);

    // Evaluate all questions and store results
    try {
      const evaluationPromises = questions.map(async (question, index) => {
        const userAnswer = answers[index] || '';
        
        const response = await fetch('/api/ai/evaluate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            question: question.question,
            studentAnswer: userAnswer,
            correctAnswer: question.correctAnswer,
            topic: settings.topic,
            subtopic: settings.topic // Using topic as subtopic for simplicity
          })
        });

        if (!response.ok) {
          throw new Error(`Failed to evaluate question ${index + 1}`);
        }

        return response.json();
      });

      await Promise.all(evaluationPromises);
      setShowResults(true);
    } catch (error) {
      console.error('Error evaluating quiz:', error);
      setError('Failed to evaluate quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Restart quiz
  const handleRestartQuiz = () => {
    setCurrentQuestionIndex(0);
    setAnswers({});
    setShowResults(false);
  };

  // Current question
  const currentQuestion = questions[currentQuestionIndex];

  // Get results
  const getResults = () => {
    let correct = 0;
    questions.forEach((question, index) => {
      if (answers[index] === question.correctAnswer) {
        correct++;
      }
    });
    return {
      correct,
      total: questions.length,
      percentage: Math.round((correct / questions.length) * 100)
    };
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Physics Quiz Generator</h2>

      {/* Settings Panel */}
      {questions.length === 0 && !loading && (
        <div className="bg-gray-50 p-6 rounded-lg mb-6">
          <h3 className="text-lg font-semibold mb-4">Quiz Settings</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
              <select
                name="topic"
                value={settings.topic}
                onChange={handleSettingsChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select a topic</option>
                {topics.map(topic => (
                  <option key={topic.id} value={topic.title}>
                    {topic.title}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
              <select
                name="difficulty"
                value={settings.difficulty}
                onChange={handleSettingsChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Number of Questions</label>
              <input
                type="number"
                name="count"
                min="1"
                max="10"
                value={settings.count}
                onChange={handleSettingsChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          
          <button
            onClick={handleGenerateQuiz}
            disabled={!settings.topic || loading}
            className="mt-4 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Generating...' : 'Generate Quiz'}
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
          <p className="text-gray-600">Generating your physics quiz...</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      {/* Quiz Questions */}
      {questions.length > 0 && !showResults && !loading && (
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              Question {currentQuestionIndex + 1} of {questions.length}
            </h3>
            <div className="text-sm text-gray-500">
              Topic: {settings.topic} | Difficulty: {settings.difficulty}
            </div>
          </div>

          <div className="mb-6">
            <p className="text-lg mb-4">{currentQuestion.question}</p>
            
            {/* Multiple Choice */}
            {currentQuestion.options && (
              <div className="space-y-2">
                {currentQuestion.options.map((option, idx) => (
                  <div key={idx} className="flex items-center">
                    <input
                      type="radio"
                      id={`option-${idx}`}
                      name={`question-${currentQuestionIndex}`}
                      value={option}
                      checked={answers[currentQuestionIndex] === option}
                      onChange={() => handleAnswerSelect(option)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor={`option-${idx}`} className="ml-2 block text-gray-700">
                      {option}
                    </label>
                  </div>
                ))}
              </div>
            )}
            
            {/* Open Answer */}
            {!currentQuestion.options && (
              <textarea
                value={answers[currentQuestionIndex] || ''}
                onChange={(e) => handleAnswerSelect(e.target.value)}
                placeholder="Type your answer here..."
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                rows={4}
              />
            )}
          </div>
          
          <div className="flex justify-between">
            <button
              onClick={handlePrevQuestion}
              disabled={currentQuestionIndex === 0}
              className="bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {currentQuestionIndex < questions.length - 1 ? (
              <button
                onClick={handleNextQuestion}
                className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmitQuiz}
                className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
              >
                Submit Quiz
              </button>
            )}
          </div>
        </div>
      )}

      {/* Quiz Results */}
      {showResults && questions.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-2xl font-bold mb-4">Quiz Results</h3>
          
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-gray-500">Correct Answers</p>
                <p className="text-2xl font-bold text-green-500">{getResults().correct}</p>
              </div>
              <div>
                <p className="text-gray-500">Total Questions</p>
                <p className="text-2xl font-bold">{getResults().total}</p>
              </div>
              <div>
                <p className="text-gray-500">Score</p>
                <p className="text-2xl font-bold text-indigo-500">{getResults().percentage}%</p>
              </div>
            </div>
          </div>
          
          <h4 className="text-lg font-semibold mb-2">Review Questions</h4>
          
          <div className="space-y-4">
            {questions.map((question, index) => (
              <div key={index} className="bg-white p-4 rounded-lg shadow">
                <p className="font-semibold mb-2">Question {index + 1}: {question.question}</p>
                
                <div className="mb-2">
                  <p className="text-gray-600">Your answer: </p>
                  <p className={`font-semibold ${answers[index] === question.correctAnswer ? 'text-green-600' : 'text-red-600'}`}>
                    {answers[index] || 'Not answered'}
                    {answers[index] === question.correctAnswer ? (
                      <FiCheckCircle className="inline ml-2" />
                    ) : (
                      <FiXCircle className="inline ml-2" />
                    )}
                  </p>
                </div>
                
                <div className="mb-2">
                  <p className="text-gray-600">Correct answer: </p>
                  <p className="font-semibold text-green-600">{question.correctAnswer}</p>
                </div>
                
                <div>
                  <p className="text-gray-600">Explanation: </p>
                  <p className="text-sm">{question.explanation}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 flex justify-between">
            <button
              onClick={handleRestartQuiz}
              className="bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300"
            >
              Retry This Quiz
            </button>
            
            <button
              onClick={() => {
                setQuestions([]);
                setAnswers({});
                setShowResults(false);
              }}
              className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700"
            >
              Create New Quiz
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizGenerator; 