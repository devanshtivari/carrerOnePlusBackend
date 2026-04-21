-- ============================================================
-- Migration: add_lms_models
-- Adds catalog, enrollments, progress, assessments, projects,
-- assignments, classes, leaderboard, results, notifications,
-- announcements, feedback, alerts, events, labs, reports.
-- All new tables include a soft-delete `deletedAt` column.
-- Adds additive (nullable) columns to the existing User table.
-- ============================================================

-- ── Additive columns on existing User ──
ALTER TABLE "User" ADD COLUMN     "initials"        TEXT,
                   ADD COLUMN     "rollNo"          TEXT,
                   ADD COLUMN     "instructorTitle" TEXT,
                   ADD COLUMN     "bio"             TEXT;

-- Indexes added on existing User
CREATE INDEX "User_role_idx"       ON "User"("role");
CREATE INDEX "User_totalScore_idx" ON "User"("totalScore");

-- ────────────────────────────────────────────────────────────
-- Enums
-- ────────────────────────────────────────────────────────────
CREATE TYPE "CourseLevel"          AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');
CREATE TYPE "UnitStatus"           AS ENUM ('LOCKED', 'IN_PROGRESS', 'COMPLETED');
CREATE TYPE "LessonType"           AS ENUM ('LESSON', 'QUIZ', 'LAB', 'CASE_STUDY');
CREATE TYPE "ResourceKind"         AS ENUM ('PDF', 'CSV', 'LINK', 'VIDEO', 'IMAGE');
CREATE TYPE "TestStatus"           AS ENUM ('UPCOMING', 'LIVE', 'COMPLETED', 'ARCHIVED');
CREATE TYPE "TestType"             AS ENUM ('MCQ', 'SUBJECTIVE', 'MIXED');
CREATE TYPE "QuestionType"         AS ENUM ('MCQ', 'TEXT');
CREATE TYPE "AttemptStatus"        AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'GRADED', 'EXPIRED');
CREATE TYPE "SubmissionStatus"     AS ENUM ('NOT_SUBMITTED', 'SUBMITTED', 'GRADED', 'REJECTED');
CREATE TYPE "AssignmentStatus"     AS ENUM ('ACTIVE', 'COMPLETED', 'ARCHIVED');
CREATE TYPE "NotificationType"     AS ENUM ('COURSE', 'ACHIEVEMENT', 'FEEDBACK', 'ALERT', 'SYSTEM');
CREATE TYPE "AnnouncementAudience" AS ENUM ('ALL', 'STUDENT', 'INSTRUCTOR');
CREATE TYPE "AlertPriority"        AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "LeaderboardScope"     AS ENUM ('CLASS', 'SCHOOL', 'NATIONAL', 'GLOBAL');
CREATE TYPE "TrendDirection"       AS ENUM ('UP', 'DOWN', 'STABLE');
CREATE TYPE "LabRuntimeStatus"     AS ENUM ('AVAILABLE', 'HIGH_TRAFFIC', 'OFFLINE', 'MAINTENANCE');
CREATE TYPE "CalendarEventType"    AS ENUM ('EVENT', 'MEETING', 'ACTIVITY');
CREATE TYPE "ClassMembershipRole"  AS ENUM ('STUDENT', 'TEACHER', 'ASSISTANT');
CREATE TYPE "ReportKind"           AS ENUM ('PERFORMANCE_SUMMARY', 'TREND', 'ATTENDANCE', 'CUSTOM');

