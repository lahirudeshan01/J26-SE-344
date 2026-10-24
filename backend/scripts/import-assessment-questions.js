const fs = require('node:fs/promises');
const path = require('node:path');
const store = require('../src/modules/assessment-engine/services/store');

function parseCsvLine(line) {
  const cells = [];
  let value = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && inQuotes && next === '"') {
      value += '"';
      i++;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === ',' && !inQuotes) {
      cells.push(value);
      value = '';
      continue;
    }
    value += char;
  }

  cells.push(value);
  return cells.map((cell) => cell.trim());
}

async function main() {
  const input = process.argv[2];
  if (!input) {
    console.error('Usage: node scripts/import-assessment-questions.js <csv-file>');
    process.exit(1);
  }

  const csvPath = path.resolve(process.cwd(), input);
  const raw = await fs.readFile(csvPath, 'utf8');
  const lines = raw.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) {
    throw new Error('CSV file does not contain any records');
  }

  const headers = parseCsvLine(lines[0]);
  const questions = lines.slice(1).map((line) => {
    const cells = parseCsvLine(line);
    const row = Object.fromEntries(headers.map((header, index) => [header, cells[index] || '']));
    return {
      question_id: row.question_id,
      subject: row.subject,
      topic_id: row.topic_id,
      topic_name: row.topic_name,
      question_text: row.question_text,
      options: row.options ? JSON.parse(row.options) : [],
      correct_answer: row.correct_answer,
      max_marks: Number(row.max_marks || 1),
      expert_difficulty: Number(row.expert_difficulty || 3),
      source_reference: row.source_reference || 'Imported verified question',
      syllabus_version: row.syllabus_version || 'Unknown',
      is_synthetic: false
    };
  });

  await store.upsertQuestions(questions);
  console.log(`Imported ${questions.length} assessment question(s).`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});