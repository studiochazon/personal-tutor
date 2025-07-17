import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

interface Course {
  id: string;
  title: string;
  description: string;
  createdAt: string;
}

function App() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState('');
  const [creating, setCreating] = useState(false);

  const API_BASE = 'http://localhost:4000/api';
  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/courses`);
      setCourses(response.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const createCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setCreating(true);
    try {
      await axios.post(`${API_BASE}/courses`, { topic: topic.trim() });
      setTopic('');
      await fetchCourses();
    } catch (error) {
      console.error('Error creating course:', error);
      alert('Failed to create course. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-3xl font-bold text-indigo-600">Personal Tutor</h1>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              AI-Powered Learning
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Learn Anything with AI
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Tell us what you want to learn, and we'll create a personalized course just for you.
          </p>
        </div>

        {/* Course Creation Form */}
        <div className="max-w-2xl mx-auto">
          <form onSubmit={createCourse} className="max-w-2xl mx-auto">
            <div className="flex gap-4">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="I want to learn about..."
                className="flex-1 px-6 py-4 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={creating}
              />
              <button
                type="submit"
                disabled={creating || !topic.trim()}
                className="px-8 py-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {creating ? 'Creating...' : 'Create Course'}
              </button>
            </div>
          </form>
        </div>

        {/* Courses Section */}
        <div className="mb-8">
          <h3 className="text-2xl font-semibold text-gray-900 mb-6">Your Courses</h3>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12 fill-none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">No courses yet</h3>
              <p className="text-gray-500">Create your first course by entering a topic above!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// Course Card Component
function CourseCard({ course }: { course: Course }) {
  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
      <div className="p-6">
        <h4 className="text-xl font-semibold text-gray-900 mb-2">{course.title}</h4>
        <p className="text-gray-600 mb-4 line-clamp-3">{course.description}</p>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">
            Created {new Date(course.createdAt).toLocaleDateString()}
          </span>
          <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors">
            Start Learning
          </button>
        </div>
      </div>
    </div>
  );
}

export default App; 