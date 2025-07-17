<script lang="ts">
	import { onMount } from 'svelte';
	import type { CreateCourseRequest } from '$lib/types';

	let messages: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }> = [];
	let currentMessage = '';
	let isLoading = false;
	let openaiApiKey = '';

	// System prompt for course creation
	const systemPrompt = `You are an expert course creator for Personal Tutor AI. Your job is to help users create comprehensive, well-structured courses.

When a user wants to create a course, follow these steps:

1. **Understand the Topic**: Ask clarifying questions about what they want to teach
2. **Define Learning Objectives**: Help them identify what students should learn
3. **Structure the Course**: Create a logical progression of lessons
4. **Generate Content**: Provide detailed lesson content with examples and exercises

Course Structure Guidelines:
- Start with an introduction lesson
- Break complex topics into digestible lessons
- Include practical exercises and examples
- End with a summary or project
- Aim for 5-15 lessons depending on complexity
- Each lesson should be 10-30 minutes of content

Difficulty Levels:
- Beginner: No prior knowledge required, basic concepts
- Intermediate: Some background knowledge, deeper concepts
- Advanced: Significant prior knowledge, complex topics

Always ask for the user's topic first, then guide them through the creation process step by step.`;

	onMount(() => {
		// Add initial system message
		messages = [
			{
				role: 'assistant',
				content: `Hello! I'm your AI course creation assistant. I'll help you create a comprehensive course that your students will love.

What topic would you like to create a course about?`,
				timestamp: new Date()
			}
		];
	});

	async function sendMessage() {
		if (!currentMessage.trim() || isLoading) return;

		const userMessage = currentMessage.trim();
		currentMessage = '';
		
		// Add user message
		messages = [...messages, {
			role: 'user',
			content: userMessage,
			timestamp: new Date()
		}];

		isLoading = true;

		try {
			const response = await fetch('/api/start/chat', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					messages: [
						{ role: 'system', content: systemPrompt },
						...messages.map(msg => ({ role: msg.role, content: msg.content }))
					]
				})
			});

			if (!response.ok) {
				throw new Error('Failed to get response');
			}

			const data = await response.json();
			
			// Add assistant response
			messages = [...messages, {
				role: 'assistant',
				content: data.content,
				timestamp: new Date()
			}];

			// If the response includes course data, offer to create it
			if (data.courseData) {
				messages = [...messages, {
					role: 'assistant',
					content: `Great! I've prepared a course structure for you. Would you like me to create this course in your account? Just say "yes" or "create course" to proceed.`,
					timestamp: new Date()
				}];
			}

		} catch (error) {
			console.error('Error:', error);
			messages = [...messages, {
				role: 'assistant',
				content: 'Sorry, I encountered an error. Please try again or check your OpenAI API key configuration.',
				timestamp: new Date()
			}];
		} finally {
			isLoading = false;
		}
	}

	async function createCourse() {
		if (isLoading) return;

		isLoading = true;

		try {
			const response = await fetch('/api/start/create-course', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					messages: messages.map(msg => ({ role: msg.role, content: msg.content }))
				})
			});

			if (!response.ok) {
				throw new Error('Failed to create course');
			}

			const data = await response.json();
			
			messages = [...messages, {
				role: 'assistant',
				content: `Perfect! Your course "${data.course.title}" has been created successfully. You can now view and edit it in your dashboard.`,
				timestamp: new Date()
			}];

		} catch (error) {
			console.error('Error:', error);
			messages = [...messages, {
				role: 'assistant',
				content: 'Sorry, I encountered an error while creating your course. Please try again.',
				timestamp: new Date()
			}];
		} finally {
			isLoading = false;
		}
	}

	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			sendMessage();
		}
	}

	function formatTime(date: Date): string {
		return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}
</script>

<svelte:head>
	<title>Create Course - Personal Tutor AI</title>
</svelte:head>

