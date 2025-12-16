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
	incorrectQuestionIds: Set<number>;
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
			stats: { totalAnswered: 0, correct: 0, incorrect: 0 },
			incorrectQuestionIds: new Set()
		};
	}

	const stored = localStorage.getItem(STORAGE_KEY);
	if (stored) {
		try {
			const parsed = JSON.parse(stored);
			// Convert array back to Set
			return {
				...parsed,
				incorrectQuestionIds: new Set(parsed.incorrectQuestionIds || [])
			};
		} catch {
			return {
				questionSequence: initializeNewSequence(),
				currentIndex: 0,
				stats: { totalAnswered: 0, correct: 0, incorrect: 0 },
				incorrectQuestionIds: new Set()
			};
		}
	}

	return {
		questionSequence: initializeNewSequence(),
		currentIndex: 0,
		stats: { totalAnswered: 0, correct: 0, incorrect: 0 },
		incorrectQuestionIds: new Set()
	};
}

function saveToStorage(state: QuizState) {
	if (typeof window !== 'undefined') {
		// Convert Set to array for JSON serialization
		const toSave = {
			...state,
			incorrectQuestionIds: Array.from(state.incorrectQuestionIds)
		};
		localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
	}
}

// Initialize state
const initialState = loadFromStorage();
let questionSequence = $state(initialState.questionSequence);
let currentIndex = $state(initialState.currentIndex);
let stats = $state(initialState.stats);
let incorrectQuestionIds = $state(initialState.incorrectQuestionIds);
let hasAnswered = $state(false);
let selectedAnswer = $state<'A' | 'B' | 'C' | 'D' | null>(null);

// Helper to shuffle answer options
function shuffleOptions(question: QuestionData): QuestionData & { shuffledKeys: ('A' | 'B' | 'C' | 'D')[] } {
	const keys: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
	const shuffledKeys = [...keys];
	
	// Fisher-Yates shuffle
	for (let i = shuffledKeys.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffledKeys[i], shuffledKeys[j]] = [shuffledKeys[j], shuffledKeys[i]];
	}
	
	return {
		...question,
		shuffledKeys
	};
}

// Derived values
const currentQuestion = $derived.by(() => {
	if (questionSequence.length === 0) return null;
	const questionId = questionSequence[currentIndex];
	const question = allQuestions.find((q) => q.id === questionId);
	if (!question) return null;
	
	// Shuffle options for this question
	return shuffleOptions(question);
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
			// Remove from incorrect list if it was there
			incorrectQuestionIds.delete(question.id);
		} else {
			stats.incorrect++;
			// Add to incorrect list
			incorrectQuestionIds.add(question.id);
		}

		// Save to storage
		saveToStorage({
			questionSequence,
			currentIndex,
			stats,
			incorrectQuestionIds
		});
	},

	nextQuestion() {
		hasAnswered = false;
		selectedAnswer = null;
		currentIndex++;

		// If we've completed all questions in current sequence
		if (currentIndex >= questionSequence.length) {
			// Check if there are incorrect questions to review
			if (incorrectQuestionIds.size > 0) {
				// Create sequence from incorrect questions only
				questionSequence = shuffleArray(Array.from(incorrectQuestionIds));
			} else {
				// All correct! Start fresh with all 365 questions
				questionSequence = initializeNewSequence();
			}
			currentIndex = 0;
		}

		// Save to storage
		saveToStorage({
			questionSequence,
			currentIndex,
			stats,
			incorrectQuestionIds
		});
	},

	resetStats() {
		stats = { totalAnswered: 0, correct: 0, incorrect: 0 };
		incorrectQuestionIds.clear();
		saveToStorage({
			questionSequence,
			currentIndex,
			stats,
			incorrectQuestionIds
		});
	},

	get incorrectCount() {
		return incorrectQuestionIds.size;
	},

	get isReviewMode() {
		// Check if current sequence length is less than total questions (reviewing incorrect ones)
		return questionSequence.length < allQuestions.length;
	}
};