-- ────────────────────────────────────────────────────────────
-- Category
-- ────────────────────────────────────────────────────────────
CREATE TABLE "Category" (
    "id"        TEXT NOT NULL,
    "slug"      TEXT NOT NULL,
    "label"     TEXT NOT NULL,
    "iconName"  TEXT,
    "position"  INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");
CREATE INDEX "Category_slug_idx"      ON "Category"("slug");
CREATE INDEX "Category_deletedAt_idx" ON "Category"("deletedAt");

-- ────────────────────────────────────────────────────────────
-- Course
-- ────────────────────────────────────────────────────────────
CREATE TABLE "Course" (
    "id"                 TEXT NOT NULL,
    "slug"               TEXT NOT NULL,
    "title"              TEXT NOT NULL,
    "shortName"          TEXT,
    "description"        TEXT NOT NULL,
    "imageUrl"           TEXT,
    "level"              "CourseLevel" NOT NULL DEFAULT 'BEGINNER',
    "badge"              TEXT,
    "priceCents"         INTEGER,
    "originalPriceCents" INTEGER,
    "currency"           TEXT NOT NULL DEFAULT 'INR',
    "durationLabel"      TEXT,
    "ratingAvg"          DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ratingCount"        INTEGER NOT NULL DEFAULT 0,
    "enrolledLabel"      TEXT,
    "isFeatured"         BOOLEAN NOT NULL DEFAULT false,
    "isPublished"        BOOLEAN NOT NULL DEFAULT true,
    "classmateCount"     INTEGER NOT NULL DEFAULT 0,
    "learnings"          TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "tags"               TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "totalLessons"       INTEGER NOT NULL DEFAULT 0,
    "totalUnits"         INTEGER NOT NULL DEFAULT 0,
    "totalTopics"        INTEGER NOT NULL DEFAULT 0,
    "totalTests"         INTEGER NOT NULL DEFAULT 0,
    "totalProjects"      INTEGER NOT NULL DEFAULT 0,
    "categoryId"         TEXT,
    "instructorId"       TEXT,
    "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"          TIMESTAMP(3) NOT NULL,
    "deletedAt"          TIMESTAMP(3),
    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Course_slug_key"       ON "Course"("slug");
CREATE INDEX "Course_slug_idx"              ON "Course"("slug");
CREATE INDEX "Course_categoryId_idx"        ON "Course"("categoryId");
CREATE INDEX "Course_instructorId_idx"      ON "Course"("instructorId");
CREATE INDEX "Course_isFeatured_idx"        ON "Course"("isFeatured");
CREATE INDEX "Course_deletedAt_idx"         ON "Course"("deletedAt");

-- ────────────────────────────────────────────────────────────
-- Unit
-- ────────────────────────────────────────────────────────────
CREATE TABLE "Unit" (
    "id"            TEXT NOT NULL,
    "courseId"      TEXT NOT NULL,
    "moduleNumber"  INTEGER NOT NULL,
    "title"         TEXT NOT NULL,
    "description"   TEXT,
    "imageUrl"      TEXT,
    "durationLabel" TEXT,
    "topicCount"    INTEGER NOT NULL DEFAULT 0,
    "position"      INTEGER NOT NULL DEFAULT 0,
    "status"        "UnitStatus" NOT NULL DEFAULT 'LOCKED',
    "isLocked"      BOOLEAN NOT NULL DEFAULT false,
    "hours"         INTEGER,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL,
    "deletedAt"     TIMESTAMP(3),
    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Unit_courseId_moduleNumber_key" ON "Unit"("courseId", "moduleNumber");
CREATE INDEX "Unit_courseId_idx"                     ON "Unit"("courseId");
CREATE INDEX "Unit_deletedAt_idx"                    ON "Unit"("deletedAt");

-- ────────────────────────────────────────────────────────────
-- Chapter
-- ────────────────────────────────────────────────────────────
CREATE TABLE "Chapter" (
    "id"            TEXT NOT NULL,
    "unitId"        TEXT NOT NULL,
    "title"         TEXT NOT NULL,
    "description"   TEXT,
    "position"      INTEGER NOT NULL DEFAULT 0,
    "durationLabel" TEXT,
    "totalLessons"  INTEGER NOT NULL DEFAULT 0,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL,
    "deletedAt"     TIMESTAMP(3),
    CONSTRAINT "Chapter_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Chapter_unitId_position_key" ON "Chapter"("unitId", "position");
CREATE INDEX "Chapter_unitId_idx"                 ON "Chapter"("unitId");
CREATE INDEX "Chapter_deletedAt_idx"              ON "Chapter"("deletedAt");

-- ────────────────────────────────────────────────────────────
-- Lesson
-- ────────────────────────────────────────────────────────────
CREATE TABLE "Lesson" (
    "id"              TEXT NOT NULL,
    "chapterId"       TEXT NOT NULL,
    "title"           TEXT NOT NULL,
    "type"            "LessonType" NOT NULL DEFAULT 'LESSON',
    "durationLabel"   TEXT,
    "durationSeconds" INTEGER,
    "position"        INTEGER NOT NULL DEFAULT 0,
    "contentUrl"      TEXT,
    "body"            TEXT,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL,
    "deletedAt"       TIMESTAMP(3),
    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Lesson_chapterId_position_key" ON "Lesson"("chapterId", "position");
CREATE INDEX "Lesson_chapterId_idx"                 ON "Lesson"("chapterId");
CREATE INDEX "Lesson_deletedAt_idx"                 ON "Lesson"("deletedAt");

-- ────────────────────────────────────────────────────────────
-- Resource
-- ────────────────────────────────────────────────────────────
CREATE TABLE "Resource" (
    "id"        TEXT NOT NULL,
    "unitId"    TEXT,
    "name"      TEXT NOT NULL,
    "kind"      "ResourceKind" NOT NULL DEFAULT 'PDF',
    "url"       TEXT,
    "sizeLabel" TEXT,
    "position"  INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Resource_unitId_idx"    ON "Resource"("unitId");
CREATE INDEX "Resource_deletedAt_idx" ON "Resource"("deletedAt");

-- ────────────────────────────────────────────────────────────
-- Enrollment
-- ────────────────────────────────────────────────────────────
CREATE TABLE "Enrollment" (
    "id"           TEXT NOT NULL,
    "userId"       TEXT NOT NULL,
    "courseId"     TEXT NOT NULL,
    "progress"     INTEGER NOT NULL DEFAULT 0,
    "enrolledAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt"  TIMESTAMP(3),
    "lastAccessAt" TIMESTAMP(3),
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,
    "deletedAt"    TIMESTAMP(3),
    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Enrollment_userId_courseId_key" ON "Enrollment"("userId", "courseId");
CREATE INDEX "Enrollment_userId_idx"                 ON "Enrollment"("userId");
CREATE INDEX "Enrollment_courseId_idx"               ON "Enrollment"("courseId");
CREATE INDEX "Enrollment_deletedAt_idx"              ON "Enrollment"("deletedAt");

-- ────────────────────────────────────────────────────────────
-- LessonCompletion
-- ────────────────────────────────────────────────────────────
CREATE TABLE "LessonCompletion" (
    "id"          TEXT NOT NULL,
    "userId"      TEXT NOT NULL,
    "lessonId"    TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LessonCompletion_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "LessonCompletion_userId_lessonId_key" ON "LessonCompletion"("userId", "lessonId");
CREATE INDEX "LessonCompletion_userId_idx"                 ON "LessonCompletion"("userId");
CREATE INDEX "LessonCompletion_lessonId_idx"               ON "LessonCompletion"("lessonId");

-- ────────────────────────────────────────────────────────────
-- Test
-- ────────────────────────────────────────────────────────────
CREATE TABLE "Test" (
    "id"              TEXT NOT NULL,
    "code"            TEXT NOT NULL,
    "title"           TEXT NOT NULL,
    "description"     TEXT,
    "courseLabel"     TEXT,
    "courseId"        TEXT,
    "durationMinutes" INTEGER NOT NULL DEFAULT 0,
    "totalMarks"      INTEGER NOT NULL DEFAULT 0,
    "totalQuestions"  INTEGER NOT NULL DEFAULT 0,
    "type"            "TestType" NOT NULL DEFAULT 'MCQ',
    "status"          "TestStatus" NOT NULL DEFAULT 'UPCOMING',
    "scheduledAt"     TIMESTAMP(3),
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL,
    "deletedAt"       TIMESTAMP(3),
    CONSTRAINT "Test_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Test_code_key"     ON "Test"("code");
CREATE INDEX "Test_code_idx"            ON "Test"("code");
CREATE INDEX "Test_courseId_idx"        ON "Test"("courseId");
CREATE INDEX "Test_status_idx"          ON "Test"("status");
CREATE INDEX "Test_deletedAt_idx"       ON "Test"("deletedAt");

-- ────────────────────────────────────────────────────────────
-- Question
-- ────────────────────────────────────────────────────────────
CREATE TABLE "Question" (
    "id"        TEXT NOT NULL,
    "testId"    TEXT NOT NULL,
    "type"      "QuestionType" NOT NULL DEFAULT 'MCQ',
    "prompt"    TEXT NOT NULL,
    "marks"     INTEGER NOT NULL DEFAULT 0,
    "position"  INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Question_testId_position_key" ON "Question"("testId", "position");
CREATE INDEX "Question_testId_idx"                 ON "Question"("testId");
CREATE INDEX "Question_deletedAt_idx"              ON "Question"("deletedAt");

-- ────────────────────────────────────────────────────────────
-- QuestionOption
-- ────────────────────────────────────────────────────────────
CREATE TABLE "QuestionOption" (
    "id"         TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "label"      TEXT NOT NULL,
    "text"       TEXT NOT NULL,
    "isCorrect"  BOOLEAN NOT NULL DEFAULT false,
    "position"   INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "QuestionOption_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "QuestionOption_questionId_label_key" ON "QuestionOption"("questionId", "label");
CREATE INDEX "QuestionOption_questionId_idx"              ON "QuestionOption"("questionId");

-- ────────────────────────────────────────────────────────────
-- TestGuideline
-- ────────────────────────────────────────────────────────────
CREATE TABLE "TestGuideline" (
    "id"        TEXT NOT NULL,
    "testId"    TEXT,
    "text"      TEXT NOT NULL,
    "position"  INTEGER NOT NULL DEFAULT 0,
    "scope"     TEXT NOT NULL DEFAULT 'PLATFORM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "TestGuideline_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "TestGuideline_testId_idx" ON "TestGuideline"("testId");
CREATE INDEX "TestGuideline_scope_idx"  ON "TestGuideline"("scope");

-- ────────────────────────────────────────────────────────────
-- TestAttempt
-- ────────────────────────────────────────────────────────────
CREATE TABLE "TestAttempt" (
    "id"          TEXT NOT NULL,
    "testId"      TEXT NOT NULL,
    "userId"      TEXT NOT NULL,
    "status"      "AttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "gradedAt"    TIMESTAMP(3),
    "score"       INTEGER,
    "maxScore"    INTEGER,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,
    "deletedAt"   TIMESTAMP(3),
    CONSTRAINT "TestAttempt_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "TestAttempt_testId_idx"    ON "TestAttempt"("testId");
CREATE INDEX "TestAttempt_userId_idx"    ON "TestAttempt"("userId");
CREATE INDEX "TestAttempt_status_idx"    ON "TestAttempt"("status");
CREATE INDEX "TestAttempt_deletedAt_idx" ON "TestAttempt"("deletedAt");

-- ────────────────────────────────────────────────────────────
-- AttemptAnswer
-- ────────────────────────────────────────────────────────────
CREATE TABLE "AttemptAnswer" (
    "id"            TEXT NOT NULL,
    "attemptId"     TEXT NOT NULL,
    "questionId"    TEXT NOT NULL,
    "selectedLabel" TEXT,
    "textAnswer"    TEXT,
    "awardedMarks"  INTEGER,
    "isCorrect"     BOOLEAN,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AttemptAnswer_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AttemptAnswer_attemptId_questionId_key" ON "AttemptAnswer"("attemptId", "questionId");
CREATE INDEX "AttemptAnswer_attemptId_idx"                   ON "AttemptAnswer"("attemptId");
CREATE INDEX "AttemptAnswer_questionId_idx"                  ON "AttemptAnswer"("questionId");

-- ────────────────────────────────────────────────────────────
-- Project
-- ────────────────────────────────────────────────────────────
CREATE TABLE "Project" (
    "id"          TEXT NOT NULL,
    "unitId"      TEXT,
    "courseId"    TEXT,
    "title"       TEXT NOT NULL,
    "description" TEXT,
    "imageUrl"    TEXT,
    "deadline"    TIMESTAMP(3),
    "totalMarks"  INTEGER NOT NULL DEFAULT 100,
    "isActive"    BOOLEAN NOT NULL DEFAULT true,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,
    "deletedAt"   TIMESTAMP(3),
    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Project_unitId_idx"    ON "Project"("unitId");
CREATE INDEX "Project_courseId_idx"  ON "Project"("courseId");
CREATE INDEX "Project_deletedAt_idx" ON "Project"("deletedAt");

-- ────────────────────────────────────────────────────────────
-- ProjectSubmission
-- ────────────────────────────────────────────────────────────
CREATE TABLE "ProjectSubmission" (
    "id"           TEXT NOT NULL,
    "projectId"    TEXT NOT NULL,
    "userId"       TEXT NOT NULL,
    "status"       "SubmissionStatus" NOT NULL DEFAULT 'NOT_SUBMITTED',
    "fileName"     TEXT,
    "fileSize"     TEXT,
    "fileUrl"      TEXT,
    "submittedAt"  TIMESTAMP(3),
    "gradedAt"     TIMESTAMP(3),
    "marksAwarded" INTEGER,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,
    "deletedAt"    TIMESTAMP(3),
    CONSTRAINT "ProjectSubmission_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ProjectSubmission_projectId_userId_key" ON "ProjectSubmission"("projectId", "userId");
CREATE INDEX "ProjectSubmission_projectId_idx"               ON "ProjectSubmission"("projectId");
CREATE INDEX "ProjectSubmission_userId_idx"                  ON "ProjectSubmission"("userId");
CREATE INDEX "ProjectSubmission_status_idx"                  ON "ProjectSubmission"("status");
CREATE INDEX "ProjectSubmission_deletedAt_idx"               ON "ProjectSubmission"("deletedAt");

-- ────────────────────────────────────────────────────────────
-- Assignment
-- ────────────────────────────────────────────────────────────
CREATE TABLE "Assignment" (
    "id"             TEXT NOT NULL,
    "classId"        TEXT,
    "courseId"       TEXT,
    "title"          TEXT NOT NULL,
    "description"    TEXT,
    "dueDate"        TIMESTAMP(3),
    "status"         "AssignmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "totalStudents"  INTEGER NOT NULL DEFAULT 0,
    "submittedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL,
    "deletedAt"      TIMESTAMP(3),
    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Assignment_classId_idx"   ON "Assignment"("classId");
CREATE INDEX "Assignment_courseId_idx"  ON "Assignment"("courseId");
CREATE INDEX "Assignment_status_idx"    ON "Assignment"("status");
CREATE INDEX "Assignment_deletedAt_idx" ON "Assignment"("deletedAt");

-- ────────────────────────────────────────────────────────────
-- AssignmentSubmission
-- ────────────────────────────────────────────────────────────
CREATE TABLE "AssignmentSubmission" (
    "id"           TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "userId"       TEXT NOT NULL,
    "status"       "SubmissionStatus" NOT NULL DEFAULT 'NOT_SUBMITTED',
    "submittedAt"  TIMESTAMP(3),
    "gradeLabel"   TEXT,
    "marksAwarded" INTEGER,
    "totalMarks"   INTEGER,
    "feedback"     TEXT,
    "fileUrl"      TEXT,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,
    "deletedAt"    TIMESTAMP(3),
    CONSTRAINT "AssignmentSubmission_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AssignmentSubmission_assignmentId_userId_key" ON "AssignmentSubmission"("assignmentId", "userId");
CREATE INDEX "AssignmentSubmission_assignmentId_idx"               ON "AssignmentSubmission"("assignmentId");
CREATE INDEX "AssignmentSubmission_userId_idx"                     ON "AssignmentSubmission"("userId");
CREATE INDEX "AssignmentSubmission_deletedAt_idx"                  ON "AssignmentSubmission"("deletedAt");

-- ────────────────────────────────────────────────────────────
-- Class
-- ────────────────────────────────────────────────────────────
CREATE TABLE "Class" (
    "id"          TEXT NOT NULL,
    "code"        TEXT NOT NULL,
    "name"        TEXT NOT NULL,
    "grade"       TEXT,
    "section"     TEXT,
    "schoolName"  TEXT,
    "description" TEXT,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,
    "deletedAt"   TIMESTAMP(3),
    CONSTRAINT "Class_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Class_code_key"     ON "Class"("code");
CREATE INDEX "Class_deletedAt_idx"       ON "Class"("deletedAt");

-- ────────────────────────────────────────────────────────────
-- ClassMembership
-- ────────────────────────────────────────────────────────────
CREATE TABLE "ClassMembership" (
    "id"        TEXT NOT NULL,
    "classId"   TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "role"      "ClassMembershipRole" NOT NULL DEFAULT 'STUDENT',
    "joinedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "ClassMembership_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ClassMembership_classId_userId_role_key" ON "ClassMembership"("classId", "userId", "role");
CREATE INDEX "ClassMembership_classId_idx"                    ON "ClassMembership"("classId");
CREATE INDEX "ClassMembership_userId_idx"                     ON "ClassMembership"("userId");
CREATE INDEX "ClassMembership_role_idx"                       ON "ClassMembership"("role");
CREATE INDEX "ClassMembership_deletedAt_idx"                  ON "ClassMembership"("deletedAt");

-- ────────────────────────────────────────────────────────────
-- LeaderboardEntry
-- ────────────────────────────────────────────────────────────
CREATE TABLE "LeaderboardEntry" (
    "id"          TEXT NOT NULL,
    "scope"       "LeaderboardScope" NOT NULL,
    "scopeKey"    TEXT,
    "userId"      TEXT NOT NULL,
    "rank"        INTEGER NOT NULL,
    "points"      INTEGER NOT NULL DEFAULT 0,
    "coursesDone" INTEGER NOT NULL DEFAULT 0,
    "streakDays"  INTEGER NOT NULL DEFAULT 0,
    "computedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LeaderboardEntry_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "LeaderboardEntry_scope_scopeKey_userId_key" ON "LeaderboardEntry"("scope", "scopeKey", "userId");
CREATE INDEX "LeaderboardEntry_scope_scopeKey_rank_idx"          ON "LeaderboardEntry"("scope", "scopeKey", "rank");
CREATE INDEX "LeaderboardEntry_userId_idx"                       ON "LeaderboardEntry"("userId");

-- ────────────────────────────────────────────────────────────
-- SubjectScore
-- ────────────────────────────────────────────────────────────
CREATE TABLE "SubjectScore" (
    "id"           TEXT NOT NULL,
    "userId"       TEXT NOT NULL,
    "subjectLabel" TEXT NOT NULL,
    "score"        INTEGER NOT NULL DEFAULT 0,
    "maxScore"     INTEGER NOT NULL DEFAULT 100,
    "gradeLabel"   TEXT,
    "trend"        "TrendDirection" NOT NULL DEFAULT 'STABLE',
    "trendValue"   TEXT,
    "recordedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,
    "deletedAt"    TIMESTAMP(3),
    CONSTRAINT "SubjectScore_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SubjectScore_userId_subjectLabel_key" ON "SubjectScore"("userId", "subjectLabel");
CREATE INDEX "SubjectScore_userId_idx"                     ON "SubjectScore"("userId");
CREATE INDEX "SubjectScore_deletedAt_idx"                  ON "SubjectScore"("deletedAt");

-- ────────────────────────────────────────────────────────────
-- GrowthSnapshot
-- ────────────────────────────────────────────────────────────
CREATE TABLE "GrowthSnapshot" (
    "id"         TEXT NOT NULL,
    "userId"     TEXT NOT NULL,
    "monthKey"   TEXT NOT NULL,
    "monthLabel" TEXT NOT NULL,
    "score"      INTEGER NOT NULL DEFAULT 0,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"  TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GrowthSnapshot_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "GrowthSnapshot_userId_monthKey_key" ON "GrowthSnapshot"("userId", "monthKey");
CREATE INDEX "GrowthSnapshot_userId_idx"                 ON "GrowthSnapshot"("userId");

-- ────────────────────────────────────────────────────────────
-- Notification
-- ────────────────────────────────────────────────────────────
CREATE TABLE "Notification" (
    "id"        TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "type"      "NotificationType" NOT NULL,
    "title"     TEXT NOT NULL,
    "body"      TEXT NOT NULL,
    "readAt"    TIMESTAMP(3),
    "link"      TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Notification_userId_readAt_idx"     ON "Notification"("userId", "readAt");
CREATE INDEX "Notification_userId_createdAt_idx"  ON "Notification"("userId", "createdAt");
CREATE INDEX "Notification_deletedAt_idx"         ON "Notification"("deletedAt");

-- ────────────────────────────────────────────────────────────
-- Announcement
-- ────────────────────────────────────────────────────────────
CREATE TABLE "Announcement" (
    "id"               TEXT NOT NULL,
    "audience"         "AnnouncementAudience" NOT NULL DEFAULT 'ALL',
    "tag"              TEXT,
    "title"            TEXT NOT NULL,
    "description"      TEXT,
    "primaryCtaText"   TEXT,
    "primaryCtaUrl"    TEXT,
    "secondaryCtaText" TEXT,
    "secondaryCtaUrl"  TEXT,
    "sponsorName"      TEXT,
    "imageUrl"         TEXT,
    "themeColor"       TEXT,
    "publishedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt"        TIMESTAMP(3),
    "isActive"         BOOLEAN NOT NULL DEFAULT true,
    "authorId"         TEXT,
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3) NOT NULL,
    "deletedAt"        TIMESTAMP(3),
    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Announcement_audience_isActive_publishedAt_idx" ON "Announcement"("audience", "isActive", "publishedAt");
CREATE INDEX "Announcement_deletedAt_idx"                     ON "Announcement"("deletedAt");

-- ────────────────────────────────────────────────────────────
-- Feedback
-- ────────────────────────────────────────────────────────────
CREATE TABLE "Feedback" (
    "id"           TEXT NOT NULL,
    "studentId"    TEXT NOT NULL,
    "instructorId" TEXT,
    "sectionLabel" TEXT,
    "body"         TEXT NOT NULL,
    "gradeLabel"   TEXT,
    "contextType"  TEXT,
    "contextId"    TEXT,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,
    "deletedAt"    TIMESTAMP(3),
    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Feedback_studentId_idx"               ON "Feedback"("studentId");
CREATE INDEX "Feedback_instructorId_idx"            ON "Feedback"("instructorId");
CREATE INDEX "Feedback_contextType_contextId_idx"   ON "Feedback"("contextType", "contextId");
CREATE INDEX "Feedback_deletedAt_idx"               ON "Feedback"("deletedAt");

-- ────────────────────────────────────────────────────────────
-- Alert
-- ────────────────────────────────────────────────────────────
CREATE TABLE "Alert" (
    "id"               TEXT NOT NULL,
    "title"            TEXT NOT NULL,
    "message"          TEXT NOT NULL,
    "priority"         "AlertPriority" NOT NULL DEFAULT 'MEDIUM',
    "studentsAffected" INTEGER,
    "timeInfo"         TEXT,
    "resolvedAt"       TIMESTAMP(3),
    "resolvedById"     TEXT,
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3) NOT NULL,
    "deletedAt"        TIMESTAMP(3),
    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Alert_priority_resolvedAt_idx" ON "Alert"("priority", "resolvedAt");
CREATE INDEX "Alert_deletedAt_idx"           ON "Alert"("deletedAt");

-- ────────────────────────────────────────────────────────────
-- CalendarEvent
-- ────────────────────────────────────────────────────────────
CREATE TABLE "CalendarEvent" (
    "id"        TEXT NOT NULL,
    "title"     TEXT NOT NULL,
    "type"      "CalendarEventType" NOT NULL DEFAULT 'EVENT',
    "startsAt"  TIMESTAMP(3) NOT NULL,
    "endsAt"    TIMESTAMP(3),
    "location"  TEXT,
    "ownerId"   TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "CalendarEvent_startsAt_idx"  ON "CalendarEvent"("startsAt");
CREATE INDEX "CalendarEvent_ownerId_idx"   ON "CalendarEvent"("ownerId");
CREATE INDEX "CalendarEvent_deletedAt_idx" ON "CalendarEvent"("deletedAt");

-- ────────────────────────────────────────────────────────────
-- Lab
-- ────────────────────────────────────────────────────────────
CREATE TABLE "Lab" (
    "id"          TEXT NOT NULL,
    "name"        TEXT NOT NULL,
    "status"      "LabRuntimeStatus" NOT NULL DEFAULT 'AVAILABLE',
    "uptimeNote"  TEXT,
    "activeUsers" INTEGER NOT NULL DEFAULT 0,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,
    "deletedAt"   TIMESTAMP(3),
    CONSTRAINT "Lab_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Lab_status_idx"    ON "Lab"("status");
CREATE INDEX "Lab_deletedAt_idx" ON "Lab"("deletedAt");

-- ────────────────────────────────────────────────────────────
-- Report
-- ────────────────────────────────────────────────────────────
CREATE TABLE "Report" (
    "id"          TEXT NOT NULL,
    "ownerId"     TEXT NOT NULL,
    "title"       TEXT NOT NULL,
    "kind"        "ReportKind" NOT NULL DEFAULT 'CUSTOM',
    "iconName"    TEXT,
    "payload"     JSONB,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,
    "deletedAt"   TIMESTAMP(3),
    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Report_ownerId_idx"   ON "Report"("ownerId");
CREATE INDEX "Report_deletedAt_idx" ON "Report"("deletedAt");

-- ────────────────────────────────────────────────────────────
-- Foreign Keys
-- ────────────────────────────────────────────────────────────
ALTER TABLE "Course" ADD CONSTRAINT "Course_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Course" ADD CONSTRAINT "Course_instructorId_fkey"
  FOREIGN KEY ("instructorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Unit" ADD CONSTRAINT "Unit_courseId_fkey"
  FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_unitId_fkey"
  FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_chapterId_fkey"
  FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Resource" ADD CONSTRAINT "Resource_unitId_fkey"
  FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_courseId_fkey"
  FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LessonCompletion" ADD CONSTRAINT "LessonCompletion_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LessonCompletion" ADD CONSTRAINT "LessonCompletion_lessonId_fkey"
  FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Test" ADD CONSTRAINT "Test_courseId_fkey"
  FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Question" ADD CONSTRAINT "Question_testId_fkey"
  FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "QuestionOption" ADD CONSTRAINT "QuestionOption_questionId_fkey"
  FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TestGuideline" ADD CONSTRAINT "TestGuideline_testId_fkey"
  FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TestAttempt" ADD CONSTRAINT "TestAttempt_testId_fkey"
  FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TestAttempt" ADD CONSTRAINT "TestAttempt_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AttemptAnswer" ADD CONSTRAINT "AttemptAnswer_attemptId_fkey"
  FOREIGN KEY ("attemptId") REFERENCES "TestAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AttemptAnswer" ADD CONSTRAINT "AttemptAnswer_questionId_fkey"
  FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Project" ADD CONSTRAINT "Project_unitId_fkey"
  FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Project" ADD CONSTRAINT "Project_courseId_fkey"
  FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ProjectSubmission" ADD CONSTRAINT "ProjectSubmission_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectSubmission" ADD CONSTRAINT "ProjectSubmission_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_classId_fkey"
  FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_courseId_fkey"
  FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AssignmentSubmission" ADD CONSTRAINT "AssignmentSubmission_assignmentId_fkey"
  FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssignmentSubmission" ADD CONSTRAINT "AssignmentSubmission_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ClassMembership" ADD CONSTRAINT "ClassMembership_classId_fkey"
  FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClassMembership" ADD CONSTRAINT "ClassMembership_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LeaderboardEntry" ADD CONSTRAINT "LeaderboardEntry_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SubjectScore" ADD CONSTRAINT "SubjectScore_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GrowthSnapshot" ADD CONSTRAINT "GrowthSnapshot_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_studentId_fkey"
  FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_instructorId_fkey"
  FOREIGN KEY ("instructorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Alert" ADD CONSTRAINT "Alert_resolvedById_fkey"
  FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Report" ADD CONSTRAINT "Report_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