<div class="container">
	<div class="header">
		<h1>Create Your Course</h1>
		<p>Chat with AI to design and create your perfect course</p>
	</div>

	<div class="chat-container">
		<div class="messages" id="messages">
			{#each messages as message, index}
				<div class="message {message.role}">
					<div class="message-content">
						<div class="message-text">
							{#if message.role === 'assistant'}
								<div class="ai-avatar">AI</div>
							{:else}
								<div class="user-avatar">You</div>
							{/if}
							<div class="text">{message.content}</div>
						</div>
						<div class="timestamp">{formatTime(message.timestamp)}</div>
					</div>
				</div>
			{/each}
			
			{#if isLoading}
				<div class="message assistant">
					<div class="message-content">
						<div class="message-text">
							<div class="ai-avatar">AI</div>
							<div class="text">
								<div class="typing-indicator">
									<span></span>
									<span></span>
									<span></span>
								</div>
							</div>
						</div>
					</div>
				</div>
			{/if}
		</div>

		<div class="input-container">
			<div class="input-wrapper">
				<textarea
					bind:value={currentMessage}
					on:keypress={handleKeyPress}
					placeholder="Describe what you want to teach..."
					disabled={isLoading}
					rows="1"
				></textarea>
				<button 
					on:click={sendMessage} 
					disabled={!currentMessage.trim() || isLoading}
					class="send-button"
					aria-label="Send message"
				>
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
					</svg>
				</button>
			</div>
		</div>
	</div>

	<div class="setup-note">
		<p><strong>Setup Required:</strong> Make sure to add your OpenAI API key to the <code>.env</code> file in the root directory:</p>
		<code>OPENAI_API_KEY=your_actual_api_key_here</code>
	</div>
</div>

<style>
	.container {
		max-width: 800px;
		margin: 0 auto;
		padding: 20px;
		height: 100vh;
		display: flex;
		flex-direction: column;
	}

	.header {
		text-align: center;
		margin-bottom: 20px;
	}

	.header h1 {
		color: #333;
		margin-bottom: 8px;
	}

	.header p {
		color: #666;
		margin: 0;
	}

	.chat-container {
		flex: 1;
		display: flex;
		flex-direction: column;
		border: 1px solid #e0e0e0;
		border-radius: 12px;
		overflow: hidden;
		background: white;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
	}

	.messages {
		flex: 1;
		overflow-y: auto;
		padding: 20px;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.message {
		display: flex;
		margin-bottom: 16px;
	}

	.message.user {
		justify-content: flex-end;
	}

	.message.assistant {
		justify-content: flex-start;
	}

	.message-content {
		max-width: 80%;
		background: #f8f9fa;
		padding: 12px 16px;
		border-radius: 18px;
		position: relative;
	}

	.message.user .message-content {
		background: #007bff;
		color: white;
	}

	.message.assistant .message-content {
		background: #f1f3f4;
		color: #333;
	}

	.message-text {
		display: flex;
		align-items: flex-start;
		gap: 8px;
	}

	.ai-avatar, .user-avatar {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 12px;
		font-weight: bold;
		flex-shrink: 0;
	}

	.ai-avatar {
		background: #007bff;
		color: white;
	}

	.user-avatar {
		background: #28a745;
		color: white;
	}

	.text {
		flex: 1;
		line-height: 1.5;
		white-space: pre-wrap;
	}

	.timestamp {
		font-size: 11px;
		color: #999;
		margin-top: 4px;
		text-align: right;
	}

	.typing-indicator {
		display: flex;
		gap: 4px;
		align-items: center;
	}

	.typing-indicator span {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #999;
		animation: typing 1.4s infinite ease-in-out;
	}

	.typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
	.typing-indicator span:nth-child(2) { animation-delay: -0.16s; }

	@keyframes typing {
		0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
		40% { transform: scale(1); opacity: 1; }
	}

	.input-container {
		padding: 20px;
		border-top: 1px solid #e0e0e0;
		background: white;
	}

	.input-wrapper {
		display: flex;
		gap: 12px;
		align-items: flex-end;
	}

	textarea {
		flex: 1;
		border: 1px solid #ddd;
		border-radius: 24px;
		padding: 12px 16px;
		resize: none;
		font-family: inherit;
		font-size: 14px;
		line-height: 1.4;
		max-height: 120px;
		min-height: 44px;
	}

	textarea:focus {
		outline: none;
		border-color: #007bff;
		box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
	}

	.send-button {
		width: 44px;
		height: 44px;
		border: none;
		border-radius: 50%;
		background: #007bff;
		color: white;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background-color 0.2s;
	}

	.send-button:hover:not(:disabled) {
		background: #0056b3;
	}

	.send-button:disabled {
		background: #ccc;
		cursor: not-allowed;
	}

	.setup-note {
		margin-top: 20px;
		padding: 16px;
		background: #fff3cd;
		border: 1px solid #ffeaa7;
		border-radius: 8px;
		font-size: 14px;
	}

	.setup-note code {
		background: #f8f9fa;
		padding: 2px 6px;
		border-radius: 4px;
		font-family: monospace;
	}

	@media (max-width: 768px) {
		.container {
			padding: 10px;
		}
		
		.message-content {
			max-width: 90%;
		}
	}
</style> 