// Fix for "exports is not defined" error in Next.js 15
if (typeof window !== 'undefined') {
  // Browser environment
  if (typeof exports === 'undefined') {
    window.exports = {};
  }
  if (typeof module === 'undefined') {
    window.module = { exports: {} };
  }
  if (typeof require === 'undefined') {
    window.require = function() { return {}; };
  }
} else {
  // Node.js environment
  if (typeof exports === 'undefined') {
    global.exports = {};
  }
  if (typeof module === 'undefined') {
    global.module = { exports: {} };
  }
  if (typeof require === 'undefined') {
    global.require = function() { return {}; };
  }
}
