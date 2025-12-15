// Quick debug script to find missing questions
import { readFileSync } from 'fs';

const answersRaw = readFileSync('./data/answers.txt', 'utf-8');
const optionsRaw = readFileSync('./data/answer_options.txt', 'utf-8');
const explanationsRaw = readFileSync('./data/explanations.txt', 'utf-8');

function parseAnswers(raw) {
	const lines = raw.split('\n').filter((line) => line.trim());
	const map = new Map();
	let currentId = null;
	let currentQuestion = '';

	for (const line of lines) {
		const match = line.match(/^[\s*]*(\d+)\.\s*(.+)$/);
		if (match) {
			if (currentId !== null && currentQuestion) {
				map.set(currentId, currentQuestion.trim());
			}
			currentId = parseInt(match[1], 10);
			currentQuestion = match[2].trim();
		} else if (currentId !== null) {
			currentQuestion += ' ' + line.trim();
		}
	}

	if (currentId !== null && currentQuestion) {
		map.set(currentId, currentQuestion.trim());
	}

	return map;
}

function parseAnswerOptions(raw) {
	const lines = raw.split('\n').filter((line) => line.trim());
	const map = new Map();

	for (const line of lines) {
		const match = line.match(/^(\d+)\.\s*(.+)\s*\|\s*([A-D])$/);
		if (match) {
			const id = parseInt(match[1], 10);
			map.set(id, true);
		}
	}

	return map;
}

function parseExplanations(raw) {
	const lines = raw.split('\n').filter((line) => line.trim());
	const map = new Map();
	let currentId = null;
	let currentText = '';

	for (const line of lines) {
		const match = line.match(/^[\s*]*(\d+)\.\s*(.+)$/);
		if (match) {
			if (currentId !== null && currentText) {
				map.set(currentId, true);
			}
			currentId = parseInt(match[1], 10);
			currentText = match[2].trim();
		} else if (currentId !== null) {
			currentText += ' ' + line.trim();
		}
	}

	if (currentId !== null && currentText) {
		map.set(currentId, true);
	}

	return map;
}

const answersMap = parseAnswers(answersRaw);
const optionsMap = parseAnswerOptions(optionsRaw);
const explanationsMap = parseExplanations(explanationsRaw);

console.log('Parsed answers:', answersMap.size);
console.log('Parsed options:', optionsMap.size);
console.log('Parsed explanations:', explanationsMap.size);

// Find missing IDs
const missingInAnswers = [];
const missingInOptions = [];
const missingInExplanations = [];

for (let id = 1; id <= 365; id++) {
	if (!answersMap.has(id)) missingInAnswers.push(id);
	if (!optionsMap.has(id)) missingInOptions.push(id);
	if (!explanationsMap.has(id)) missingInExplanations.push(id);
}

console.log('\nMissing in answers.txt:', missingInAnswers);
console.log('Missing in answer_options.txt:', missingInOptions);
console.log('Missing in explanations.txt:', missingInExplanations);

// Find questions that exist in all three
let complete = 0;
for (let id = 1; id <= 365; id++) {
	if (answersMap.has(id) && optionsMap.has(id) && explanationsMap.has(id)) {
		complete++;
	}
}

console.log('\nComplete questions (in all 3 files):', complete);

