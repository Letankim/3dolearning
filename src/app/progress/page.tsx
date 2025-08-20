"use client"

import { useState, useEffect } from "react"
import {
  ArrowLeft,
  Trophy,
  Brain,
  BookOpen,
  TrendingUp,
  Calendar,
  Target,
  RotateCcw,
  X,
  CheckCircle,
} from "lucide-react"
import Link from "next/link"

interface TestResult {
  courseId: string
  score: number
  totalQuestions: number
  correctAnswers: number
  wrongAnswers: number
  timeSpent: number
  timestamp: number
  questions?: {
    question: string
    userAnswer: string
    correctAnswer: string
    isCorrect: boolean
  }[]
}

interface WrongAnswer {
  question: string
  userAnswer: string
  correctAnswer: string
  timestamp: number
  highlightedKeywords?: string[]
}

interface CourseProgress {
  courseId: string
  courseName: string
  testHistory: TestResult[]
  wrongAnswers: WrongAnswer[]
  averageScore: number
  totalTests: number
  bestScore: number
  improvementTrend: number
}

interface Course {
  course_id: string;
  course_name: string;
  course_file: string;
  course_description: string
}


export default function ProgressPage() {
  const [courseProgresses, setCourseProgresses] = useState<CourseProgress[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null)
  const [showTestDetails, setShowTestDetails] = useState<TestResult | null>(null)

  useEffect(() => {
    fetchCourses()
    loadProgressData()
  }, [])

  const fetchCourses = async () => {
    try {
      const response = await fetch("https://letankim.id.vn/?act=get_courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      const data = await response.json()
      if (data.success) {
        setCourses(data.data.map((c: Course) => ({
          id: c.course_id,
          name: c.course_name,
          file: c.course_file,
          description: c.course_description
        })))
      } else {
        console.error("Failed to load courses:", data)
      }
    } catch (error) {
      console.error("Error loading courses:", error)
    }
  }

  const loadProgressData = () => {
    const progresses: CourseProgress[] = []

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith("test_history_")) {
        const courseId = key.replace("test_history_", "")
        const testHistory: TestResult[] = JSON.parse(localStorage.getItem(key) || "[]")
        const wrongAnswersKey = `wrong_answers_${courseId}`
        const wrongAnswers: WrongAnswer[] = JSON.parse(localStorage.getItem(wrongAnswersKey) || "[]")

        if (testHistory.length > 0 || wrongAnswers.length > 0) {
          const scores = testHistory.map((t) => t.score)
          const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
          const bestScore = scores.length > 0 ? Math.max(...scores) : 0

          let improvementTrend = 0
          if (testHistory.length >= 6) {
            const recent = testHistory.slice(0, 3).reduce((a, b) => a + b.score, 0) / 3
            const previous = testHistory.slice(3, 6).reduce((a, b) => a + b.score, 0) / 3
            improvementTrend = recent - previous
          }

          const course = courses.find(c => c.course_id === courseId)
          progresses.push({
            courseId,
            courseName: course?.course_name || `Khóa học ${courseId}`,
            testHistory,
            wrongAnswers,
            averageScore,
            totalTests: testHistory.length,
            bestScore,
            improvementTrend,
          })
        }
      }
    }

    setCourseProgresses(progresses.sort((a, b) => b.totalTests - a.totalTests))
    setLoading(false)
  }

  const retryWrongAnswers = (courseId: string) => {
    const course = courses.find(c => c.course_id === courseId)
    const courseFile = course?.course_file
    if (courseFile) {
      window.location.href = `/study?course=${courseId}&file=${courseFile}&mode=wrong`
    }
  }

  const clearWrongAnswers = (courseId: string) => {
    localStorage.removeItem(`wrong_answers_${courseId}`)
    loadProgressData()
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-emerald-600"
    return "text-red-600"
  }

  const getScoreChipColor = (score: number) => {
    if (score >= 80) return "bg-green-100 text-green-800"
    if (score >= 60) return "bg-emerald-100 text-emerald-800"
    return "bg-red-100 text-red-800"
  }

  const highlightText = (text: string, keywords: string[] | undefined) => {
    if (!keywords || keywords.length === 0) return text
    const regex = new RegExp(`(${keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi')
    return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-open-sans">Đang tải dữ liệu...</p>
        </div>
      </div>
    )
  }

  const totalTests = courseProgresses.reduce((sum, cp) => sum + cp.totalTests, 0)
  const overallAverage =
    courseProgresses.length > 0 && totalTests > 0
      ? courseProgresses.reduce((sum, cp) => sum + cp.averageScore * cp.totalTests, 0) / totalTests
      : 0
  const totalWrongAnswers = courseProgresses.reduce((sum, cp) => sum + cp.wrongAnswers.length, 0)
  const overallAverageColorClass = getScoreColor(overallAverage)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 bg-white border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link href="/" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div className="ml-4 flex-1">
              <h1 className="text-lg font-semibold text-slate-800 font-work-sans">Tiến độ học tập</h1>
              <p className="text-sm text-slate-600 font-open-sans">Thống kê và phân tích kết quả</p>
            </div>
            <img src="https://letankim.id.vn/3do/assets/images/logo.jpg" alt="3DO Logo" className="h-6 w-6 rounded" />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {courseProgresses.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-12 text-center">
              <BookOpen size={64} className="text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-800 mb-2 font-work-sans">Chưa có dữ liệu</h3>
              <p className="text-slate-600 mb-6 font-open-sans">
                Bạn chưa thực hiện bài thi thử nào. Hãy bắt đầu học tập để xem tiến độ!
              </p>
              <div className="flex gap-4 justify-center">
                <Link href="/study">
                  <button className="px-6 py-2 border border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors font-medium">
                    Bắt đầu học tập
                  </button>
                </Link>
                <Link href="/practice">
                  <button className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium">
                    Thi thử
                  </button>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 font-open-sans">Tổng số bài thi</p>
                    <p className="text-3xl font-bold text-slate-800">{totalTests}</p>
                  </div>
                  <Trophy size={32} className="text-emerald-600" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 font-open-sans">Điểm trung bình</p>
                    <p className={`text-3xl font-bold ${overallAverageColorClass}`}>{Math.round(overallAverage)}%</p>
                  </div>
                  <Target size={32} className="text-green-600" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 font-open-sans">Khóa học đã học</p>
                    <p className="text-3xl font-bold text-slate-800">{courseProgresses.length}</p>
                  </div>
                  <BookOpen size={32} className="text-emerald-600" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 font-open-sans">Câu cần ôn</p>
                    <p className="text-3xl font-bold text-red-600">{totalWrongAnswers}</p>
                  </div>
                  <Brain size={32} className="text-red-600" />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {courseProgresses.map((progress) => (
                <div key={progress.courseId} className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <h3 className="text-lg font-semibold text-slate-800 flex items-center font-work-sans">
                        <BookOpen size={20} className="mr-2" />
                        {progress.courseName}
                      </h3>
                      <div className="flex gap-2 flex-wrap">
                        {progress.totalTests > 0 && (
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreChipColor(progress.averageScore)}`}
                          >
                            TB: {Math.round(progress.averageScore)}%
                          </span>
                        )}
                        {progress.bestScore > 0 && (
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                            Tốt nhất: {progress.bestScore}%
                          </span>
                        )}
                        {progress.improvementTrend !== 0 && (
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                              progress.improvementTrend > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                            }`}
                          >
                            <TrendingUp size={14} />
                            {progress.improvementTrend > 0 ? "+" : ""}
                            {Math.round(progress.improvementTrend)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="space-y-4">
                        {progress.totalTests > 0 && (
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm text-slate-600 font-open-sans">Điểm trung bình</span>
                              <span className="text-sm text-slate-600 font-open-sans">
                                {Math.round(progress.averageScore)}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progress.averageScore}%` }}
                              ></div>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-slate-600 font-open-sans">Số bài thi</p>
                            <p className="text-xl font-semibold text-slate-800">{progress.totalTests}</p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-600 font-open-sans">Câu cần ôn</p>
                            <p className="text-xl font-semibold text-red-600">{progress.wrongAnswers.length}</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Link
                              href={`/study?course=${progress.courseId}&file=${courses.find(c => c.course_id === progress.courseId)?.course_file || ''}`}
                              className="flex-1"
                            >
                              <button className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors font-medium">
                                <BookOpen size={16} />
                                Học tập
                              </button>
                            </Link>
                            <Link
                              href={`/practice?course=${progress.courseId}&file=${courses.find(c => c.course_id === progress.courseId)?.course_file || ''}`}
                              className="flex-1"
                            >
                              <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium">
                                <Trophy size={16} />
                                Thi thử
                              </button>
                            </Link>
                          </div>

                          {progress.wrongAnswers.length > 0 && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => retryWrongAnswers(progress.courseId)}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                              >
                                <RotateCcw size={16} />
                                Ôn câu sai ({progress.wrongAnswers.length})
                              </button>
                              <button
                                onClick={() =>
                                  setSelectedCourse(selectedCourse === progress.courseId ? null : progress.courseId)
                                }
                                className="px-4 py-2 border border-gray-300 text-slate-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                              >
                                {selectedCourse === progress.courseId ? "Ẩn" : "Xem"}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="lg:col-span-2">
                        {progress.testHistory.length > 0 && (
                          <>
                            <h4 className="text-lg font-semibold text-slate-800 flex items-center mb-4 font-work-sans">
                              <Calendar size={20} className="mr-2" />
                              Lịch sử thi thử
                            </h4>
                            <div className="space-y-3 max-h-48 overflow-y-auto">
                              {progress.testHistory.slice(0, 5).map((test, index) => (
                                <div key={index} className="border border-gray-200 rounded-lg p-4">
                                  <div className="flex items-center justify-between">
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
                                        className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getScoreChipColor(test.score)}`}
                                      >
                                        {test.score}%
                                      </span>
                                      <p className="text-sm text-slate-600 mt-1 font-open-sans">
                                        {formatTime(test.timeSpent)}
                                      </p>
                                      {test.questions && (
                                        <button
                                          onClick={() => setShowTestDetails(test)}
                                          className="text-xs text-emerald-600 hover:text-emerald-700 mt-1"
                                        >
                                          Chi tiết
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {selectedCourse === progress.courseId && progress.wrongAnswers.length > 0 && (
                      <div className="mt-6 border-t border-gray-200 pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-semibold text-slate-800 flex items-center font-work-sans">
                            <Brain size={20} className="mr-2 text-red-600" />
                            Câu trả lời sai ({progress.wrongAnswers.length})
                          </h4>
                          <button
                            onClick={() => clearWrongAnswers(progress.courseId)}
                            className="text-sm text-red-600 hover:text-red-700 font-medium"
                          >
                            Xóa tất cả
                          </button>
                        </div>
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {progress.wrongAnswers.map((wrong, index) => (
                            <div key={index} className="border border-red-200 rounded-lg p-4 bg-red-50">
                              <p className="font-medium text-slate-800 mb-2 font-work-sans"
                                dangerouslySetInnerHTML={{ __html: highlightText(wrong.question, wrong.highlightedKeywords) }}
                              ></p>
                              <div className="space-y-1">
                                <div className="text-sm text-red-600 font-open-sans flex items-center">
                                  <X size={14} className="mr-1 flex-shrink-0" />
                                  <span dangerouslySetInnerHTML={{ __html: `Bạn chọn: ${highlightText(wrong.userAnswer, wrong.highlightedKeywords)}` }} />
                                </div>
                                <div className="text-sm text-green-600 font-open-sans flex items-center">
                                  <CheckCircle size={14} className="mr-1 flex-shrink-0" />
                                  <span dangerouslySetInnerHTML={{ __html: `Đáp án đúng: ${highlightText(wrong.correctAnswer, wrong.highlightedKeywords)}` }} />
                                </div>
                                <p className="text-xs text-slate-500 font-open-sans">
                                  {new Date(wrong.timestamp).toLocaleString("vi-VN")}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {showTestDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-800 font-work-sans">Chi tiết bài thi</h3>
                  <button
                    onClick={() => setShowTestDetails(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
                <p className="text-sm text-slate-600 font-open-sans">
                  {new Date(showTestDetails.timestamp).toLocaleString("vi-VN")} • Điểm: {showTestDetails.score}% • Thời
                  gian: {formatTime(showTestDetails.timeSpent)}
                </p>
              </div>
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <div className="space-y-4">
                  {showTestDetails.questions?.map((q, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-medium text-slate-800 flex-1 font-work-sans">
                          {index + 1}. {q.question}
                        </p>
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
          </div>
        )}
      </div>
    </div>
  )
}