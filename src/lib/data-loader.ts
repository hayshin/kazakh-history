import answersRaw from '../../data/answers.txt?raw';
import answerOptionsRaw from '../../data/answer_options.txt?raw';
import explanationsRaw from '../../data/explanations.txt?raw';

export interface QuestionData {
	id: number;
	question: string;
	options: {
		A: string;
		B: string;
		C: string;
		D: string;
	};
	correct: 'A' | 'B' | 'C' | 'D';
	explanation: string;
}

function parseAnswers(raw: string): Map<number, string> {
	const lines = raw.split('\n').filter((line) => line.trim());
	const map = new Map<number, string>();

	for (const line of lines) {
		// Format: "1.Question text" or "1. Question text"
		const match = line.match(/^(\d+)\.\s*(.+)$/);
		if (match) {
			const id = parseInt(match[1], 10);
			const question = match[2].trim();
			map.set(id, question);
		}
	}

	return map;
}

function parseAnswerOptions(
	raw: string
): Map<number, { options: QuestionData['options']; correct: QuestionData['correct'] }> {
	const lines = raw.split('\n').filter((line) => line.trim());
	const map = new Map();

	for (const line of lines) {
		// Format: "1. A) opt B) opt C) opt D) opt | A"
		const match = line.match(/^(\d+)\.\s*(.+)\s*\|\s*([A-D])$/);
		if (match) {
			const id = parseInt(match[1], 10);
			const optionsStr = match[2].trim();
			const correct = match[3] as 'A' | 'B' | 'C' | 'D';

			// Parse options A) B) C) D)
			const optionsMatch = optionsStr.match(/A\)\s*([^B]+)\s*B\)\s*([^C]+)\s*C\)\s*([^D]+)\s*D\)\s*(.+)$/);
			if (optionsMatch) {
				map.set(id, {
					options: {
						A: optionsMatch[1].trim(),
						B: optionsMatch[2].trim(),
						C: optionsMatch[3].trim(),
						D: optionsMatch[4].trim()
					},
					correct
				});
			}
		}
	}

	return map;
}

function parseExplanations(raw: string): Map<number, string> {
	const lines = raw.split('\n').filter((line) => line.trim());
	const map = new Map<number, string>();

	for (const line of lines) {
		// Format: "1. Question? Explanation text"
		const match = line.match(/^(\d+)\.\s*(.+)$/);
		if (match) {
			const id = parseInt(match[1], 10);
			const fullText = match[2].trim();

			// Find the first question mark and take everything after it
			const questionMarkIndex = fullText.indexOf('?');
			if (questionMarkIndex !== -1) {
				const explanation = fullText.substring(questionMarkIndex + 1).trim();
				map.set(id, explanation);
			} else {
				// If no question mark, just use the whole text as explanation
				map.set(id, fullText);
			}
		}
	}

	return map;
}

export function loadQuestions(): QuestionData[] {
	const answersMap = parseAnswers(answersRaw);
	const optionsMap = parseAnswerOptions(answerOptionsRaw);
	const explanationsMap = parseExplanations(explanationsRaw);

	const questions: QuestionData[] = [];

	// Combine all data
	for (let id = 1; id <= 365; id++) {
		const question = answersMap.get(id);
		const optionsData = optionsMap.get(id);
		const explanation = explanationsMap.get(id);

		if (question && optionsData && explanation) {
			questions.push({
				id,
				question,
				options: optionsData.options,
				correct: optionsData.correct,
				explanation
			});
		}
	}

	return questions;
}

