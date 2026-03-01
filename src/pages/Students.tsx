import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, Trash2, Edit, Eye, UserPlus, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';

interface Student {
  id: number;
  first_name: string;
  last_name: string;
  grade_level: string;
  created_at: string;
}

export default function Students() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { token } = useAuth();

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');

  const fetchStudents = () => {
    fetch('/api/students', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setStudents(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchStudents();
  }, [token]);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ first_name: firstName, last_name: lastName, grade_level: gradeLevel })
      });
      if (res.ok) {
        setShowAddModal(false);
        setFirstName('');
        setLastName('');
        setGradeLevel('');
        fetchStudents();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleEditStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    try {
      const res = await fetch(`/api/students/${editingStudent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ first_name: firstName, last_name: lastName, grade_level: gradeLevel })
      });
      if (res.ok) {
        setShowEditModal(false);
        setEditingStudent(null);
        setFirstName('');
        setLastName('');
        setGradeLevel('');
        fetchStudents();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setFirstName(student.first_name);
    setLastName(student.last_name);
    setGradeLevel(student.grade_level);
    setShowEditModal(true);
  };

  const confirmDelete = async () => {
    if (!studentToDelete) return;
    try {
      const res = await fetch(`/api/students/${studentToDelete}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchStudents();
        setStudentToDelete(null);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const filteredStudents = students.filter(s => 
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.grade_level.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="O'quvchilarni qidirish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-shadow"
          />
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <UserPlus className="w-5 h-5 mr-2" />
          Yangi o'quvchi
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">Yuklanmoqda...</div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
                <th className="px-6 py-4 font-medium">Ism Familiya</th>
                <th className="px-6 py-4 font-medium">Sinf</th>
                <th className="px-6 py-4 font-medium">Qo'shilgan sana</th>
                <th className="px-6 py-4 font-medium text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <AnimatePresence>
                {filteredStudents.map((student) => (
                  <motion.tr 
                    key={student.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="hover:bg-slate-50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold mr-3">
                          {student.first_name.charAt(0)}{student.last_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{student.first_name} {student.last_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{student.grade_level}</td>
                    <td className="px-6 py-4 text-slate-500 text-sm">
                      {new Date(student.created_at).toLocaleDateString('uz-UZ')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          to={`/students/${student.id}/evaluations`}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Baholash"
                        >
                          <Eye className="w-5 h-5" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => openEditModal(student)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Tahrirlash"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setStudentToDelete(student.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="O'chirish"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <Users className="w-12 h-12 text-slate-300 mb-4" />
                      <p className="text-lg font-medium text-slate-900">O'quvchilar topilmadi</p>
                      <p className="text-sm text-slate-500 mt-1">Yangi o'quvchi qo'shish tugmasini bosing</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Student Modal */}
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
                <h3 className="text-lg font-semibold text-slate-900">Yangi o'quvchi qo'shish</h3>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  &times;
                </button>
              </div>
              <form onSubmit={handleAddStudent} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ism</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                    placeholder="Ali"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Familiya</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                    placeholder="Valiyev"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Sinf</label>
                  <input
                    type="text"
                    required
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                    placeholder="10-A"
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

      {/* Edit Student Modal */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-slate-900">O'quvchini tahrirlash</h3>
                <button 
                  onClick={() => setShowEditModal(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  &times;
                </button>
              </div>
              <form onSubmit={handleEditStudent} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ism</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                    placeholder="Ali"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Familiya</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                    placeholder="Valiyev"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Sinf</label>
                  <input
                    type="text"
                    required
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                    placeholder="10-A"
                  />
                </div>
                <div className="pt-4 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
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

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {studentToDelete !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-6 text-center"
            >
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">O'quvchini o'chirish</h3>
              <p className="text-slate-500 mb-6">
                Haqiqatan ham bu o'quvchini o'chirmoqchimisiz? Barcha baholar ham o'chib ketadi. Bu amalni ortga qaytarib bo'lmaydi.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setStudentToDelete(null)}
                  className="flex-1 px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors font-medium"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors font-medium shadow-sm"
                >
                  O'chirish
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
