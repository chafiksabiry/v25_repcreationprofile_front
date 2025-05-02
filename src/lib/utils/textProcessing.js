import OpenAI from 'openai';

// Text processing utilities
export const extractBasicInfo = (text) => {
  if (!text || typeof text !== 'string') {
    return {
      name: '',
      email: '',
      languages: [],
      certifications: [],
      skills: []
    };
  }

  const patterns = {
    name: /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/,
    email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
    languages: /\b(Arabic|English|French|Spanish|German|Italian|Portuguese|Russian|Chinese|Japanese|Korean)\b/gi,
    certifications: /(Certified|Certification|Certificate)\s[^.,\n]+/g,
    skills: /(?:Technical Skills|Skills|Competencies|Expertise):\s*([^]*?)(?:\n\n|\n[A-Z]|$)/i
  };

  const matches = {
    name: (text.match(patterns.name) || [''])[0],
    email: (text.match(patterns.email) || [''])[0],
    languages: [...new Set((text.match(patterns.languages) || []).map(lang => lang.toLowerCase()))],
    certifications: (text.match(patterns.certifications) || []).filter(cert => cert.length < 100), // Filter out unreasonably long matches
    skills: []
  };

  // Extract skills section and split into individual skills
  const skillsMatch = text.match(patterns.skills);
  if (skillsMatch && skillsMatch[1]) {
    matches.skills = skillsMatch[1]
      .split(/[,;\n]/)
      .map(skill => skill.trim())
      .filter(skill => skill.length > 0 && skill.length < 50); // Filter out empty and unreasonably long skills
  }

  return matches;
};

export const chunkText = (text, maxLength = 12000) => {
  if (!text || typeof text !== 'string') {
    console.warn('Invalid text provided to chunkText');
    return [];
  }
  
  try {
    const chunks = [];
    let currentChunk = '';
    
    // Split by paragraphs first
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    
    for (const paragraph of paragraphs) {
      // If adding this paragraph would exceed maxLength
      if ((currentChunk + paragraph).length > maxLength) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
        }
        
        // If a single paragraph is too long, split it by sentences
        if (paragraph.length > maxLength) {
          const sentences = paragraph.split(/(?<=[.!?])\s+/)
            .filter(s => s.trim().length > 0);
          
          currentChunk = '';
          for (const sentence of sentences) {
            if ((currentChunk + sentence).length > maxLength) {
              if (currentChunk) {
                chunks.push(currentChunk.trim());
              }
              // If a single sentence is too long, split it by words
              if (sentence.length > maxLength) {
                const words = sentence.split(/\s+/);
                let wordChunk = '';
                for (const word of words) {
                  if ((wordChunk + word).length > maxLength) {
                    if (wordChunk) {
                      chunks.push(wordChunk.trim());
                    }
                    wordChunk = word;
                  } else {
                    wordChunk += (wordChunk ? ' ' : '') + word;
                  }
                }
                if (wordChunk) {
                  currentChunk = wordChunk;
                }
              } else {
                currentChunk = sentence;
              }
            } else {
              currentChunk += (currentChunk ? ' ' : '') + sentence;
            }
          }
        } else {
          currentChunk = paragraph;
        }
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }
    
    // Validate chunks
    return chunks.filter(chunk => {
      const isValid = chunk && typeof chunk === 'string' && chunk.trim().length > 0;
      if (!isValid) {
        console.warn('Invalid chunk detected and filtered out');
      }
      return isValid;
    });
  } catch (error) {
    console.error('Error in chunkText:', error);
    return [];
  }
};

export const safeJSONParse = (text) => {
  if (!text || typeof text !== 'string') {
    console.warn('Invalid input provided to safeJSONParse');
    return null;
  }

  try {
    // Try to find JSON-like content within the text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('No JSON-like content found in text');
      return null;
    }

    const jsonContent = jsonMatch[0];
    const parsed = JSON.parse(jsonContent);
    
    // Validate the parsed object has the expected structure
    const requiredFields = ['personalInfo', 'professionalSummary', 'skills'];
    const missingFields = requiredFields.filter(field => !parsed[field]);
    
    if (missingFields.length > 0) {
      console.warn(`Parsed JSON missing required fields: ${missingFields.join(', ')}`);
      return null;
    }
    
    // Ensure all arrays are properly initialized
    const ensureArray = (obj, path) => {
      const value = path.split('.').reduce((o, key) => o?.[key], parsed);
      if (!Array.isArray(value)) {
        const parent = path.split('.').slice(0, -1).reduce((o, key) => o[key], parsed);
        const key = path.split('.').pop();
        parent[key] = [];
      }
    };

    [
      'personalInfo.languages',
      'professionalSummary.industries',
      'professionalSummary.keyExpertise',
      'professionalSummary.notableCompanies',
      'skills.technical',
      'skills.professional',
      'skills.soft',
      'achievements'
    ].forEach(path => ensureArray(parsed, path));
    
    return parsed;
  } catch (err) {
    console.warn('Failed to parse JSON:', err);
    return null;
  }
};

export const retryOperation = async (operation, maxRetries = 3, delay = 1000) => {
  if (typeof operation !== 'function') {
    throw new Error('Operation must be a function');
  }

  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await operation();
      if (result === undefined || result === null) {
        throw new Error('Operation returned null or undefined');
      }
      return result;
    } catch (err) {
      lastError = err;
      console.warn(`Retry attempt ${i + 1} failed:`, err);
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i))); // Exponential backoff
      }
    }
  }
  
  throw new Error(`Operation failed after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
};

/**
 * Gets ISO 639-1 language code for a given language name using OpenAI
 * 
 * @param {string} language - The language name to get the code for
 * @param {OpenAI} openaiClient - OpenAI client instance
 * @returns {Promise<string>} - The ISO 639-1 two-letter language code
 */
export const getLanguageCodeFromAI = async (language, openaiClient) => {
  try {
    const response = await openaiClient.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a language expert. Given a language name or identifier, return ONLY the corresponding ISO 639-1 two-letter language code. 
          For example:
          - "English" -> "en"
          - "français" -> "fr"
          - "中文" -> "zh"
          - "العربية" -> "ar"
          Return ONLY the two-letter code, nothing else.`
        },
        {
          role: "user",
          content: language
        }
      ],
      temperature: 0.1,
      max_tokens: 2 // We only need 2 characters
    });

    const languageCode = response.choices[0].message.content.trim().toLowerCase();
    
    // Simple validation - check if it's exactly 2 characters
    if (languageCode.length === 2 && /^[a-z]{2}$/.test(languageCode)) {
      return languageCode;
    }
    
    throw new Error(`Invalid language code returned: ${languageCode}`);
  } catch (error) {
    console.error('Error getting language code from AI:', error);
    return ""; // Return empty string as default
  }
};
