# Token Analyzer Dashboard - Getting Started Guide

## What is This?

This dashboard shows you how much your AI Agent is being used. Think of it like a report card that tells you:
- How many conversations happened
- How much "thinking" the AI did (tokens)
- How much speech-to-text was used (when people talk to the AI Agent)
- How much text-to-speech was used (when the AI Agent talks back)

## How to Use It

### Step 1: Pick Your Dates

1. Look for the **"Date Range Selection"** box at the top
2. Click on **"From Date"** and pick when you want to start looking
3. Click on **"To Date"** and pick when you want to stop looking
4. Example: If you want to see what happened in January, pick January 1st as "From" and January 31st as "To"

### Step 2: Get Your Report

1. Click the big **"Fetch Token Data"** button
2. Wait a few seconds while it gathers all the information
3. Your report will appear below!

## What You're Looking At

Once you click the button, you'll see several sections:

### 📊 LLM Usage (The AI's "Thinking")

This shows how much the AI had to "think" to answer questions:
- **Total LLM Input Tokens**: How much information the AI read
- **Total LLM Output Tokens**: How much the AI wrote back
- **Total LLM Tokens**: The grand total of thinking
- **Average LLM Tokens/Session**: How much thinking per conversation (on average)
- **Avg LLM Tokens/Turn**: How much thinking per question/answer pair

**Think of it like**: If tokens were words, this tells you how many "words" the AI processed.

### 🎤 STT/TTS Usage (Talking and Listening)

This shows how much the AI Agent talked and listened:
- **Total STT**: How much speech-to-text was used (people talking to the AI Agent)
- **Total TTS**: How much text-to-speech was used (AI Agent talking back)
- **Deepgram STT (minutes)**: How many minutes of audio the AI Agent listened to
- **ElevenLabs TTS (characters)**: How many characters the AI Agent spoke

**Think of it like**: 
- STT = How long people talked to the AI Agent
- TTS = How much the AI Agent talked back

### 👥 Session & Turn Metrics

This shows how many conversations happened:
- **Total Sessions**: How many separate conversations happened
- **Total Conversation Turns**: How many back-and-forth exchanges (questions and answers)
- **Avg Turns/Session**: On average, how many questions per conversation

**Think of it like**: 
- Sessions = Number of people who talked to the AI Agent
- Turns = Number of questions asked

### 📈 Token Usage by Flow Chart

This is a colorful bar chart showing which parts of your AI Agent are used most:
- **Blue bars** = LLM tokens (thinking)
- **Cyan bars** = STT tokens (listening)
- **Purple bars** = TTS tokens (talking)
- Each bar represents a different "flow" (a part of your AI Agent)

**Think of it like**: A bar chart showing which parts of your AI Agent are busiest.

### 📋 Token Usage Table

This is a detailed table showing information for each part of your AI Agent:
- **Flow Name**: Which part of the AI Agent
- **LLM Input/Output/Total**: How much thinking that part did
- **STT Tokens**: How much listening that part did
- **TTS Tokens**: How much talking that part did
- **Sessions**: How many conversations used that part
- **Total Turns**: How many questions that part answered
- **Avg Turns/Session**: Average questions per conversation for that part
- **Avg LLM/STT/TTS per Session**: Average usage per conversation

**Think of it like**: A report card for each part of your AI Agent, showing how much work each part did.

## Tips

1. **Start Small**: Try looking at just one week first to see how it works
2. **Compare Periods**: Look at different weeks or months to see if usage is going up or down
3. **Check the Charts**: The colorful charts make it easy to see which parts of your AI Agent are busiest
4. **Read the Averages**: The averages help you understand typical usage patterns

## What Do These Numbers Mean?

- **Higher numbers** = More usage = More activity
- **Lower numbers** = Less usage = Less activity
- **Averages** = Typical amount per conversation

## Need Help?

If something doesn't work:
1. Make sure you picked both dates (From Date AND To Date)
2. Make sure the dates make sense (From Date should be before To Date)
3. Click "Fetch Token Data" again
4. Wait a few seconds - sometimes it takes a moment to gather all the information

## That's It!

You're all set! Just pick your dates, click the button, and explore your AI Agent's usage report. 🎉
