import { getCollection, COLLECTIONS } from './database';

/**
 * Generates a random alphanumeric string
 */
function generateRandomSlug(length: number = 7): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generates a unique short slug (6-8 characters) for sharing codes
 * Retries if the generated slug already exists in the database
 */
export async function generateUniqueSlug(length: number = 7, maxRetries: number = 10): Promise<string> {
  const codesCollection = await getCollection(COLLECTIONS.CODES);
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const slug = generateRandomSlug(length);
    
    // Check if slug already exists
    const existing = await codesCollection.findOne({ shareId: slug });
    
    if (!existing) {
      return slug;
    }
  }
  
  // If all retries failed, try with a longer slug
  return generateUniqueSlug(length + 1, maxRetries);
}

