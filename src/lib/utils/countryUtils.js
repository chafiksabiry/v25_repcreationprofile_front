/**
 * Utility functions for handling country detection and conversion
 */

/**
 * Find a country object by country code from a list of countries
 * @param {Array} countries - Array of country objects from timezones API
 * @param {string} countryCode - Two-letter country code (e.g., "MA")
 * @returns {Object|null} - Country object or null if not found
 */
export const findCountryByCode = (countries, countryCode) => {
  if (!countries || !countryCode) return null;
  
  return countries.find(country => 
    country.countryCode && country.countryCode.toLowerCase() === countryCode.toLowerCase()
  ) || null;
};

/**
 * Create a country object from IP location info
 * @param {Object} locationInfo - Location info from IP endpoint
 * @returns {Object|null} - Country object compatible with existing system
 */
export const createCountryFromLocationInfo = (locationInfo) => {
  if (!locationInfo || !locationInfo.countryCode) return null;
  
  return {
    countryCode: locationInfo.countryCode,
    countryName: locationInfo.country || locationInfo.countryCode,
    region: locationInfo.region,
    city: locationInfo.city,
    timezone: locationInfo.timezone
  };
};

/**
 * Compare two country objects for equality
 * @param {Object|string} country1 - First country (object or string)
 * @param {Object|string} country2 - Second country (object or string)
 * @returns {boolean} - True if countries are the same
 */
export const areCountriesEqual = (country1, country2) => {
  if (!country1 || !country2) return false;
  
  const code1 = typeof country1 === 'object' ? country1.countryCode : country1;
  const code2 = typeof country2 === 'object' ? country2.countryCode : country2;
  
  return code1 && code2 && code1.toLowerCase() === code2.toLowerCase();
};

/**
 * Get country code from various country representations
 * @param {Object|string} country - Country object or string
 * @returns {string|null} - Two-letter country code or null
 */
export const getCountryCode = (country) => {
  if (!country) return null;
  
  if (typeof country === 'string') return country;
  if (typeof country === 'object' && country.countryCode) return country.countryCode;
  
  return null;
};

/**
 * Get country name from various country representations
 * @param {Object|string} country - Country object or string
 * @returns {string|null} - Country name or null
 */
export const getCountryName = (country) => {
  if (!country) return null;
  
  if (typeof country === 'string') return country;
  if (typeof country === 'object' && country.countryName) return country.countryName;
  
  return null;
};

/**
 * Validate if a country code is valid (2 letters)
 * @param {string} countryCode - Country code to validate
 * @returns {boolean} - True if valid
 */
export const isValidCountryCode = (countryCode) => {
  if (!countryCode || typeof countryCode !== 'string') return false;
  return /^[A-Z]{2}$/i.test(countryCode.trim());
};

/**
 * Convert IP location data to profile-compatible format
 * @param {Object} locationInfo - Location info from IP endpoint
 * @param {Array} availableCountries - List of available countries from timezones API
 * @returns {Object|null} - Profile-compatible country object or null
 */
export const convertLocationToCountryObject = (locationInfo, availableCountries = []) => {
  if (!locationInfo || !locationInfo.countryCode) return null;
  
  // First, try to find the country in the available countries list
  const existingCountry = findCountryByCode(availableCountries, locationInfo.countryCode);
  
  if (existingCountry) {
    return existingCountry;
  }
  
  // If not found in available countries, create a new country object
  return createCountryFromLocationInfo(locationInfo);
}; 