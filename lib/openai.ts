import OpenAI from 'openai';

// Get API key from environment variables
const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

let openai: OpenAI | null = null;

try {
  if (apiKey) {
    openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true,
      maxRetries: 3, // Increased from 2 to 3 retries
      timeout: 60000, // Increased from 30000 to 60000 (60 seconds)
      // Add exponential backoff configuration
      defaultQuery: { timeout: 60000 },
      defaultHeaders: { 'Keep-Alive': 'timeout=60' },
    });
  } else {
    console.warn('OpenAI API key not found');
  }
} catch (error) {
  console.error('Error initializing OpenAI client:', error);
}

export function isOpenAIConfigured() {
  return !!apiKey;
}

export type StoryDuration = 'Short' | 'Standard' | 'Long';

interface WordCountRange {
  target: number;
  min: number;
  max: number;
}

function getWordCountRange(duration: StoryDuration): WordCountRange {
  switch (duration) {
    case 'Short':
      return {
        target: 300,
        min: 250,
        max: 350
      };
    case 'Long':
      return {
        target: 900,
        min: 800,
        max: 1000
      };
    case 'Standard':
    default:
      return {
        target: 600,
        min: 500,
        max: 700
      };
  }
}

// Helper function for exponential backoff retry
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      if (error?.status === 429 || error.name === 'AbortError' || error.message?.includes('timeout')) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      throw error; // Rethrow if it's not a retriable error
    }
  }
  
  throw lastError;
}

function generateImagePrompt(theme: string, age: number, title: string, content: string): string {
  // Extract key story elements from the content
  const firstParagraph = content.split('\n')[0];
  const mainCharacters = content.match(/[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g) || [];
  const uniqueCharacters = [...new Set(mainCharacters)];
  const keyWords = theme.toLowerCase().split(/[&,\s]+/).filter(Boolean);

  // Determine art style based on age
  let artStyle = '';
  if (age <= 5) {
    artStyle = 'simple, colorful, and cute illustration style similar to board books';
  } else if (age <= 8) {
    artStyle = 'whimsical and engaging illustration style like modern picture books';
  } else if (age <= 12) {
    artStyle = 'detailed and imaginative illustration style like middle-grade books';
  } else {
    artStyle = 'sophisticated yet accessible illustration style for young teens';
  }

  // Build the prompt
  let prompt = `Create a story illustration for "${title}" that captures the essence of ${theme}. `;
  
  // Add scene description from first paragraph
  if (firstParagraph) {
    prompt += `The scene should depict: ${firstParagraph}. `;
  }

  // Add character mentions if available
  if (uniqueCharacters.length > 0) {
    prompt += `Include the main characters: ${uniqueCharacters.slice(0, 3).join(', ')}. `;
  }

  // Add style guidance
  prompt += `Use a ${artStyle}. The image should be rich in detail and emotion, `;
  prompt += `with vibrant colors and clear focal points. Make it engaging and memorable for ${age}-year-old readers. `;
  
  // Add theme-specific elements
  keyWords.forEach(word => {
    if (['adventure', 'exploration'].includes(word)) {
      prompt += 'Show a sense of discovery and excitement. ';
    } else if (['fantasy', 'magic'].includes(word)) {
      prompt += 'Include magical elements and ethereal lighting. ';
    } else if (['animals', 'nature'].includes(word)) {
      prompt += 'Emphasize natural elements and wildlife. ';
    } else if (['friendship', 'family'].includes(word)) {
      prompt += 'Highlight warm interactions and emotional connections. ';
    }
  });

  // Final quality guidelines
  prompt += 'Ensure the illustration is high-quality, well-composed, and suitable for a professional children\'s book. ';
  prompt += 'The style should be clean and polished, avoiding any dark or scary elements.';

  return prompt;
}

export async function generateStory(
  age: number,
  theme: string,
  duration: StoryDuration = 'Standard',
  personalized: boolean = false,
  childName: string = '',
  parentName: string = '',
  storyLanguage: string = 'English'
): Promise<{ title: string; content: string; icon_url: string }> {
  if (!openai) {
    throw new Error('OpenAI is not configured. Please check your API key.');
  }

  if (personalized && (!childName || !parentName || !storyLanguage)) {
    throw new Error(
      'Personalization is enabled, but required details (childName, parentName, storyLanguage) are missing.'
    );
  }

  try {
    const wordCount = getWordCountRange(duration);

    // Enhanced system prompt with word count target
    const systemPrompt = `You are a children's story writer. Your task is to write a story targeting approximately ${wordCount.target} words.

Format your response as:
TITLE: [title]
STORY: [story]

Focus on natural storytelling and engaging content while aiming for the target length.`;

    // Enhanced user prompt with word count guidance
    let userPrompt = `Write a children's story in ${storyLanguage} for age ${age} about ${theme}.

Aim for approximately ${wordCount.target} words, but prioritize natural storytelling and engaging content over exact word count.`;

    if (personalized) {
      userPrompt += `\n\nInclude these names in the story:
- Child's name: ${childName}
- Parent's name: ${parentName}`;
    }

    // Generate the story first
    const storyCompletion = await withRetry(() => 
      openai!.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        presence_penalty: 0,
        frequency_penalty: 0,
      })
    );

    if (!storyCompletion.choices[0]?.message?.content) {
      throw new Error('No story content received from OpenAI');
    }

    const content = storyCompletion.choices[0].message.content;
    const titleMatch = content.match(/^TITLE:\s*([^\n]+)/i);
    const storyMatch = content.match(/^STORY:\s*([\s\S]+)$/im);

    if (!titleMatch?.[1] || !storyMatch?.[1]) {
      throw new Error('Invalid story format received from OpenAI');
    }

    const title = titleMatch[1].trim();
    const story = storyMatch[1].trim();

    // Generate the image with the enhanced prompt based on the story content
    const imagePrompt = generateImagePrompt(theme, age, title, story);
    const iconResponse = await withRetry(() =>
      openai!.images.generate({
        model: 'dall-e-3',
        prompt: imagePrompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
        style: 'vivid',
      })
    );

    const actualWordCount = story.split(/\s+/).length;

    // Log word count information without throwing an error
    if (actualWordCount < wordCount.min || actualWordCount > wordCount.max) {
      console.warn(`Story length (${actualWordCount} words) differs from target range (${wordCount.min}-${wordCount.max} words)`);
    }

    if (!iconResponse.data[0]?.url) {
      throw new Error('Failed to generate story icon');
    }

    return {
      title,
      content: story,
      icon_url: iconResponse.data[0].url,
    };
  } catch (error: any) {
    if (error?.status === 429) {
      throw new Error('Story limit reached for today. Please try again tomorrow.');
    }

    if (error?.status === 401) {
      throw new Error('OpenAI API key is invalid or expired. Please check your configuration.');
    }

    if (error.name === 'NetworkError' || error.message?.includes('network')) {
      throw new Error('Network error occurred. Please check your internet connection and try again.');
    }

    if (error.name === 'AbortError' || error.message?.includes('timeout')) {
      throw new Error('Request timed out. Please try again.');
    }

    console.error('OpenAI API Error:', {
      name: error.name,
      message: error.message,
      status: error.status,
      stack: error.stack,
    });

    throw new Error(
      `Failed to generate story: ${error.message || 'Unknown error occurred'}. Please try again later.`
    );
  }
}

