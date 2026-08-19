
// Sample security rules for detecting and masking sensitive information
const securityRules = [
  {
    name: "Email Address",
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    replacement: "****@****.***"
  },
  {
    name: "API Key",
    pattern: /\b(?:api[_-]?key|apikey)[\s:=]+["']?([\w]{16,})["']?/gi,
    replacement: "[API_KEY_MASKED]"
  },
  {
    name: "Credit Card Number",
    pattern: /\b(?:\d{4}[- ]?){3}\d{4}\b/g,
    replacement: "****-****-****-****"
  },
  {
    name: "Phone Number",
    pattern: /\b(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g,
    replacement: "***-***-****"
  },
  {
    name: "Password Reference",
    pattern: /\b(?:password|passwd|pwd)[\s:=]+["']?([^\s"']+)["']?/gi,
    replacement: "[PASSWORD_MASKED]"
  }
];

// Security rules for detecting adversarial prompts
const adversarialPatterns = [
  {
    name: "Prompt Injection",
    pattern: /\b(?:ignore|forget|disregard)\s+(?:previous|earlier|all)?\s*(?:instructions|prompt|rules)\b/i,
  },
  {
    name: "System Prompt Extraction",
    pattern: /\b(?:system|initial|original)\s+(?:prompt|instruction|role|directive)\b/i,
  },
  {
    name: "Jailbreak Attempt",
    pattern: /\b(?:developer|DAN|expert|unrestricted)\s+(?:mode|persona|role)\b/i,
  }
];

/**
 * Apply security rules to mask sensitive information in text
 */
export const applySecurityRules = (text: string): string => {
  let result = text;
  
  // Apply masking rules
  securityRules.forEach(rule => {
    result = result.replace(rule.pattern, rule.replacement);
  });
  
  return result;
};

/**
 * Check if text contains adversarial patterns
 */
export const checkAdversarialPrompt = (text: string): boolean => {
  return adversarialPatterns.some(pattern => pattern.pattern.test(text));
};

/**
 * Log prompt to monitoring system
 */
export const logPrompt = (prompt: string, userId: string, departmentId: string): void => {
  const isAdversarial = checkAdversarialPrompt(prompt);
  
  // In a real app, this would send data to a backend
  console.log('Prompt logged:', {
    prompt,
    userId,
    departmentId,
    timestamp: new Date().toISOString(),
    isAdversarial
  });
};
