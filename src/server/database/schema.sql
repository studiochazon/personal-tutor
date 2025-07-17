CREATE TABLE IF NOT EXISTS Courses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS Lessons (
  id TEXT PRIMARY KEY,
  courseId TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  videoUrl TEXT,
  "order" INTEGER,
  FOREIGN KEY(courseId) REFERENCES Courses(id)
);

CREATE TABLE IF NOT EXISTS Progress (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  courseId TEXT NOT NULL,
  lessonId TEXT NOT NULL,
  completed INTEGER NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY(courseId) REFERENCES Courses(id),
  FOREIGN KEY(lessonId) REFERENCES Lessons(id)
); 