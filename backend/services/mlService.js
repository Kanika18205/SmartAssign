const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const TIMEOUT = 6000;

const fetchML = async (endpoint, body) => {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT);
  try {
    const res = await fetch(`${ML_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`ML returned ${res.status}`);
    return await res.json();
  } catch (e) {
    clearTimeout(timer);
    console.warn(`⚠️  ML service unavailable (${endpoint}), using fallback`);
    return null;
  }
};

// ── Fallback helpers ─────────────────────────────────────────
exports.fallbackFeedback = ({ percentage, topicAccuracy = {} }) => {
  const level = percentage >= 75 ? 'Advanced' : percentage >= 40 ? 'Intermediate' : 'Beginner';
  const weakTopics   = Object.entries(topicAccuracy).filter(([,v]) => v < 50).map(([k]) => k);
  const strongTopics = Object.entries(topicAccuracy).filter(([,v]) => v >= 70).map(([k]) => k);

  const tipMap = {
    'Data Structures': 'Practice linked lists, trees and graphs with visual tracing.',
    'DBMS':            'Focus on normalization forms and SQL joins with real datasets.',
    'OOP / Java':      'Write small programs using inheritance and interfaces daily.',
    'Computer Networks':'Draw OSI model layers and trace packets through each layer.',
    'Operating Systems':'Simulate CPU scheduling algorithms on paper first.',
    'Machine Learning': 'Implement algorithms from scratch in Python before using libraries.',
    'Arrays':          'Practice two-pointer and sliding window problems.',
    'Recursion':       'Always define base case first, then recursive step.',
    'Sorting':         'Understand time/space tradeoffs between algorithms.',
    'Trees':           'Visualize tree traversals by drawing them step by step.',
    'Graphs':          'Practice BFS and DFS on adjacency list and matrix.',
  };

  const tips = weakTopics.slice(0, 3).map(t => tipMap[t] || `Review ${t} fundamentals and solve 5 practice problems.`);
  if (tips.length === 0) tips.push('Great performance! Try harder questions to further challenge yourself.');

  return {
    level,
    summary: `You scored ${percentage.toFixed(1)}% — ${level === 'Advanced' ? 'Excellent work!' : level === 'Intermediate' ? 'Good progress, keep going!' : 'Keep practicing, you can improve!'}`,
    weakTopics,
    strongTopics,
    tips,
    topicAccuracy,
  };
};

// ── ML Service calls with fallback ───────────────────────────
exports.classifyDifficulty = async (input) => {
  const result = await fetchML('/classify-difficulty', input);
  if (result) return result;
  const { correctRate = 0 } = input;
  return { label: correctRate > 0.7 ? 'easy' : correctRate > 0.4 ? 'medium' : 'hard', confidence: 0.6 };
};

exports.generateFeedback = async (input) => {
  const result = await fetchML('/generate-feedback', input);
  if (result) return result;
  return exports.fallbackFeedback(input);
};

exports.detectGaps = async (input) => {
  const result = await fetchML('/detect-gaps', input);
  if (result) return result;
  const { percentage = 0 } = input;
  return {
    cluster: percentage < 40 ? 'Struggling' : percentage < 75 ? 'Average' : 'Strong',
    weakTopics: [],
    recommendations: ['Review class notes', 'Practice past papers'],
  };
};

exports.getAdaptiveQuestions = async (input) => {
  const result = await fetchML('/adaptive-questions', input);
  return result || { questionIds: input.questionIds || [] };
};

exports.getClassInsights = async (testId, attempts) => {
  const result = await fetchML('/class-insights', { testId, attempts });
  return result || null;
};