// Default categories used in the app
export const CATEGORIES = [
  "Food", "Transport", "Shopping", "Housing", "Utilities", "Entertainment", "Health", "Income", "Other"
];

// Fallback basic keyword mapping if no specific merchant rule matches
const keywordMap = {
  "swiggy": "Food",
  "zomato": "Food",
  "kfc": "Food",
  "mcdonalds": "Food",
  "grocery": "Food",
  "supermarket": "Food",
  
  "ola": "Transport",
  "uber": "Transport",
  "metro": "Transport",
  "fuel": "Transport",
  "petrol": "Transport",
  
  "amazon": "Shopping",
  "flipkart": "Shopping",
  "myntra": "Shopping",
  "ajio": "Shopping",
  "mall": "Shopping",
  
  "rent": "Housing",
  "emi": "Housing",
  
  "tneb": "Utilities",
  "bescom": "Utilities",
  "airtel": "Utilities",
  "jio": "Utilities",
  "vi ": "Utilities",
  "electricity": "Utilities",
  "water": "Utilities",
  "wifi": "Utilities",
  "broadband": "Utilities",
  
  "netflix": "Entertainment",
  "prime": "Entertainment",
  "hotstar": "Entertainment",
  "movie": "Entertainment",
  
  "apollo": "Health",
  "pharmacy": "Health",
  "hospital": "Health",
  "clinic": "Health",
  
  "salary": "Income",
  "bonus": "Income",
  "interest": "Income",
  "dividend": "Income"
};

/**
 * Predicts category based on transaction description and dynamic DB rules
 */
export const predictCategory = (description, dbRules = []) => {
  if (!description) return "Other";
  
  const descLower = description.toLowerCase();

  // 1. Check DB Rules first (highest precedence)
  for (const rule of dbRules) {
    if (descLower.includes(rule.merchant.toLowerCase())) {
      return rule.category;
    }
  }

  // 2. Check Static Keyword Map
  for (const [key, category] of Object.entries(keywordMap)) {
    if (descLower.includes(key)) {
      return category;
    }
  }

  // 3. Fallback heuristics based on amount logic (handled elsewhere if we only have description here)
  if (descLower.includes('salary') || descLower.includes('credit')) {
    return "Income";
  }

  return "Other"; // Default
};
