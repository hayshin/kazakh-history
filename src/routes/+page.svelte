<script lang="ts">
	import { quizStore } from '$lib/quiz-store.svelte';

	const question = $derived(quizStore.currentQuestion);
	const answered = $derived(quizStore.answered);
	const selected = $derived(quizStore.selected);
	const stats = $derived(quizStore.statistics);
	const accuracy = $derived(quizStore.accuracy);
	const isReviewMode = $derived(quizStore.isReviewMode);
	const incorrectCount = $derived(quizStore.incorrectCount);

	function handleAnswer(option: 'A' | 'B' | 'C' | 'D') {
		quizStore.answerQuestion(option);
	}

	function handleNext() {
		quizStore.nextQuestion();
	}

	function getButtonClass(option: 'A' | 'B' | 'C' | 'D'): string {
		const baseClass =
			'w-full p-4 text-left rounded-lg border-2 transition-all duration-200 text-base';

		if (!answered) {
			return `${baseClass} border-zinc-700 bg-zinc-800 hover:bg-zinc-700 hover:border-zinc-600 text-zinc-100`;
		}

		const isCorrect = option === question?.correct;
		const isSelected = option === selected;

		if (isCorrect) {
			return `${baseClass} border-green-500 bg-green-900/50 text-green-100`;
		}

		if (isSelected && !isCorrect) {
			return `${baseClass} border-red-500 bg-red-900/50 text-red-100`;
		}

		return `${baseClass} border-zinc-700 bg-zinc-800 text-zinc-400`;
	}
</script>

<div class="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-8">
	<div class="max-w-3xl mx-auto">
		<!-- Header with Stats -->
		<div class="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
			<h1 class="text-2xl font-bold text-zinc-100">История Казахстана</h1>
			<div class="flex gap-6 text-sm">
				<div class="text-zinc-400">
					Всего: <span class="text-zinc-100 font-semibold">{stats.totalAnswered}</span>
				</div>
				<div class="text-zinc-400">
					Правильно: <span class="text-green-400 font-semibold">{stats.correct}</span>
				</div>
				<div class="text-zinc-400">
					Неправильно: <span class="text-red-400 font-semibold">{stats.incorrect}</span>
				</div>
				{#if stats.totalAnswered > 0}
					<div class="text-zinc-400">
						Точность: <span class="text-blue-400 font-semibold">{accuracy}%</span>
					</div>
				{/if}
			</div>
		</div>

		{#if question}
			<!-- Progress Indicator -->
			<div class="mb-6 flex items-center justify-between">
				<div class="text-zinc-400 text-sm">
					Вопрос {quizStore.currentQuestionNumber}/{quizStore.totalQuestions}
				</div>
				{#if isReviewMode}
					<div class="text-amber-400 text-sm font-medium bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
						📝 Повторение ({incorrectCount} неправильных)
					</div>
				{/if}
			</div>

			<!-- Question Card -->
			<div class="bg-zinc-900 rounded-xl p-6 md:p-8 border border-zinc-800 shadow-xl">
				<!-- Question -->
				<div class="mb-6">
					<h2 class="text-xl md:text-2xl font-medium text-zinc-100 leading-relaxed">
						{question.question}
					</h2>
				</div>

				<!-- Answer Options -->
				<div class="space-y-3 mb-6">
					{#each question.shuffledKeys as option}
						<button
							class={getButtonClass(option)}
							onclick={() => handleAnswer(option)}
							disabled={answered}
						>
							<span class="font-semibold">{option})</span>
							{question.options[option]}
						</button>
					{/each}
				</div>

				<!-- Explanation (shown after answering) -->
				{#if answered}
					<div class="mt-6 pt-6 border-t border-zinc-800">
						<div class="mb-3">
							{#if selected === question.correct}
								<div class="text-green-400 font-semibold text-lg">✓ Правильно!</div>
							{:else}
								<div class="text-red-400 font-semibold text-lg">
									✗ Неправильно. Правильный ответ: {question.correct})
								</div>
							{/if}
						</div>
						<div class="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
							<h3 class="text-sm font-semibold text-zinc-400 mb-2 uppercase tracking-wide">
								Объяснение
							</h3>
							<p class="text-zinc-300 leading-relaxed">{question.explanation}</p>
						</div>
						<button
							class="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
							onclick={handleNext}
						>
							Следующий вопрос
						</button>
					</div>
				{/if}
			</div>
		{:else}
			<div class="text-center text-zinc-400 py-12">Loading questions...</div>
		{/if}
	</div>
</div>
