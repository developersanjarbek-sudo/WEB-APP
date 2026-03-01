import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Plus, Star, Calendar, BookOpen, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Evaluation {
  id: number;
  subject: string;
  score: number;
  comments: string;
  date: string;
}

interface Student {
  id: number;
  first_name: string;
  last_name: string;
  grade_level: string;
}

export default function Evaluations() {
  const { id } = useParams<{ id: string }>();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const { token } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [subject, setSubject] = useState('');
  const [score, setScore] = useState<number | ''>('');
  const [comments, setComments] = useState('');

  const fetchEvaluations = () => {
    fetch(`/api/students/${id}/evaluations`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setEvaluations(data);
      });
  };

  useEffect(() => {
    // Fetch student details
    fetch('/api/students', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        const found = data.find((s: Student) => s.id === Number(id));
        if (found) setStudent(found);
        else navigate('/students');
      });

    fetchEvaluations();
    setLoading(false);
  }, [id, token, navigate]);

  const handleAddEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/students/${id}/evaluations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ subject, score: Number(score), comments })
      });
      if (res.ok) {
        setShowAddModal(false);
        setSubject('');
        setScore('');
        setComments('');
        fetchEvaluations();
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (loading || !student) {
    return <div className="flex justify-center items-center h-64">Yuklanmoqda...</div>;
  }

  const avgScore = evaluations.length > 0 
    ? evaluations.reduce((acc, curr) => acc + curr.score, 0) / evaluations.length 
    : 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate('/students')}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{student.first_name} {student.last_name}</h1>
            <p className="text-slate-500">{student.grade_level} sinf o'quvchisi</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-slate-500">O'rtacha ball</p>
          <div className="flex items-center justify-end">
            <Star className="w-5 h-5 text-amber-500 mr-1" fill="currentColor" />
            <span className="text-2xl font-bold text-slate-900">{avgScore.toFixed(1)}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-slate-800">Baholar tarixi</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5 mr-2" />
          Baho qo'shish
        </button>
      </div>

      {/* Evaluations List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {evaluations.map((evalItem, index) => (
            <motion.div
              key={evalItem.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-indigo-50 to-transparent rounded-bl-full -mr-4 -mt-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="flex justify-between items-start mb-4 relative">
                <div className="flex items-center text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">
                  <BookOpen className="w-4 h-4 mr-2" />
                  <span className="font-medium">{evalItem.subject}</span>
                </div>
                <div className="flex items-center justify-center w-12 h-12 bg-slate-50 rounded-full border-2 border-slate-100">
                  <span className="text-xl font-bold text-slate-800">{evalItem.score}</span>
                </div>
              </div>

              <div className="space-y-3">
                {evalItem.comments && (
                  <div className="flex items-start text-sm text-slate-600 bg-slate-50 p-3 rounded-xl">
                    <MessageSquare className="w-4 h-4 mr-2 mt-0.5 text-slate-400 flex-shrink-0" />
                    <p className="line-clamp-3">{evalItem.comments}</p>
                  </div>
                )}
                <div className="flex items-center text-xs text-slate-400 pt-2 border-t border-slate-100">
                  <Calendar className="w-3 h-3 mr-1" />
                  {new Date(evalItem.date).toLocaleDateString('uz-UZ', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {evaluations.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Star className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-1">Hozircha baholar yo'q</h3>
          <p className="text-slate-500">O'quvchiga birinchi bahoni qo'shing</p>
        </div>
      )}

      {/* Add Evaluation Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-slate-900">Yangi baho qo'shish</h3>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  &times;
                </button>
              </div>
              <form onSubmit={handleAddEvaluation} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fan nomi</label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                    placeholder="Matematika"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Baho (0-100)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="100"
                    value={score}
                    onChange={(e) => setScore(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                    placeholder="85"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Izoh (ixtiyoriy)</label>
                  <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent resize-none h-24"
                    placeholder="Juda yaxshi o'zlashtirdi..."
                  />
                </div>
                <div className="pt-4 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
                  >
                    Saqlash
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
