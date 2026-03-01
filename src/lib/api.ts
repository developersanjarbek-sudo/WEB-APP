const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getDb = () => {
  const db = localStorage.getItem('edurating_db');
  if (db) return JSON.parse(db);
  return {
    users: [],
    students: [],
    evaluations: []
  };
};

const saveDb = (db: any) => {
  localStorage.setItem('edurating_db', JSON.stringify(db));
};

export const api = {
  async login(data: any) {
    await delay(500);
    const db = getDb();
    const user = db.users.find((u: any) => u.email === data.email && u.password === data.password);
    if (!user) throw new Error('Email yoki parol noto`g`ri');
    const token = btoa(JSON.stringify({ id: user.id, email: user.email }));
    return { token, user: { id: user.id, name: user.name, email: user.email } };
  },
  
  async register(data: any) {
    await delay(500);
    const db = getDb();
    if (db.users.find((u: any) => u.email === data.email)) {
      throw new Error('Bu email allaqachon ro`yxatdan o`tgan');
    }
    const newUser = {
      id: Date.now(),
      name: data.name,
      email: data.email,
      password: data.password
    };
    db.users.push(newUser);
    saveDb(db);
    const token = btoa(JSON.stringify({ id: newUser.id, email: newUser.email }));
    return { token, user: { id: newUser.id, name: newUser.name, email: newUser.email } };
  },

  async getMe(token: string) {
    await delay(200);
    try {
      const payload = JSON.parse(atob(token));
      const db = getDb();
      const user = db.users.find((u: any) => u.id === payload.id);
      if (!user) throw new Error('Foydalanuvchi topilmadi');
      return { user: { id: user.id, name: user.name, email: user.email } };
    } catch {
      throw new Error('Yaroqsiz token');
    }
  },

  async getStudents(token: string) {
    await delay(300);
    const payload = JSON.parse(atob(token));
    const db = getDb();
    return db.students.filter((s: any) => s.teacher_id === payload.id).sort((a:any, b:any) => b.id - a.id);
  },

  async addStudent(token: string, data: any) {
    await delay(300);
    const payload = JSON.parse(atob(token));
    const db = getDb();
    const newStudent = {
      id: Date.now(),
      teacher_id: payload.id,
      first_name: data.first_name,
      last_name: data.last_name,
      grade_level: data.grade_level,
      created_at: new Date().toISOString()
    };
    db.students.push(newStudent);
    saveDb(db);
    return newStudent;
  },

  async updateStudent(token: string, id: number, data: any) {
    await delay(300);
    const payload = JSON.parse(atob(token));
    const db = getDb();
    const index = db.students.findIndex((s: any) => s.id === id && s.teacher_id === payload.id);
    if (index === -1) throw new Error('O`quvchi topilmadi');
    db.students[index] = { ...db.students[index], ...data };
    saveDb(db);
    return db.students[index];
  },

  async deleteStudent(token: string, id: number) {
    await delay(300);
    const payload = JSON.parse(atob(token));
    const db = getDb();
    const index = db.students.findIndex((s: any) => s.id === id && s.teacher_id === payload.id);
    if (index === -1) throw new Error('O`quvchi topilmadi');
    db.students.splice(index, 1);
    db.evaluations = db.evaluations.filter((e: any) => e.student_id !== id);
    saveDb(db);
    return { success: true };
  },

  async getEvaluations(token: string, studentId: number) {
    await delay(300);
    const db = getDb();
    return db.evaluations.filter((e: any) => e.student_id === studentId).sort((a:any, b:any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  async addEvaluation(token: string, studentId: number, data: any) {
    await delay(300);
    const db = getDb();
    const newEval = {
      id: Date.now(),
      student_id: studentId,
      subject: data.subject,
      score: data.score,
      comments: data.comments,
      date: new Date().toISOString()
    };
    db.evaluations.push(newEval);
    saveDb(db);
    return newEval;
  },

  async getRanking(token: string) {
    await delay(300);
    const payload = JSON.parse(atob(token));
    const db = getDb();
    const students = db.students.filter((s: any) => s.teacher_id === payload.id);
    
    const ranking = students.map((student: any) => {
      const evals = db.evaluations.filter((e: any) => e.student_id === student.id);
      const total_evaluations = evals.length;
      const average_score = total_evaluations > 0 
        ? evals.reduce((acc: number, curr: any) => acc + curr.score, 0) / total_evaluations 
        : 0;
        
      return {
        ...student,
        total_evaluations,
        average_score
      };
    });

    return ranking.sort((a: any, b: any) => b.average_score - a.average_score);
  }
};
