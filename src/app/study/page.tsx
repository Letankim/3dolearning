"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, CheckCircle, X, BookOpen, Brain, Trophy, RotateCcw, ArrowRight, Search, Star, ToggleLeft, ToggleRight, Plus, Copy, CheckCircle2 } from "lucide-react"
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
}

interface HighlightMap {
  [question: string]: string[]
}

interface Course {
  course_id: string
  course_name: string
  course_file: string
  course_description: string
}

export default function StudyPage() {
  const searchParams = useSearchParams();
  const courseId = searchParams.get("course")
  const courseName = searchParams.get("courseName")
  const courseFile = searchParams.get("file")
  const initialMode = searchParams.get("mode") || "all"

  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([])
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswer[]>([])
  const [learnedQuestions, setLearnedQuestions] = useState<string[]>([])
  const [studyMode, setStudyMode] = useState<"all" | "wrong" | "important" | "learned" | "unlearned">(initialMode as "all" | "wrong" | "important" | "learned" | "unlearned")
  const [wrongQuestions, setWrongQuestions] = useState<Question[]>([])
  const [learnedQuestionsList, setLearnedQuestionsList] = useState<Question[]>([])
  const [unlearnedQuestionsList, setUnlearnedQuestionsList] = useState<Question[]>([])
  const [importantQuestions, setImportantQuestions] = useState<string[]>([])
  const [importantQuestionsList, setImportantQuestionsList] = useState<Question[]>([])
  const [highlights, setHighlights] = useState<HighlightMap>({})
  const [courses, setCourses] = useState<Course[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [showCourseSelection, setShowCourseSelection] = useState(!courseId || !courseFile)
  const [currentHighlighted, setCurrentHighlighted] = useState<string[]>([])
  const [showHighlights, setShowHighlights] = useState(true)
  const [keywordInput, setKeywordInput] = useState("")
  const [selectedText, setSelectedText] = useState("")
  const [questionSearchTerm, setQuestionSearchTerm] = useState("")
  const [jumpToQuestion, setJumpToQuestion] = useState("")
  const [showSearchInput, setShowSearchInput] = useState(false)
  const [showJumpInput, setShowJumpInput] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null)
  const [learnedCourseIds, setLearnedCourseIds] = useState<string[]>([])

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
      setImportantQuestions([])
    }
  }

  const loadLearnedQuestions = () => {
    if (!courseId) return
    try {
      const stored = localStorage.getItem(`learned_questions_${courseId}`)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          setLearnedQuestions(parsed)
        } else {
          setLearnedQuestions([])
        }
      }
    } catch (error) {
      setLearnedQuestions([])
    }
  }

  const loadHighlights = () => {
    if (!courseId) return
    try {
      const stored = localStorage.getItem(`highlights_${courseId}`)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (typeof parsed === 'object' && parsed !== null) {
          setHighlights(parsed)
        } else {
          setHighlights({})
        }
      }
    } catch (error) {
      setHighlights({})
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
      loadLearnedQuestions()
      loadHighlights()
    } else {
      setLoading(false)
    }
  }, [courseId, courseFile, showCourseSelection])

  useEffect(() => {
    if (studyMode === "wrong") {
      loadWrongQuestions()
    } else if (studyMode === "important") {
      loadImportantQuestionsList()
    } else if (studyMode === "learned") {
      loadLearnedQuestionsList()
    } else if (studyMode === "unlearned") {
      loadUnlearnedQuestionsList()
    }
  }, [studyMode, wrongAnswers, importantQuestions, learnedQuestions])

  useEffect(() => {
    const currentQuestion = getCurrentQuestions()[currentIndex]
    if (currentQuestion) {
      const highlighted = highlights[currentQuestion.question] || []
      setCurrentHighlighted(highlighted)
      setSelectedText("")
      setKeywordInput("")
    }
  }, [currentIndex, studyMode, highlights, questionSearchTerm])

  useEffect(() => {
    if (showAnswer) {
      document.addEventListener('mouseup', handleTextSelect)
      return () => {
        document.removeEventListener('mouseup', handleTextSelect)
        if (selectionTimeout.current) {
          clearTimeout(selectionTimeout.current)
        }
      }
    }
  }, [showAnswer])

  useEffect(() => {
    if (snackbarMessage) {
      const timer = setTimeout(() => setSnackbarMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [snackbarMessage])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const currentQs = getCurrentQuestions()
      if (currentQs.length === 0) return

      switch (event.key) {
        case 'ArrowRight':
          event.preventDefault()
          nextQuestion()
          break
        case 'ArrowLeft':
          event.preventDefault()
          prevQuestion()
          break
        case 'ArrowUp':
          event.preventDefault()
          if (currentIndex > 0) setCurrentIndex(currentIndex - 1)
          resetQuestion()
          break
        case 'ArrowDown':
          event.preventDefault()
          if (currentIndex < currentQs.length - 1) setCurrentIndex(currentIndex + 1)
          resetQuestion()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentIndex, studyMode, questionSearchTerm])

  const loadCourses = async () => {
    try {
      const response = await fetch("https://letankim.id.vn/?act=get_courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      const data = await response.json()
      if (data.success) {
        setCourses(data.data)
        const learnedIds: string[] = []
        data.data.forEach((course: Course) => {
          const stored = localStorage.getItem(`learned_questions_${course.course_id}`)
          if (stored) {
            const parsed = JSON.parse(stored)
            if (Array.isArray(parsed) && parsed.length > 0) {
              learnedIds.push(course.course_id)
            }
          }
        })
        setLearnedCourseIds(learnedIds)
      } else {
      }
    } catch (error) {
    }
  }

  const loadQuestions = async () => {
    if (!courseFile) return
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

  const handleCourseSelect = (course: Course) => {
    window.location.href = `/study?course=${course.course_id}&file=${course.course_file}&courseName=${course.course_name}`
  }

  const handleBackCourse = () => {
    window.location.href = `/study`
  }

  const filteredCourses = courses.filter(
    (course) =>
      course.course_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.course_description?.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => {
    const aLearned = learnedCourseIds.includes(a.course_id) ? 1 : 0
    const bLearned = learnedCourseIds.includes(b.course_id) ? 1 : 0
    return bLearned - aLearned
  })

  const loadWrongQuestions = () => {
    const wrongQuestionTexts = wrongAnswers.map((wa) => wa.question)
    const filtered = questions.filter((q) => wrongQuestionTexts.includes(q.question))
    setWrongQuestions(filtered)
  }

  const loadImportantQuestionsList = () => {
    const filtered = questions.filter((q) => importantQuestions.includes(q.question))
    setImportantQuestionsList(filtered)
  }

  const loadLearnedQuestionsList = () => {
    const filtered = questions.filter((q) => learnedQuestions.includes(q.question))
    setLearnedQuestionsList(filtered)
  }

  const loadUnlearnedQuestionsList = () => {
    const wrongQuestionTexts = wrongAnswers.map((wa) => wa.question)
    const filtered = questions.filter((q) => !learnedQuestions.includes(q.question) && !wrongQuestionTexts.includes(q.question))
    setUnlearnedQuestionsList(filtered)
  }

  const saveWrongAnswer = (question: string, userAnswer: string, correctAnswer: string) => {
    const wrongAnswer: WrongAnswer = {
      question,
      userAnswer,
      correctAnswer,
      timestamp: Date.now(),
    }

    const existing = wrongAnswers.filter((wa) => wa.question !== question)
    const updated = [...existing, wrongAnswer]
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

  const markAsLearned = (question: string) => {
    if (!learnedQuestions.includes(question)) {
      const updated = [...learnedQuestions, question]
      setLearnedQuestions(updated)
      if (courseId) {
        localStorage.setItem(`learned_questions_${courseId}`, JSON.stringify(updated))
      }
    }
  }

  const updateHighlights = (question: string, newHighlights: string[]) => {
    const updated = { ...highlights, [question]: newHighlights }
    setHighlights(updated)
    if (courseId) {
      localStorage.setItem(`highlights_${courseId}`, JSON.stringify(updated))
    }
  }

  const handleAnswerSelect = (answer: string) => {
    const currentQuestion = getCurrentQuestions()[currentIndex]
    const isMultipleChoice = currentQuestion.answers.length > 1

    if (isMultipleChoice) {
      setSelectedAnswers(prev => 
        prev.includes(answer)
          ? prev.filter(a => a !== answer)
          : [...prev, answer]
      )
    } else {
      setSelectedAnswers([answer])
      const correct = currentQuestion.answers.includes(answer.charAt(0))
      setIsCorrect(correct)
      setShowAnswer(true)
      if (correct) {
        markAsLearned(currentQuestion.question)
      }

      if (!correct) {
        saveWrongAnswer(
          currentQuestion.question,
          answer,
          currentQuestion.options[currentQuestion.answers[0].charCodeAt(0) - 65]
        )
      } else if (studyMode === "wrong") {
        removeWrongAnswer(currentQuestion.question)
      }
    }
  }

  const handleCheckAnswers = () => {
    const currentQuestion = getCurrentQuestions()[currentIndex]
    const selectedOptions = selectedAnswers.map(a => a.charAt(0))
    const correctAnswers = currentQuestion.answers
    const isCorrectResult = selectedOptions.length === correctAnswers.length &&
      selectedOptions.every(a => correctAnswers.includes(a)) &&
      correctAnswers.every(a => selectedOptions.includes(a))

    setIsCorrect(isCorrectResult)
    setShowAnswer(true)
    if (isCorrectResult) {
      markAsLearned(currentQuestion.question)
    }

    if (!isCorrectResult) {
      saveWrongAnswer(
        currentQuestion.question,
        selectedAnswers.join(", "),
        currentQuestion.answers.map(a => currentQuestion.options[a.charCodeAt(0) - 65]).join(", ")
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
      updateHighlights(currentQuestion.question, newHighlighted)
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
    updateHighlights(currentQuestion.question, newHighlighted)
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
    setSelectedAnswers([])
    setIsCorrect(null)
    setKeywordInput("")
    setSelectedText("")
  }

  const highlightText = (text: string, keywords: string[]) => {
    if (keywords.length === 0 || !showHighlights) return text
    const regex = new RegExp(`(${keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi')
    return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>')
  }

  const getBaseQuestions = () => {
    if (studyMode === "wrong") return wrongQuestions
    if (studyMode === "important") return importantQuestionsList
    if (studyMode === "learned") return learnedQuestionsList
    if (studyMode === "unlearned") return unlearnedQuestionsList
    return questions
  }

  const getCurrentQuestions = () => {
    const base = getBaseQuestions()
    if (questionSearchTerm) {
      return base.filter(q => q.question.toLowerCase().includes(questionSearchTerm.toLowerCase()))
    }
    return base
  }

  const handleJumpToQuestion = (e: React.FormEvent) => {
    e.preventDefault()
    const num = parseInt(jumpToQuestion)
    const currentQs = getCurrentQuestions()
    if (isNaN(num) || num < 1 || num > currentQs.length) {
      setSnackbarMessage("Số câu hỏi không hợp lệ")
      return
    }
    setCurrentIndex(num - 1)
    resetQuestion()
    setJumpToQuestion("")
    setShowJumpInput(false)
  }

  const handleQuestionSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!questionSearchTerm.trim()) {
      setSnackbarMessage("Vui lòng nhập từ khóa tìm kiếm")
      return
    }
    const currentQs = getCurrentQuestions()
    const foundIndex = currentQs.findIndex(q => q.question.toLowerCase().includes(questionSearchTerm.toLowerCase()))
    if (foundIndex !== -1) {
      setCurrentIndex(foundIndex)
      resetQuestion()
    }
    setShowSearchInput(false)
  }

  const clearSearchFilter = () => {
    setQuestionSearchTerm("")
    setCurrentIndex(0)
    resetQuestion()
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
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                        #COURSE{course.course_id}
                      </span>
                      {learnedCourseIds.includes(course.course_id) && (
                        <span className="flex items-center gap-1 text-xs text-blue-500 bg-blue-100 px-2 py-1 rounded-full mt-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Đã học
                        </span>
                      )}
                    </div>
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

  const baseQuestions = getBaseQuestions()
  const currentQuestions = getCurrentQuestions()
  const currentQuestion = currentQuestions[currentIndex]

  if (baseQuestions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
          <BookOpen size={48} className="text-emerald-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-800 mb-2 font-work-sans">Không có</h3>
          <p className="text-slate-600 mb-6 font-open-sans">
            Không tìm thấy câu hỏi nào trong khóa học này.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
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

  const progress = currentQuestions.length > 0 ? ((currentIndex + 1) / currentQuestions.length) * 100 : 0
  const unlearnedCount = questions.length - learnedQuestions.length - wrongAnswers.length

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
                <p className="text-sm text-slate-600 font-open-sans">
                  Khóa học: #COURSE{courseId}
                  {courseName && ` - ${courseName}`}
                </p>
              </div>
            <div className="flex flex-wrap items-center gap-2">
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
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-medium">
                <Brain size={14} />
                Đã học ({learnedQuestions.length})
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full font-medium">
                <BookOpen size={14} />
                Chưa học ({unlearnedCount})
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-center mb-6 overflow-x-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1">
            <div className="flex flex-wrap">
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
              <button
                onClick={() => {
                  setStudyMode("learned")
                  setCurrentIndex(0)
                  resetQuestion()
                }}
                disabled={learnedQuestions.length === 0}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  studyMode === "learned"
                    ? "bg-emerald-600 text-white"
                    : learnedQuestions.length === 0
                      ? "text-slate-400 cursor-not-allowed"
                      : "text-slate-600 hover:text-emerald-600 hover:bg-emerald-50"
                }`}
              >
                <Trophy size={16} />
                Câu đã học ({learnedQuestions.length})
              </button>
              <button
                onClick={() => {
                  setStudyMode("unlearned")
                  setCurrentIndex(0)
                  resetQuestion()
                }}
                disabled={unlearnedCount === 0}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  studyMode === "unlearned"
                    ? "bg-emerald-600 text-white"
                    : unlearnedCount === 0
                      ? "text-slate-400 cursor-not-allowed"
                      : "text-slate-600 hover:text-emerald-600 hover:bg-emerald-50"
                }`}
              >
                <BookOpen size={16} />
                Câu chưa học ({unlearnedCount})
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between mb-4 gap-4">
          <button
            onClick={() => setShowHighlights(!showHighlights)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {showHighlights ? <ToggleRight size={20} className="text-emerald-600" /> : <ToggleLeft size={20} className="text-gray-400" />}
            Hiển thị keywords
          </button>

          <div className="flex gap-2">
            <div className="relative">
              <button
                onClick={() => setShowJumpInput(!showJumpInput)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ArrowRight size={20} />
                Đi đến
              </button>
              {showJumpInput && (
                <form onSubmit={handleJumpToQuestion} className="absolute top-12 left-0 z-10 bg-white border border-gray-300 rounded-lg shadow-md p-2 flex items-center">
                  <input
                    type="number"
                    placeholder="Số câu hỏi"
                    value={jumpToQuestion}
                    onChange={(e) => setJumpToQuestion(e.target.value)}
                    className="w-32 p-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-open-sans"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 text-white rounded-r-lg hover:bg-emerald-700 transition-colors"
                  >
                    <ArrowRight size={16} />
                  </button>
                </form>   
            )}
            </div>

            <div className="relative">
              <button
                onClick={() => setShowSearchInput(!showSearchInput)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Search size={20} />
                Tìm kiếm
              </button>
              {showSearchInput && (
                <form onSubmit={handleQuestionSearch} className="absolute top-12 left-0 z-10 bg-white border border-gray-300 rounded-lg shadow-md p-2 flex items-center">
                  <input
                    type="text"
                    placeholder="Tìm kiếm câu hỏi..."
                    value={questionSearchTerm}
                    onChange={(e) => setQuestionSearchTerm(e.target.value)}
                    className="w-48 p-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-open-sans"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 text-white rounded-r-lg hover:bg-emerald-700 transition-colors"
                  >
                    <Search size={16} />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-slate-600 font-open-sans">
              Câu {currentQuestions.length > 0 ? currentIndex + 1 : 0} / {currentQuestions.length}
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

        {currentQuestions.length > 0 && currentQuestion ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="p-6 border-b border-gray-200 flex justify-between items-start">
              <div className="flex-1">
                <h2 className="text-lg font-medium text-slate-800 leading-relaxed font-work-sans select-text"
                  dangerouslySetInnerHTML={{ __html: highlightText(currentQuestion.question, currentHighlighted) }}
                ></h2>
                {currentQuestion.answers.length > 1 && (
                  <p className="text-sm text-slate-600 font-open-sans mt-2 italic">Chọn nhiều đáp án</p>
                )}
              </div>
              <button onClick={toggleImportant} className="ml-2">
                <Star size={24} fill={importantQuestions.includes(currentQuestion.question) ? "gold" : "none"} stroke={importantQuestions.includes(currentQuestion.question) ? "gold" : "currentColor"} />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => {
                  const isSelected = selectedAnswers.includes(option)
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

              {currentQuestion.answers.length > 1 && !showAnswer && (
                <div className="mt-6">
                  <button
                    onClick={handleCheckAnswers}
                    disabled={selectedAnswers.length === 0}
                    className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                  >
                    Kiểm tra
                  </button>
                </div>
              )}

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
                      Đáp án đúng: {currentQuestion.answers.map(a => currentQuestion.options[a.charCodeAt(0) - 65]).join(", ")}
                    </p>
                  )}
                  {!isCorrect && (
                    <div className="mt-4">
                      <p className="text-sm italic font-open-sans mb-2">
                        Chọn văn bản trong câu hỏi hoặc đáp án, nhập trực tiếp keyword.
                      </p>
                      <form onSubmit={handleKeywordSubmit} className="flex flex-col sm:flex-row gap-2 items-center">
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

              {currentHighlighted.length > 0 && showHighlights && (
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
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 p-8 text-center">
            <BookOpen size={48} className="text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-800 mb-2 font-work-sans">Không có</h3>
            <p className="text-slate-600 mb-6 font-open-sans">Không tìm thấy câu hỏi nào.</p>
            <button
              onClick={clearSearchFilter}
              className="px-6 py-2 border border-gray-300 text-slate-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Xóa tìm kiếm
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
          <button
            onClick={prevQuestion}
            className="flex-1 sm:flex-none flex items-center gap-2 px-4 py-2 border border-gray-300 text-slate-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            <ArrowLeft size={16} />
            Câu trước
          </button>

          <button
            onClick={resetQuestion}
            className="flex-1 sm:flex-none flex items-center gap-2 px-4 py-2 border border-gray-300 text-slate-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            <RotateCcw size={16} />
            Làm lại
          </button>

          <button
            onClick={nextQuestion}
            className="flex-1 sm:flex-none flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
          >
            Câu tiếp
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {snackbarMessage && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-3 bg-red-500 text-white rounded-lg shadow-lg z-50">
          {snackbarMessage}
        </div>
      )}
    </div>
  )
}