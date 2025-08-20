"use client"

import { useState, useEffect } from "react"
import { BookOpen, Brain, Trophy, Search, Play, Sun, Moon } from "lucide-react"
import Link from "next/link"

interface Course {
  course_id: string
  course_name: string
  course_file: string
}

export default function HomePage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    loadCourses()
  }, [])

  const loadCourses = async () => {
    try {
      const response = await fetch("https://letankim.id.vn/?act=get_courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      const data = await response.json()
      if (data.success) {
        setCourses(data.data)
      }
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }

  const filteredCourses = courses.filter(
    (course) =>
      course.course_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.course_id.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getCourseCategory = (courseName: string) => {
    const prefix = courseName.substring(0, 3)
    const categories: Record<string, string> = {
      ENW: "Tiếng Anh",
      SSL: "Bảo mật",
      HOM: "Quản lý",
      HRM: "Nhân sự",
      MKT: "Marketing",
      PRP: "Lập trình",
      ITE: "CNTT",
      WED: "Thiết kế Web",
      SWE: "Phần mềm",
      OBE: "Kinh doanh",
      IMC: "Truyền thông",
      SSC: "An ninh",
      BDI: "Phân tích dữ liệu",
      AIL: "AI",
      CRY: "Mật mã",
      MSM: "Media",
      PRC: "Quy trình",
      DWP: "Phát triển Web",
      WDU: "Thiết kế UI",
      PMG: "Quản lý dự án",
      EPE: "Kinh tế",
      ADS: "Phân tích hệ thống",
      ITA: "Phân tích CNTT",
      MCO: "Truyền thông",
      VNR: "Việt Nam",
    }
    return categories[prefix] || "Khác"
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 bg-white border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <img
                src="https://letankim.id.vn/3do/assets/images/logo.jpg"
                alt="3DO Logo"
                className="h-8 w-8 mr-2 rounded"
              />
              <h1 className="text-xl font-bold text-emerald-600 font-work-sans">3DOLearning</h1>
            </div>

            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-emerald-600 font-medium hover:text-emerald-700 transition-colors">
                Trang chủ
              </Link>
              <Link href="/study" className="text-slate-600 hover:text-emerald-600 transition-colors">
                Học tập
              </Link>
              <Link href="/practice" className="text-slate-600 hover:text-emerald-600 transition-colors">
                Thi thử
              </Link>
              <Link href="/progress" className="text-slate-600 hover:text-emerald-600 transition-colors">
                Tiến độ
              </Link>
              <Link href="/docs" className="text-slate-600 hover:text-emerald-600 transition-colors">
                Tài liệu
              </Link>
            </nav>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>
      </header>

      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h2 className="text-4xl md:text-6xl font-bold text-slate-800 mb-6 font-work-sans">
              Học tập thông minh với
              <span className="text-emerald-600"> 3DOLearning</span>
            </h2>
            <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto font-open-sans">
              Nền tảng học trực tuyến hiện đại với flashcard thông minh và thi thử tương tác
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
                <BookOpen size={48} className="text-emerald-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-800 mb-3 font-work-sans">Flashcard thông minh</h3>
                <p className="text-slate-600 font-open-sans">
                  Học từ vựng hiệu quả với hệ thống flashcard tương tác, lưu trữ câu sai để ôn lại
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
                <Brain size={48} className="text-emerald-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-800 mb-3 font-work-sans">Thi thử thông minh</h3>
                <p className="text-slate-600 font-open-sans">
                  Tạo bài thi thử với số câu tùy chọn, câu hỏi ngẫu nhiên và lưu lịch sử
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
                <Trophy size={48} className="text-emerald-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-800 mb-3 font-work-sans">Theo dõi tiến độ</h3>
                <p className="text-slate-600 font-open-sans">
                  Xem thống kê chi tiết về quá trình học tập và kết quả thi thử
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-3xl font-bold text-center text-slate-800 mb-8 font-work-sans">Khóa học có sẵn</h3>

          <div className="max-w-md mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Tìm kiếm khóa học..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors font-open-sans"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
              <p className="text-slate-600 font-open-sans">Đang tải khóa học...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <div
                  key={course.course_id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-slate-800 mb-2 font-work-sans">
                          {course.course_name}
                        </h4>
                        <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 text-sm rounded-full font-medium">
                          {getCourseCategory(course.course_name)}
                        </span>
                      </div>
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full font-medium">
                        {course.course_id}
                      </span>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Link href={`/study?course=${course.course_id}&file=${course.course_file}`} className="flex-1">
                        <button className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors font-medium">
                          <BookOpen size={16} />
                          Học
                        </button>
                      </Link>
                      <Link href={`/practice?course=${course.course_id}&file=${course.course_file}`} className="flex-1">
                        <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium">
                          <Play size={16} />
                          Thi thử
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && filteredCourses.length === 0 && (
            <div className="text-center py-12">
              <Search size={48} className="text-gray-400 mx-auto mb-4" />
              <p className="text-slate-600 font-open-sans">Không tìm thấy khóa học nào</p>
            </div>
          )}
        </div>
      </section>

      <footer className="border-t border-gray-200 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <p className="text-slate-600 mb-4 font-open-sans">© 2025 LearnHub3DO. Bản quyền thuộc về 3Do.</p>
            <div className="flex justify-center gap-8">
              <a href="#" className="text-slate-600 hover:text-emerald-600 transition-colors font-open-sans">
                Chính sách riêng tư
              </a>
              <a href="#" className="text-slate-600 hover:text-emerald-600 transition-colors font-open-sans">
                Điều khoản sử dụng
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