export async function textToSpeech(text: string): Promise<string> {
  if (!openai) {
    throw new Error('OpenAI is not configured. Please check your API key.');
  }

  const MAX_CHARS = 4000;
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > MAX_CHARS) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = sentence;
    } else {
      currentChunk += sentence;
    }
  }
  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  try {
    const audioResponses = await Promise.all(
      chunks.map(chunk =>
        withRetry(() =>
          openai!.audio.speech.create({
            model: "tts-1",
            voice: "alloy",
            input: chunk,
          })
        )
      )
    );

    const audioBlobs = await Promise.all(
      audioResponses.map(response => response.blob())
    );

    const combinedBlob = new Blob(audioBlobs, { type: audioBlobs[0].type });
    return URL.createObjectURL(combinedBlob);

  } catch (error: any) {
    if (error?.status === 429) {
      throw new Error('Speech generation limit reached. Please try again later.');
    }
    
    if (error?.status === 401) {
      throw new Error('OpenAI API key is invalid or expired. Please check your configuration.');
    }

    if (error.name === 'NetworkError' || error.message?.includes('network')) {
      throw new Error('Network error occurred. Please check your internet connection and try again.');
    }

    if (error.name === 'AbortError' || error.message?.includes('timeout')) {
      throw new Error('Request timed out. Please try again.');
    }

    console.error('OpenAI Text-to-Speech Error:', {
      name: error.name,
      message: error.message,
      status: error.status,
      stack: error.stack
    });

    throw new Error(
      `Failed to generate speech: ${error.message || 'Unknown error occurred'}. Please try again later.`
    );
  }
}