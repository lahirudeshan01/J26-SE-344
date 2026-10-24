const fs = require('node:fs');
const path = require('node:path');
const store = require('../src/modules/assessment-engine/services/store');
const { mapQuestionToSyllabus } = require('../src/modules/assessment-engine/data/chemistrySyllabus');

function normalizeDifficulty(score, level) {
  if (score === 1 || String(level).toLowerCase() === 'easy') {
    return { expert_difficulty: 2, difficulty_level: 'Easy' };
  }
  if (score === 3 || String(level).toLowerCase() === 'hard') {
    return { expert_difficulty: 4, difficulty_level: 'Hard' };
  }
  return { expert_difficulty: 3, difficulty_level: 'Medium' };
}

function normalizeOptions(options) {
  if (!Array.isArray(options)) return [];
  return options.map((opt) => {
    if (typeof opt === 'string') return opt.trim();
    if (typeof opt === 'object' && opt !== null) {
      return opt.text ? String(opt.text).trim() : String(opt.label || '').trim();
    }
    return String(opt).trim();
  });
}

async function main() {
  const jsonPath = path.resolve(__dirname, '../data/questions.json');
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Question bank JSON not found at ${jsonPath}`);
  }

  let raw = fs.readFileSync(jsonPath, 'utf8');
  // Strip UTF-8 BOM if present
  if (raw.charCodeAt(0) === 0xFEFF) {
    raw = raw.slice(1);
  }

  const parsed = JSON.parse(raw);
  const rawQuestions = Array.isArray(parsed) ? parsed : parsed.questions || [];

  if (rawQuestions.length === 0) {
    throw new Error('No questions found in questions.json');
  }

  console.log(`Read ${rawQuestions.length} raw questions from ${jsonPath}`);

  const validQuestions = [];
  let skipped = 0;
  let invalid = 0;

  for (const q of rawQuestions) {
    if (!q.question_id || !q.question_text || !q.correct_answer) {
      console.warn(`[Invalid] Skipping question missing required fields: ${q.question_id || 'UNKNOWN'}`);
      invalid++;
      continue;
    }

    const syllabusMapping = mapQuestionToSyllabus(q);
    const diff = normalizeDifficulty(q.difficulty_score, q.difficulty_level);
    const optionsArray = normalizeOptions(q.options);

    if (optionsArray.length === 0) {
      console.warn(`[Invalid] Skipping question with empty options: ${q.question_id}`);
      invalid++;
      continue;
    }

    validQuestions.push({
      question_id: q.question_id,
      subject: 'chemistry',
      topic_id: syllabusMapping.topic_id,
      topic_name: syllabusMapping.topic_name,
      main_topic_id: syllabusMapping.main_topic_id,
      main_topic_name: syllabusMapping.main_topic_name,
      subtopic_id: syllabusMapping.subtopic_id,
      subtopic_name: syllabusMapping.subtopic_name,
      question_text: q.question_text,
      options: optionsArray,
      correct_answer: String(q.correct_answer_text || q.correct_answer).trim(),
      correct_answer_text: q.correct_answer_text ? String(q.correct_answer_text).trim() : null,
      max_marks: Number(q.marks || 1),
      expert_difficulty: diff.expert_difficulty,
      difficulty_level: diff.difficulty_level,
      explanation: q.explanation || null,
      source_reference: `Sri Lankan G.C.E. A/L Chemistry ${q.exam_year || 2024} Paper 01, Q${q.original_question_number || ''}`,
      syllabus_version: '2024 Paper 01',
      is_synthetic: false,
      image_path: q.image_path || null
    });
  }

  console.log(`Validated ${validQuestions.length} questions (${invalid} invalid, ${skipped} skipped).`);

  const saved = await store.upsertQuestions(validQuestions);
  console.log(`Successfully imported/updated ${saved.length} questions into the active store.`);

  // Print summary by main topic
  const summary = {};
  for (const q of validQuestions) {
    summary[q.main_topic_name] = (summary[q.main_topic_name] || 0) + 1;
  }
  console.log('\nChemistry Question Distribution by Main Topic:');
  for (const [topic, count] of Object.entries(summary)) {
    console.log(`  - ${topic}: ${count} questions`);
  }

  // Verify Q005 image reference
  const q005 = validQuestions.find((q) => q.question_id === 'AL-CHE-2024-P01-Q005');
  if (q005) {
    console.log(`\nVerified Q005 Image Path: ${q005.image_path}`);
  }
}

main()
  .catch((err) => {
    console.error('Import failed:', err);
    process.exit(1);
  })
  .finally(() => {
    const pool = require('../src/config/db');
    if (pool && typeof pool.end === 'function') {
      pool.end().catch(() => {});
    }
  });
