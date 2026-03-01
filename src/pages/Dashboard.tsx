import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Trophy, Users, Star, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import { api } from '../lib/api';

interface RankingStudent {
  id: number;
  first_name: string;
  last_name: string;
  grade_level: string;
  total_evaluations: number;
  average_score: number;
}

export default function Dashboard() {
  const [ranking, setRanking] = useState<RankingStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    if (token) {
      api.getRanking(token).then(data => {
        setRanking(data);
        setLoading(false);
      });
    }
  }, [token]);

  if (loading) {
    return <div className="flex justify-center items-center h-64">Yuklanmoqda...</div>;
  }

  const topStudents = ranking.slice(0, 3);
  const totalStudents = ranking.length;
  const avgScore = ranking.length > 0 
    ? ranking.reduce((acc, curr) => acc + (curr.average_score || 0), 0) / ranking.length 
    : 0;

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Jami o'quvchilar</p>
              <h3 className="text-3xl font-bold text-slate-900">{totalStudents}</h3>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">O'rtacha o'zlashtirish</p>
              <h3 className="text-3xl font-bold text-slate-900">{avgScore.toFixed(1)}</h3>
            </div>
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">A'lochi o'quvchilar</p>
              <h3 className="text-3xl font-bold text-slate-900">
                {ranking.filter(r => r.average_score >= 85).length}
              </h3>
            </div>
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
              <Star className="w-6 h-6 text-amber-500" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Top Students */}
      {topStudents.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
            <Trophy className="w-5 h-5 text-amber-500 mr-2" />
            Top O'quvchilar
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {topStudents.map((student, index) => (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-100 to-transparent rounded-bl-full -mr-4 -mt-4" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold">
                      #{index + 1}
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-slate-900">{student.average_score?.toFixed(1) || 0}</p>
                      <p className="text-xs text-slate-500">O'rtacha ball</p>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800">{student.first_name} {student.last_name}</h3>
                  <p className="text-sm text-slate-500">{student.grade_level} sinf</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Full Ranking Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">Umumiy Reyting</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-sm">
                <th className="px-6 py-4 font-medium">O'rin</th>
                <th className="px-6 py-4 font-medium">O'quvchi</th>
                <th className="px-6 py-4 font-medium">Sinf</th>
                <th className="px-6 py-4 font-medium">Baholar soni</th>
                <th className="px-6 py-4 font-medium">O'rtacha ball</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ranking.map((student, index) => (
                <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                      index === 0 ? 'bg-amber-100 text-amber-700' :
                      index === 1 ? 'bg-slate-200 text-slate-700' :
                      index === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{student.first_name} {student.last_name}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{student.grade_level}</td>
                  <td className="px-6 py-4 text-slate-600">{student.total_evaluations} ta</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-full bg-slate-200 rounded-full h-2 mr-3 max-w-[100px]">
                        <div 
                          className="bg-indigo-600 h-2 rounded-full" 
                          style={{ width: `${Math.min(100, student.average_score || 0)}%` }}
                        />
                      </div>
                      <span className="font-medium text-slate-900">{student.average_score?.toFixed(1) || 0}</span>
                    </div>
                  </td>
                </tr>
              ))}
              {ranking.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    Hozircha o'quvchilar yo'q
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
