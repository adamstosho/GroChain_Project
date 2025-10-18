/**
 * Utility functions for handling number precision issues in JavaScript
 * Prevents floating-point arithmetic errors like 0.1 + 0.2 = 0.30000000000000004
 */

/**
 * Ensures a number has exactly the specified number of decimal places
 * @param {number} value - The number to round
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {number} - The rounded number
 */
function roundToDecimals(value, decimals = 2) {
  if (typeof value !== 'number' || isNaN(value)) {
    return 0
  }
  
  // Use parseFloat with toFixed to avoid floating-point precision issues
  return parseFloat(value.toFixed(decimals))
}

/**
 * Ensures a number is stored with exact precision (2 decimal places)
 * This is specifically for quantities, prices, and other financial values
 * @param {number|string} value - The value to process
 * @returns {number} - The processed number with exact precision
 */
function ensureExactPrecision(value) {
  if (value === null || value === undefined || value === '') {
    return 0
  }
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  
  if (isNaN(numValue)) {
    return 0
  }
  
  return roundToDecimals(numValue, 2)
}

/**
 * Validates that a number is a valid positive quantity
 * @param {number|string} value - The value to validate
 * @returns {object} - { isValid: boolean, value: number, error?: string }
 */
function validateQuantity(value) {
  const processedValue = ensureExactPrecision(value)
  
  if (processedValue <= 0) {
    return {
      isValid: false,
      value: 0,
      error: 'Quantity must be greater than 0'
    }
  }
  
  return {
    isValid: true,
    value: processedValue
  }
}

/**
 * Validates that a number is a valid price
 * @param {number|string} value - The value to validate
 * @returns {object} - { isValid: boolean, value: number, error?: string }
 */
function validatePrice(value) {
  const processedValue = ensureExactPrecision(value)
  
  if (processedValue < 0) {
    return {
      isValid: false,
      value: 0,
      error: 'Price cannot be negative'
    }
  }
  
  return {
    isValid: true,
    value: processedValue
  }
}

module.exports = {
  roundToDecimals,
  ensureExactPrecision,
  validateQuantity,
  validatePrice
}


