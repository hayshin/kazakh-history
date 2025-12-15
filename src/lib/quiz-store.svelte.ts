import { loadQuestions, type QuestionData } from './data-loader';

interface QuizStats {
	totalAnswered: number;
	correct: number;
	incorrect: number;
}

interface QuizState {
	questionSequence: number[];
	currentIndex: number;
	stats: QuizStats;
}

const STORAGE_KEY = 'history-quiz-state';

// Load all questions
const allQuestions = loadQuestions();

// Helper functions
function shuffleArray(array: number[]) {
	const newArray = [...array];
	for (let i = newArray.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[newArray[i], newArray[j]] = [newArray[j], newArray[i]];
	}
	return newArray;
}

function initializeNewSequence(): number[] {
	// Create array [1, 2, 3, ..., 365] and shuffle it
	const sequence = Array.from({ length: allQuestions.length }, (_, i) => i + 1);
	return shuffleArray(sequence);
}

function loadFromStorage(): QuizState {
	if (typeof window === 'undefined') {
		return {
			questionSequence: initializeNewSequence(),
			currentIndex: 0,
			stats: { totalAnswered: 0, correct: 0, incorrect: 0 }
		};
	}

	const stored = localStorage.getItem(STORAGE_KEY);
	if (stored) {
		try {
			return JSON.parse(stored);
		} catch {
			return {
				questionSequence: initializeNewSequence(),
				currentIndex: 0,
				stats: { totalAnswered: 0, correct: 0, incorrect: 0 }
			};
		}
	}

	return {
		questionSequence: initializeNewSequence(),
		currentIndex: 0,
		stats: { totalAnswered: 0, correct: 0, incorrect: 0 }
	};
}

function saveToStorage(state: QuizState) {
	if (typeof window !== 'undefined') {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
	}
}

// Initialize state
const initialState = loadFromStorage();
let questionSequence = $state(initialState.questionSequence);
let currentIndex = $state(initialState.currentIndex);
let stats = $state(initialState.stats);
let hasAnswered = $state(false);
let selectedAnswer = $state<'A' | 'B' | 'C' | 'D' | null>(null);

// Derived values
const currentQuestion = $derived.by(() => {
	if (questionSequence.length === 0) return null;
	const questionId = questionSequence[currentIndex];
	return allQuestions.find((q) => q.id === questionId) || null;
});

const currentQuestionNumber = $derived(currentIndex + 1);
const totalQuestions = $derived(allQuestions.length);
const accuracy = $derived(
	stats.totalAnswered === 0 ? 0 : Math.round((stats.correct / stats.totalAnswered) * 100)
);

// Create the store object
export const quizStore = {
	get currentQuestion() {
		return currentQuestion;
	},
	get currentQuestionNumber() {
		return currentQuestionNumber;
	},
	get totalQuestions() {
		return totalQuestions;
	},
	get statistics() {
		return stats;
	},
	get accuracy() {
		return accuracy;
	},
	get answered() {
		return hasAnswered;
	},
	get selected() {
		return selectedAnswer;
	},

	answerQuestion(answer: 'A' | 'B' | 'C' | 'D') {
		if (hasAnswered) return;

		hasAnswered = true;
		selectedAnswer = answer;

		const question = currentQuestion;
		if (!question) return;

		const isCorrect = answer === question.correct;
		stats.totalAnswered++;
		if (isCorrect) {
			stats.correct++;
		} else {
			stats.incorrect++;
		}

		// Save to storage
		saveToStorage({
			questionSequence,
			currentIndex,
			stats
		});
	},

	nextQuestion() {
		hasAnswered = false;
		selectedAnswer = null;
		currentIndex++;

		// If we've completed all questions, shuffle and restart
		if (currentIndex >= allQuestions.length) {
			questionSequence = initializeNewSequence();
			currentIndex = 0;
		}

		// Save to storage
		saveToStorage({
			questionSequence,
			currentIndex,
			stats
		});
	},

	resetStats() {
		stats = { totalAnswered: 0, correct: 0, incorrect: 0 };
		saveToStorage({
			questionSequence,
			currentIndex,
			stats
		});
	}
};

