"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, CheckCircle, X, BookOpen, Brain, Trophy, RotateCcw, ArrowRight, Search, Star, ToggleLeft, ToggleRight, Plus, Copy } from "lucide-react"
import Link from "next/link"

interface Question {
  question: string
  options: string[]
  answers: string[]
  numOptions: number
}

interface WrongAnswer {
  question: string
  userAnswer: string
  correctAnswer: string
  timestamp: number
  highlightedKeywords?: string[]
}

interface Course {
  course_id: string
  course_name: string
  course_file: string
  course_description: string
}

export default function StudyPage() {
  const searchParams = useSearchParams()
  const courseId = searchParams.get("course")
  const courseFile = searchParams.get("file")
  const initialMode = searchParams.get("mode") || "all"

  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState<string>("")
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswer[]>([])
  const [studyMode, setStudyMode] = useState<"all" | "wrong" | "important">(initialMode as "all" | "wrong" | "important")
  const [wrongQuestions, setWrongQuestions] = useState<Question[]>([])
  const [importantQuestions, setImportantQuestions] = useState<string[]>([])
  const [importantQuestionsList, setImportantQuestionsList] = useState<Question[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [showCourseSelection, setShowCourseSelection] = useState(!courseId || !courseFile)
  const [currentHighlighted, setCurrentHighlighted] = useState<string[]>([])
  const [showHighlights, setShowHighlights] = useState(true)
  const [keywordInput, setKeywordInput] = useState("")
  const [selectedText, setSelectedText] = useState("")

  const selectionTimeout = useRef<NodeJS.Timeout | null>(null)

  const loadWrongAnswers = () => {
    if (!courseId) return
    try {
      const stored = localStorage.getItem(`wrong_answers_${courseId}`)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          setWrongAnswers(parsed)
        } else {
          setWrongAnswers([])
        }
      }
    } catch (error) {
      console.error("Error loading wrong answers:", error)
      setWrongAnswers([])
    }
  }

  const loadImportantQuestions = () => {
    if (!courseId) return
    try {
      const stored = localStorage.getItem(`important_questions_${courseId}`)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          setImportantQuestions(parsed)
        } else {
          setImportantQuestions([])
        }
      }
    } catch (error) {
      console.error("Error loading important questions:", error)
      setImportantQuestions([])
    }
  }

  useEffect(() => {
    if (showCourseSelection) {
      loadCourses()
    }
    if (courseId && courseFile) {
      setShowCourseSelection(false)
      loadQuestions()
      loadWrongAnswers()
      loadImportantQuestions()
    } else {
      setLoading(false)
    }
  }, [courseId, courseFile, showCourseSelection])

  useEffect(() => {
    if (studyMode === "wrong") {
      loadWrongQuestions()
    } else if (studyMode === "important") {
      loadImportantQuestionsList()
    }
  }, [studyMode, wrongAnswers, importantQuestions])

  useEffect(() => {
    const currentQuestion = getCurrentQuestions()[currentIndex]
    if (currentQuestion) {
      const existingWrong = wrongAnswers.find(wa => wa.question === currentQuestion.question)
      setCurrentHighlighted(existingWrong?.highlightedKeywords || [])
      setSelectedText("")
      setKeywordInput("")
    }
  }, [currentIndex, studyMode, wrongAnswers])

  useEffect(() => {
    if (showAnswer && !isCorrect) {
      document.addEventListener('mouseup', handleTextSelect)
      return () => {
        document.removeEventListener('mouseup', handleTextSelect)
        if (selectionTimeout.current) {
          clearTimeout(selectionTimeout.current)
        }
      }
    }
  }, [showAnswer, isCorrect])

  const loadCourses = async () => {
    try {
      const response = await fetch("https://letankim.id.vn/?act=get_courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      const data = await response.json()
      if (data.success) {
        setCourses(data.data)
      } else {
        console.error("Failed to load courses:", data)
      }
    } catch (error) {
      console.error("Error loading courses:", error)
    }
  }

  const loadQuestions = async () => {
    if (!courseFile) return
    try {
      console.log("[v0] Loading questions from:", `https://letankim.id.vn/3do_resources/${courseFile}`)
      const response = await fetch(`https://letankim.id.vn/3do_resources/${courseFile}`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("[v0] Raw API response:", data)

      let questionsData = []
      if (data.questions && Array.isArray(data.questions)) {
        questionsData = data.questions
      } else if (Array.isArray(data)) {
        questionsData = data
      } else {
        console.error("[v0] Unexpected data structure:", data)
        throw new Error("Invalid data structure")
      }

      console.log("[v0] Processed questions:", questionsData)
      setQuestions(questionsData)
    } catch (error) {
      console.error("[v0] Error loading questions:", error)
      setQuestions([])
    } finally {
      setLoading(false)
    }
  }

  const handleCourseSelect = (course: Course) => {
    window.location.href = `/study?course=${course.course_id}&file=${course.course_file}`
  }

  const handleBackCourse = () => {
    window.location.href = `/study`
  }

  const filteredCourses = courses.filter(
    (course) =>
      course.course_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.course_description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const loadWrongQuestions = () => {
    const wrongQuestionTexts = wrongAnswers.map((wa) => wa.question)
    const filtered = questions.filter((q) => wrongQuestionTexts.includes(q.question))
    setWrongQuestions(filtered)
  }

  const loadImportantQuestionsList = () => {
    const filtered = questions.filter((q) => importantQuestions.includes(q.question))
    setImportantQuestionsList(filtered)
  }

  const saveWrongAnswer = (question: string, userAnswer: string, correctAnswer: string, highlighted: string[]) => {
    const wrongAnswer: WrongAnswer = {
      question,
      userAnswer,
      correctAnswer,
      timestamp: Date.now(),
      highlightedKeywords: highlighted,
    }

    const existing = wrongAnswers.filter((wa) => wa.question !== question)
    const updated = [...existing, wrongAnswer]
    setWrongAnswers(updated)
    if (courseId) {
      localStorage.setItem(`wrong_answers_${courseId}`, JSON.stringify(updated))
    }
  }

  const updateWrongHighlights = (question: string, highlighted: string[]) => {
    const updated = wrongAnswers.map(wa => 
      wa.question === question ? { ...wa, highlightedKeywords: highlighted } : wa
    )
    setWrongAnswers(updated)
    if (courseId) {
      localStorage.setItem(`wrong_answers_${courseId}`, JSON.stringify(updated))
    }
  }

  const removeWrongAnswer = (question: string) => {
    const updated = wrongAnswers.filter((wa) => wa.question !== question)
    setWrongAnswers(updated)
    if (courseId) {
      localStorage.setItem(`wrong_answers_${courseId}`, JSON.stringify(updated))
    }
  }

  const handleAnswerSelect = (answer: string) => {
    if (showAnswer) return

    setSelectedAnswer(answer)
    const currentQuestion = getCurrentQuestions()[currentIndex]
    const correct = currentQuestion.answers.includes(answer.charAt(0))
    setIsCorrect(correct)
    setShowAnswer(true)

    if (!correct) {
      const existingHighlighted = wrongAnswers.find(wa => wa.question === currentQuestion.question)?.highlightedKeywords || []
      saveWrongAnswer(
        currentQuestion.question,
        answer,
        currentQuestion.options[currentQuestion.answers[0].charCodeAt(0) - 65],
        existingHighlighted
      )
    } else if (studyMode === "wrong") {
      removeWrongAnswer(currentQuestion.question)
    }
  }

  const handleTextSelect = () => {
    if (selectionTimeout.current) {
      clearTimeout(selectionTimeout.current)
    }

    selectionTimeout.current = setTimeout(() => {
      const selection = window.getSelection()
      const selectedText = selection?.toString().trim()
      if (selectedText) {
        setSelectedText(selectedText)
      } else {
        setSelectedText("")
      }
    }, 150)
  }

  const copyToKeywordInput = () => {
    if (selectedText) {
      setKeywordInput(selectedText)
      window.getSelection()?.removeAllRanges()
      setSelectedText("")
    }
  }

  const addKeyword = () => {
    const trimmedKeyword = keywordInput.trim()
    if (trimmedKeyword && !currentHighlighted.includes(trimmedKeyword)) {
      const newHighlighted = [...currentHighlighted, trimmedKeyword]
      setCurrentHighlighted(newHighlighted)
      const currentQuestion = getCurrentQuestions()[currentIndex]
      updateWrongHighlights(currentQuestion.question, newHighlighted)
      setKeywordInput("")
      setSelectedText("")
    }
  }

  const handleKeywordInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKeywordInput(e.target.value)
  }

  const handleKeywordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    addKeyword()
  }

  const removeHighlight = (keyword: string) => {
    const newHighlighted = currentHighlighted.filter(k => k !== keyword)
    setCurrentHighlighted(newHighlighted)
    const currentQuestion = getCurrentQuestions()[currentIndex]
    updateWrongHighlights(currentQuestion.question, newHighlighted)
  }

  const toggleImportant = () => {
    const currentQuestion = getCurrentQuestions()[currentIndex]
    let updated
    if (importantQuestions.includes(currentQuestion.question)) {
      updated = importantQuestions.filter(q => q !== currentQuestion.question)
    } else {
      updated = [...importantQuestions, currentQuestion.question]
    }
    setImportantQuestions(updated)
    if (courseId) {
      localStorage.setItem(`important_questions_${courseId}`, JSON.stringify(updated))
    }
  }

  const nextQuestion = () => {
    const totalQuestions = getCurrentQuestions().length
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      setCurrentIndex(0)
    }
    resetQuestion()
  }

  const prevQuestion = () => {
    const totalQuestions = getCurrentQuestions().length
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    } else {
      setCurrentIndex(totalQuestions - 1)
    }
    resetQuestion()
  }

  const resetQuestion = () => {
    setShowAnswer(false)
    setSelectedAnswer("")
    setIsCorrect(null)
    setKeywordInput("")
    setSelectedText("")
  }

  const highlightText = (text: string, keywords: string[]) => {
    if (keywords.length === 0 || !showHighlights) return text
    const regex = new RegExp(`(${keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi')
    return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>')
  }

  const getCurrentQuestions = () => {
    if (studyMode === "wrong") return wrongQuestions
    if (studyMode === "important") return importantQuestionsList
    return questions
  }

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
                <p className="text-sm text-slate-600 font-open-sans">Chọn khóa học để bắt đầu học tập</p>
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
                  <BookOpen size={24} className="text-emerald-600 flex-shrink-0" />
                  <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">ID: {course.course_id}</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2 font-work-sans">{course.course_name}</h3>
                <p className="text-sm text-slate-600 font-open-sans">{course.course_description}</p>
              </button>
            ))}
          </div>

          {filteredCourses.length === 0 && (
            <div className="text-center py-12">
              <BookOpen size={48} className="text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-600 mb-2 font-work-sans">Không tìm thấy khóa học</h3>
              <p className="text-slate-500 font-open-sans">Thử tìm kiếm với từ khóa khác</p>
            </div>
          )}
        </div>
      </div>
    )
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

  const currentQuestions = getCurrentQuestions()
  const currentQuestion = currentQuestions[currentIndex]

  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
          <Trophy size={48} className="text-emerald-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-800 mb-2 font-work-sans">
            {studyMode === "wrong" ? "Không có câu sai!" : studyMode === "important" ? "Không có câu quan trọng!" : "Không có câu hỏi"}
          </h3>
          <p className="text-slate-600 mb-6 font-open-sans">
            {studyMode === "wrong"
              ? "Bạn đã ôn tập hết các câu sai. Tuyệt vời!"
              : studyMode === "important"
                ? "Bạn chưa đánh dấu câu quan trọng nào."
                : "Không tìm thấy câu hỏi nào trong khóa học này."}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setShowCourseSelection(true)}
              className="px-6 py-2 border border-gray-300 text-slate-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Chọn khóa khác
            </button>
            <Link href="/">
              <button className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium">
                Về trang chủ
              </button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const progress = ((currentIndex + 1) / currentQuestions.length) * 100
  const isImportant = importantQuestions.includes(currentQuestion.question)
  const hasHighlights = currentHighlighted.length > 0

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 bg-white border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={handleBackCourse}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="ml-4 flex-1">
              <h1 className="text-lg font-semibold text-slate-800 font-work-sans">Chế độ học tập</h1>
              <p className="text-sm text-slate-600 font-open-sans">Khóa học: {courseId}</p>
            </div>

            <div className="flex items-center gap-2">
              <img src="https://letankim.id.vn/3do/assets/images/logo.jpg" alt="3DO Logo" className="h-6 w-6 rounded" />
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-800 text-sm rounded-full font-medium">
                <BookOpen size={14} />
                Tất cả ({questions.length})
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full font-medium">
                <X size={14} />
                Câu sai ({wrongAnswers.length})
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full font-medium">
                <Star size={14} />
                Quan trọng ({importantQuestions.length})
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1">
            <div className="flex">
              <button
                onClick={() => {
                  setStudyMode("all")
                  setCurrentIndex(0)
                  resetQuestion()
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  studyMode === "all"
                    ? "bg-emerald-600 text-white"
                    : "text-slate-600 hover:text-emerald-600 hover:bg-emerald-50"
                }`}
              >
                <BookOpen size={16} />
                Tất cả câu hỏi
              </button>
              <button
                onClick={() => {
                  setStudyMode("wrong")
                  setCurrentIndex(0)
                  resetQuestion()
                }}
                disabled={wrongAnswers.length === 0}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  studyMode === "wrong"
                    ? "bg-emerald-600 text-white"
                    : wrongAnswers.length === 0
                      ? "text-slate-400 cursor-not-allowed"
                      : "text-slate-600 hover:text-emerald-600 hover:bg-emerald-50"
                }`}
              >
                <Brain size={16} />
                Ôn câu sai ({wrongAnswers.length})
              </button>
              <button
                onClick={() => {
                  setStudyMode("important")
                  setCurrentIndex(0)
                  resetQuestion()
                }}
                disabled={importantQuestions.length === 0}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  studyMode === "important"
                    ? "bg-emerald-600 text-white"
                    : importantQuestions.length === 0
                      ? "text-slate-400 cursor-not-allowed"
                      : "text-slate-600 hover:text-emerald-600 hover:bg-emerald-50"
                }`}
              >
                <Star size={16} />
                Câu quan trọng ({importantQuestions.length})
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end mb-4">
          <button
            onClick={() => setShowHighlights(!showHighlights)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {showHighlights ? <ToggleRight size={20} className="text-emerald-600" /> : <ToggleLeft size={20} className="text-gray-400" />}
            Hiển thị keywords
          </button>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-slate-600 font-open-sans">
              Câu {currentIndex + 1} / {currentQuestions.length}
            </span>
            <span className="text-sm text-slate-600 font-open-sans">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="p-6 border-b border-gray-200 flex justify-between items-start">
            <h2 className="text-lg font-medium text-slate-800 leading-relaxed font-work-sans flex-1 select-text"
              dangerouslySetInnerHTML={{ __html: highlightText(currentQuestion.question, currentHighlighted) }}
            ></h2>
            <button onClick={toggleImportant} className="ml-2">
              <Star size={24} fill={isImportant ? "gold" : "none"} stroke={isImportant ? "gold" : "currentColor"} />
            </button>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedAnswer === option
                const isCorrectOption = currentQuestion.answers.includes(String.fromCharCode(65 + index))

                let buttonClasses =
                  "w-full flex items-center justify-between p-4 border rounded-lg text-left transition-all duration-200 min-h-[60px]"

                if (showAnswer) {
                  if (isCorrectOption) {
                    buttonClasses += " bg-green-100 border-green-500 text-green-800"
                  } else if (isSelected && !isCorrectOption) {
                    buttonClasses += " bg-red-100 border-red-500 text-red-800"
                  } else {
                    buttonClasses += " border-gray-200 text-slate-600"
                  }
                } else if (isSelected) {
                  buttonClasses += " border-emerald-500 bg-emerald-50 text-emerald-800"
                } else {
                  buttonClasses += " border-gray-200 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50"
                }

                return (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(option)}
                    disabled={showAnswer}
                    className={buttonClasses}
                  >
                    <div className="flex items-center flex-1">
                      <span className="font-semibold text-base mr-3 min-w-[20px]">
                        {String.fromCharCode(65 + index)}.
                      </span>
                      <span className="flex-1 text-base font-open-sans select-text"
                        dangerouslySetInnerHTML={{ __html: highlightText(option.substring(2), currentHighlighted) }}
                      ></span>
                    </div>
                    {showAnswer && isCorrectOption && <CheckCircle size={20} />}
                    {showAnswer && isSelected && !isCorrectOption && <X size={20} />}
                  </button>
                )
              })}
            </div>

            {showAnswer && (
              <div
                className={`mt-6 p-4 rounded-lg ${
                  isCorrect ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}
              >
                <div className="flex items-center mb-2">
                  {isCorrect ? <CheckCircle size={20} className="mr-2" /> : <X size={20} className="mr-2" />}
                  <span className="font-semibold font-open-sans">{isCorrect ? "Chính xác!" : "Sai rồi!"}</span>
                </div>
                {!isCorrect && (
                  <p className="text-sm font-open-sans">
                    Đáp án đúng: {currentQuestion.options[currentQuestion.answers[0].charCodeAt(0) - 65]}
                  </p>
                )}
                {!isCorrect && (
                  <div className="mt-4">
                    <p className="text-sm italic font-open-sans mb-2">
                      Chọn văn bản trong câu hỏi hoặc đáp án, nhập trực tiếp keyword.
                    </p>
                    <form onSubmit={handleKeywordSubmit} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={keywordInput}
                        onChange={handleKeywordInput}
                        placeholder="Nhập keyword để đánh dấu..."
                        className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-open-sans"
                      />
                      <button
                        type="submit"
                        disabled={!keywordInput.trim()}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        <Plus size={16} />
                        Thêm
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}

            {showAnswer && !isCorrect && hasHighlights && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Keywords đã đánh dấu:</label>
                <div className="flex flex-wrap gap-2">
                  {currentHighlighted.map((keyword, idx) => (
                    <button
                      key={idx}
                      onClick={() => removeHighlight(keyword)}
                      className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-sm flex items-center hover:bg-yellow-200 transition-colors"
                    >
                      {keyword}
                      <X size={12} className="ml-1" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={prevQuestion}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-slate-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            <ArrowLeft size={16} />
            Câu trước
          </button>

          <button
            onClick={resetQuestion}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-slate-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            <RotateCcw size={16} />
            Làm lại
          </button>

          <button
            onClick={nextQuestion}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
          >
            Câu tiếp
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}