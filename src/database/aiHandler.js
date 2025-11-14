// AI Handler with LangChain Integration
// Integrates open-source AI models with conversation memory and user profiling

const { LLMChain } = require('langchain/chains');
const { ChatOpenAI } = require('langchain/chat_models/openai');
const { HuggingFaceInference } = require('langchain/llms/hf');
const { BufferMemory, ConversationSummaryMemory } = require('langchain/memory');
const { PromptTemplate } = require('langchain/prompts');
const User = require('./userSchema');

class AIHandler {
  constructor() {
    this.conversationMemories = new Map();
    this.setupAIModel();
  }

  setupAIModel() {
    // Initialize LLM - Using HuggingFace for open-source alternative
    const model = process.env.AI_MODEL === 'openai'
      ? new ChatOpenAI({
          modelName: 'gpt-3.5-turbo',
          temperature: 0.7,
          maxTokens: 512
        })
      : new HuggingFaceInference({
          model: 'meta-llama/Llama-2-7b-chat-hf',
          apiKey: process.env.HUGGINGFACE_API_KEY,
          temperature: 0.7
        });

    const prompt = new PromptTemplate({
      inputVariables: ['chat_history', 'human_input'],
      template: `You are MinfoAi, a helpful Discord bot assistant.

Chat History:
{chat_history}

User: {human_input}
Assistant:`
    });

    this.chain = new LLMChain({
      llm: model,
      prompt: prompt,
      memory: new BufferMemory({memoryKey: 'chat_history'})
    });
  }

  async getMemory(userId) {
    if (!this.conversationMemories.has(userId)) {
      this.conversationMemories.set(userId, new BufferMemory({
        memoryKey: 'chat_history',
        returnMessages: true
      }));
    }
    return this.conversationMemories.get(userId);
  }

  async processMessage(userId, message, userProfile) {
    try {
      const memory = await this.getMemory(userId);
      
      // Get AI response
      const response = await this.chain.call({
        human_input: message,
        chat_history: memory.buffer
      });

      // Store interaction in database
      await this.storeInteraction(userId, message, response.text, userProfile);

      // Update user profile with AI traits
      await this.updateUserAIProfile(userId, message, response.text);

      return response.text;
    } catch (error) {
      console.error('[AIHandler] Error processing message:', error);
      return 'Scusa, ho incontrato un errore nel processare il tuo messaggio.';
    }
  }

  async storeInteraction(userId, message, response, userProfile) {
    try {
      await User.findOneAndUpdate(
        { userId },
        {
          $push: {
            'aiInteractions.conversationHistory': {
              message,
              response,
              sentiment: await this.analyzeSentiment(message),
              timestamp: new Date()
            }
          },
          $inc: { 'aiInteractions.totalMessages': 1 },
          $set: { 'aiInteractions.lastAiChat': new Date() }
        },
        { upsert: true, new: true }
      );
    } catch (error) {
      console.error('[AIHandler] Error storing interaction:', error);
    }
  }

  async updateUserAIProfile(userId, message, response) {
    try {
      const keywords = this.extractKeywords(message);
      await User.findOneAndUpdate(
        { userId },
        {
          $addToSet: {
            'aiInteractions.aiPersonalityTraits.frequentTopics': { $each: keywords }
          }
        }
      );
    } catch (error) {
      console.error('[AIHandler] Error updating AI profile:', error);
    }
  }

  async analyzeSentiment(text) {
    // Simple sentiment analysis - can be enhanced with ML models
    const positiveWords = ['bello', 'grande', 'fantastico', 'meraviglioso'];
    const negativeWords = ['male', 'pessimo', 'orribile', 'terribile'];
    
    const lower = text.toLowerCase();
    const positiveCount = positiveWords.filter(w => lower.includes(w)).length;
    const negativeCount = negativeWords.filter(w => lower.includes(w)).length;

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  extractKeywords(text) {
    // Extract important keywords from user message
    const words = text.split(' ').filter(w => w.length > 3);
    return words.slice(0, 5);
  }

  clearMemory(userId) {
    this.conversationMemories.delete(userId);
  }
}

module.exports = new AIHandler();
