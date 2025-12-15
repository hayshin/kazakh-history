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
	let currentId: number | null = null;
	let currentQuestion = '';

	for (const line of lines) {
		// Format: "1.Question text" or "1. Question text"
		const match = line.match(/^[\s*]*(\d+)\.\s*(.+)$/);
		if (match) {
			// Save previous question if exists
			if (currentId !== null && currentQuestion) {
				map.set(currentId, currentQuestion.trim());
			}
			
			currentId = parseInt(match[1], 10);
			currentQuestion = match[2].trim();
		} else if (currentId !== null) {
			// Continue multiline question
			currentQuestion += ' ' + line.trim();
		}
	}

	// Save last question
	if (currentId !== null && currentQuestion) {
		map.set(currentId, currentQuestion.trim());
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
	let currentId: number | null = null;
	let currentText = '';

	for (const line of lines) {
		// Format: "1. Question? Explanation text" or "**1. Question?..."
		const match = line.match(/^[\s*]*(\d+)\.\s*(.+)$/);
		if (match) {
			// Save previous explanation if exists
			if (currentId !== null && currentText) {
				const questionMarkIndex = currentText.indexOf('?');
				let explanation = currentText;
				if (questionMarkIndex !== -1) {
					explanation = currentText.substring(questionMarkIndex + 1).trim();
				}
				map.set(currentId, explanation);
			}
			
			currentId = parseInt(match[1], 10);
			currentText = match[2].trim();
		} else if (currentId !== null) {
			// Continue multiline explanation
			currentText += ' ' + line.trim();
		}
	}

	// Save last explanation
	if (currentId !== null && currentText) {
		const questionMarkIndex = currentText.indexOf('?');
		let explanation = currentText;
		if (questionMarkIndex !== -1) {
			explanation = currentText.substring(questionMarkIndex + 1).trim();
		}
		map.set(currentId, explanation);
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

