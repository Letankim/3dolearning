"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { ArrowLeft, CheckCircle, X, Clock, Trophy, RotateCcw, Play, Settings, ArrowRight, Search } from "lucide-react"
import Link from "next/link"

interface Question {
  question: string
  options: string[]
  answers: string[]
  numOptions: number
}

interface TestResult {
  courseId: string
  score: number
  totalQuestions: number
  correctAnswers: number
  wrongAnswers: number
  timeSpent: number
  timestamp: number
  questions: {
    question: string
    userAnswer: string
    correctAnswer: string
    isCorrect: boolean
  }[]
}

interface Course {
  course_id: string
  course_name: string
  course_file: string
  course_description?: string
}

export default function PracticePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const courseId = searchParams.get("course")
  const courseFile = searchParams.get("file")

  const [questions, setQuestions] = useState<Question[]>([])
  const [testQuestions, setTestQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([])
  const [showResults, setShowResults] = useState(false)
  const [loading, setLoading] = useState(true)
  const [testStarted, setTestStarted] = useState(false)
  const [numQuestions, setNumQuestions] = useState(10)
  const [startTime, setStartTime] = useState(0)
  const [timeSpent, setTimeSpent] = useState(0)
  const [testHistory, setTestHistory] = useState<TestResult[]>([])

  const [courses, setCourses] = useState<Course[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [showCourseSelection, setShowCourseSelection] = useState(!courseId || !courseFile)

  const [intervalRef, setIntervalRef] = useState<NodeJS.Timeout | null>(null)

  const loadCourses = async () => {
    try {
      const response = await fetch("https://letankim.id.vn/?act=get_courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      const data = await response.json()
      if (data.success) {
        setCourses(data.data.map((c: Course) => ({
          course_id: c.course_id,
          course_name: c.course_name,
          course_file: c.course_file,
          course_description: c.course_description
        })))
      } else {
      }
    } catch (error) {
    }
  }

  useEffect(() => {
    if (showCourseSelection) {
      loadCourses()
    }
    if (courseFile) {
      setShowCourseSelection(false)
      loadQuestions()
      loadTestHistory()
    } else {
      setLoading(false)
    }
  }, [courseFile, showCourseSelection])

  useEffect(() => {
    if (testStarted && !showResults) {
      const newInterval = setInterval(() => {
        setTimeSpent(Math.floor((Date.now() - startTime) / 1000))
      }, 1000)
      setIntervalRef(newInterval)
      return () => clearInterval(newInterval)
    } else {
      if (intervalRef) {
        clearInterval(intervalRef)
        setIntervalRef(null)
      }
    }
  }, [testStarted, showResults, startTime])

  const handleCourseSelect = (course: Course) => {
     window.location.href = `/practice?course=${course.course_id}&file=${course.course_file}`;
  }

  const handleCourseOther = () => {
     window.location.href = `/practice`;
  }

  const filteredCourses = courses.filter(
    (course) =>
      course.course_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.course_description?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (showCourseSelection) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="sticky top-0 bg-white border-b border-gray-200 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-16">
              <Link href="/" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft size={20} />
              </Link>
              <div className="ml-4 flex-1">
                <h1 className="text-lg font-semibold text-slate-800 font-work-sans">Chọn khóa học</h1>
                <p className="text-sm text-slate-600 font-open-sans">Chọn khóa học để bắt đầu thi thử</p>
              </div>
              <img src="https://letankim.id.vn/3do/assets/images/logo.jpg" alt="3DO Logo" className="h-6 w-6 rounded" />
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm khóa học..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors font-open-sans"
              />
            </div>
          </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <button
              key={course.course_id}
              onClick={() => handleCourseSelect(course)}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-left hover:shadow-md hover:border-emerald-300 transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-3">
                <Trophy size={24} className="text-emerald-600 flex-shrink-0" />
                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                  ID: {course.course_id}
                </span>
              </div>

              <h3 className="text-lg font-semibold text-slate-800 mb-2 font-work-sans line-clamp-1">
                {course.course_name}
              </h3>

              <p className="text-sm text-slate-600 font-open-sans line-clamp-2">
                {course.course_description}
              </p>
            </button>
          ))}
        </div>


          {filteredCourses.length === 0 && (
            <div className="text-center py-12">
              <Trophy size={48} className="text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-600 mb-2 font-work-sans">Không tìm thấy khóa học</h3>
              <p className="text-slate-500 font-open-sans">Thử tìm kiếm với từ khóa khác</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  const loadQuestions = async () => {
    try {
      const response = await fetch(`https://letankim.id.vn/3do_resources/${courseFile}`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      let questionsData = []
      if (data.questions && Array.isArray(data.questions)) {
        questionsData = data.questions
      } else if (Array.isArray(data)) {
        questionsData = data
      } else {
        throw new Error("Invalid data structure")
      }

      setQuestions(questionsData)
    } catch (error) {
      setQuestions([])
    } finally {
      setLoading(false)
    }
  }

  const loadTestHistory = () => {
    const stored = localStorage.getItem(`test_history_${courseId}`)
    if (stored) {
      setTestHistory(JSON.parse(stored))
    }
  }

  const startTest = () => {
    const shuffled = [...questions].sort(() => Math.random() - 0.5)
    const selected = shuffled.slice(0, Math.min(numQuestions, questions.length))
    setTestQuestions(selected)
    setSelectedAnswers(new Array(selected.length).fill(""))
    setCurrentIndex(0)
    setTestStarted(true)
    setStartTime(Date.now())
    setTimeSpent(0)
  }

  const handleAnswerSelect = (answer: string) => {
    const newAnswers = [...selectedAnswers]
    newAnswers[currentIndex] = answer
    setSelectedAnswers(newAnswers)
  }

  const nextQuestion = () => {
    if (currentIndex < testQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const prevQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const finishTest = () => {
    const finalTimeSpent = Math.floor((Date.now() - startTime) / 1000)
    let correctCount = 0
    const questionResults = testQuestions.map((question, index) => {
      const userAnswer = selectedAnswers[index]
      const correctAnswer = question.options[question.answers[0].charCodeAt(0) - 65]
      const isCorrect = question.answers.includes(userAnswer.charAt(0))
      if (isCorrect) correctCount++

      return {
        question: question.question,
        userAnswer,
        correctAnswer,
        isCorrect,
      }
    })

    const result: TestResult = {
      courseId: courseId || "",
      score: Math.round((correctCount / testQuestions.length) * 100),
      totalQuestions: testQuestions.length,
      correctAnswers: correctCount,
      wrongAnswers: testQuestions.length - correctCount,
      timeSpent: finalTimeSpent,
      timestamp: Date.now(),
      questions: questionResults,
    }

    const updatedHistory = [result, ...testHistory].slice(0, 10)
    setTestHistory(updatedHistory)
    localStorage.setItem(`test_history_${courseId}`, JSON.stringify(updatedHistory))

    setShowResults(true)
    setTimeSpent(finalTimeSpent)
  }

  const resetTest = () => {
    setTestStarted(false)
    setShowResults(false)
    setCurrentIndex(0)
    setSelectedAnswers([])
    setTestQuestions([])
    setTimeSpent(0)
    if (intervalRef) {
      clearInterval(intervalRef)
      setIntervalRef(null)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-open-sans">Đang tải câu hỏi...</p>
        </div>
      </div>
    )
  }

  if (showResults) {
    const result = testHistory[0]
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="sticky top-0 bg-white border-b border-gray-200 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-16">
              <button
                onClick={() => setShowCourseSelection(true)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="ml-4 text-lg font-semibold text-slate-800 font-work-sans">Kết quả thi thử</h1>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="p-8 text-center border-b border-gray-200">
              <Trophy size={64} className="text-emerald-600 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-slate-800 mb-2 font-work-sans">
                {result.score >= 80 ? "Xuất sắc!" : result.score >= 60 ? "Tốt!" : "Cần cố gắng thêm!"}
              </h2>
              <p className="text-slate-600 font-open-sans">Bạn đã hoàn thành bài thi thử</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div>
                  <div className="text-3xl font-bold text-emerald-600 mb-1">{result.score}%</div>
                  <div className="text-sm text-slate-600 font-open-sans">Điểm số</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-600 mb-1">{result.correctAnswers}</div>
                  <div className="text-sm text-slate-600 font-open-sans">Câu đúng</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-red-600 mb-1">{result.wrongAnswers}</div>
                  <div className="text-sm text-slate-600 font-open-sans">Câu sai</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-slate-800 mb-1">{formatTime(result.timeSpent)}</div>
                  <div className="text-sm text-slate-600 font-open-sans">Thời gian</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-slate-800 font-work-sans">Chi tiết kết quả</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {result.questions.map((q, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-medium text-slate-800 flex-1 font-work-sans">{q.question}</p>
                      {q.isCorrect ? (
                        <CheckCircle size={20} className="text-green-600 ml-2 flex-shrink-0" />
                      ) : (
                        <X size={20} className="text-red-600 ml-2 flex-shrink-0" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className={`text-sm font-open-sans ${q.isCorrect ? "text-green-600" : "text-red-600"}`}>
                        Bạn chọn: {q.userAnswer}
                      </p>
                      {!q.isCorrect && (
                        <p className="text-sm text-green-600 font-open-sans">Đáp án đúng: {q.correctAnswer}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <button
              onClick={resetTest}
              className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
            >
              <RotateCcw size={16} />
              Thi lại
            </button>
            <button
              onClick={() => handleCourseOther()}
              className="px-6 py-2 border border-gray-300 text-slate-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Chọn khóa khác
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!testStarted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="sticky top-0 bg-white border-b border-gray-200 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-16">
              <button
                onClick={() => setShowCourseSelection(true)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="ml-4">
                <h1 className="text-lg font-semibold text-slate-800 font-work-sans">Thi thử</h1>
                <p className="text-sm text-slate-600 font-open-sans">Khóa học: {courseId}</p>
              </div>
              <div className="ml-auto">
                <img
                  src="https://letankim.id.vn/3do/assets/images/logo.jpg"
                  alt="3DO Logo"
                  className="h-6 w-6 rounded"
                />
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center font-work-sans">
                <Settings size={20} className="mr-2" />
                Cài đặt bài thi
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2 font-open-sans">
                    Số câu hỏi (tối đa {questions.length} câu)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={questions.length}
                    value={numQuestions}
                    onChange={(e) => setNumQuestions(Math.min(Number.parseInt(e.target.value) || 1, questions.length))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors font-open-sans"
                  />
                </div>
                <div className="text-sm text-slate-600 space-y-1 font-open-sans">
                  <p>• Câu hỏi sẽ được chọn ngẫu nhiên</p>
                  <p>• Bạn có thể xem lại và thay đổi câu trả lời</p>
                  <p>• Kết quả sẽ được lưu vào lịch sử</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mb-8">
            <button
              onClick={startTest}
              disabled={questions.length === 0}
              className="flex items-center gap-2 px-8 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium text-lg mx-auto"
            >
              <Play size={20} />
              Bắt đầu thi ({numQuestions} câu)
            </button>
          </div>

          {testHistory.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-slate-800 font-work-sans">Lịch sử thi thử</h3>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {testHistory.slice(0, 5).map((test, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-slate-800 font-work-sans">
                            {test.correctAnswers}/{test.totalQuestions} câu đúng
                          </p>
                          <p className="text-sm text-slate-600 font-open-sans">
                            {new Date(test.timestamp).toLocaleString("vi-VN")}
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                              test.score >= 80
                                ? "bg-green-100 text-green-800"
                                : test.score >= 60
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-red-100 text-red-800"
                            }`}
                          >
                            {test.score}%
                          </span>
                          <p className="text-sm text-slate-600 mt-1 font-open-sans">{formatTime(test.timeSpent)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  const currentQuestion = testQuestions[currentIndex]
  const progress = ((currentIndex + 1) / testQuestions.length) * 100
  const answeredCount = selectedAnswers.filter((a) => a).length

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 bg-white border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button onClick={resetTest} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft size={20} />
              </button>
              <div className="ml-4">
                <h1 className="text-lg font-semibold text-slate-800 font-work-sans">Đang thi thử</h1>
                <p className="text-sm text-slate-600 font-open-sans">
                  Câu {currentIndex + 1}/{testQuestions.length}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center text-slate-600">
                <Clock size={16} className="mr-1" />
                <span className="text-sm font-open-sans">{formatTime(timeSpent)}</span>
              </div>
              <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full font-medium">
                {answeredCount}/{testQuestions.length} đã trả lời
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-slate-800 leading-relaxed font-work-sans">
              {currentQuestion.question}
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedAnswers[currentIndex] === option

                return (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(option)}
                    className={`w-full flex items-center justify-between p-4 border rounded-lg text-left transition-all duration-200 min-h-[60px] ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                        : "border-gray-200 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50"
                    }`}
                  >
                    <div className="flex items-center flex-1">
                      <span className="font-semibold text-base mr-3 min-w-[20px]">
                        {String.fromCharCode(65 + index)}.
                      </span>
                      <span className="flex-1 text-base font-open-sans">{option.substring(2)}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={prevQuestion}
            disabled={currentIndex === 0}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-slate-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            <ArrowLeft size={16} />
            Câu trước
          </button>

          <div className="flex gap-1 flex-wrap justify-center max-w-md">
            {testQuestions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-8 h-8 text-sm font-medium rounded transition-colors ${
                  index === currentIndex
                    ? "bg-emerald-600 text-white"
                    : selectedAnswers[index]
                      ? "border border-emerald-600 text-emerald-600 bg-emerald-50"
                      : "border border-gray-300 text-slate-600 hover:bg-gray-50"
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>

          {currentIndex === testQuestions.length - 1 ? (
            <button
              onClick={finishTest}
              disabled={answeredCount === 0}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              <Trophy size={16} />
              Nộp bài
            </button>
          ) : (
            <button
              onClick={nextQuestion}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
            >
              Câu tiếp
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}