const GROQ_API = 'https://api.groq.com/openai/v1';

const MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'mixtral-8x7b-32768',
  'gemma2-9b-it'
];

export class GroqService {
  private static apiKey: string = process.env.GROQ_KEY || '';

  static setApiKey(key: string) {
    this.apiKey = key;
  }

  static getModels() {
    return MODELS;
  }

  static async chat(model: string, messages: any[]): Promise<any> {
    if (!this.apiKey) {
      throw new Error('GROQ_KEY not configured');
    }

    const response = await fetch(`${GROQ_API}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ model, messages })
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }

    return response.json();
  }
}
