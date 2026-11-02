// Languages the AI tutor explains in: English, Hinglish and the 22 scheduled languages of India.
// `speech` is the BCP-47 tag used to pick a device voice; `voiceFallback` is tried when the device
// has no voice for that language (only where the script is the same, so the reading still makes sense).
// `rtl` marks right-to-left scripts.
export const TUTOR_LANGUAGES = [
  { code: 'en', name: 'English', native: 'English', speech: 'en-IN' },
  { code: 'hinglish', name: 'Hinglish', native: 'Hinglish', speech: 'en-IN', note: 'Hindi + English, in English letters' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', speech: 'hi-IN' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', speech: 'te-IN' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', speech: 'ta-IN' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം', speech: 'ml-IN' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', speech: 'kn-IN' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', speech: 'bn-IN' },
  { code: 'mr', name: 'Marathi', native: 'मराठी', speech: 'mr-IN', voiceFallback: 'hi-IN' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી', speech: 'gu-IN' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', speech: 'pa-IN' },
  { code: 'or', name: 'Odia', native: 'ଓଡ଼ିଆ', speech: 'or-IN' },
  { code: 'ur', name: 'Urdu', native: 'اردو', speech: 'ur-IN', rtl: true },
  { code: 'as', name: 'Assamese', native: 'অসমীয়া', speech: 'as-IN', voiceFallback: 'bn-IN' },
  { code: 'ne', name: 'Nepali', native: 'नेपाली', speech: 'ne-NP', voiceFallback: 'hi-IN' },
  { code: 'kok', name: 'Konkani', native: 'कोंकणी', speech: 'kok-IN', voiceFallback: 'mr-IN' },
  { code: 'mai', name: 'Maithili', native: 'मैथिली', speech: 'mai-IN', voiceFallback: 'hi-IN' },
  { code: 'doi', name: 'Dogri', native: 'डोगरी', speech: 'doi-IN', voiceFallback: 'hi-IN' },
  { code: 'brx', name: 'Bodo', native: 'बड़ो', speech: 'brx-IN', voiceFallback: 'hi-IN' },
  { code: 'sa', name: 'Sanskrit', native: 'संस्कृतम्', speech: 'sa-IN', voiceFallback: 'hi-IN' },
  { code: 'sd', name: 'Sindhi', native: 'سنڌي', speech: 'sd-IN', rtl: true, voiceFallback: 'ur-IN' },
  { code: 'ks', name: 'Kashmiri', native: 'کٲشُر', speech: 'ks-IN', rtl: true, voiceFallback: 'ur-IN' },
  { code: 'mni', name: 'Manipuri', native: 'মৈতৈলোন্', speech: 'mni-IN', voiceFallback: 'bn-IN', note: 'Bengali script' },
  { code: 'sat', name: 'Santali', native: 'ᱥᱟᱱᱛᱟᱲᱤ', speech: 'sat-IN', note: 'Ol Chiki script' }
];

// Noto font for each script, loaded on demand so every script renders even on devices without it.
export const SCRIPT_FONTS = {
  te: 'Noto Sans Telugu', ta: 'Noto Sans Tamil', ml: 'Noto Sans Malayalam', kn: 'Noto Sans Kannada',
  bn: 'Noto Sans Bengali', as: 'Noto Sans Bengali', mni: 'Noto Sans Bengali',
  hi: 'Noto Sans Devanagari', mr: 'Noto Sans Devanagari', ne: 'Noto Sans Devanagari', kok: 'Noto Sans Devanagari',
  mai: 'Noto Sans Devanagari', doi: 'Noto Sans Devanagari', brx: 'Noto Sans Devanagari', sa: 'Noto Sans Devanagari',
  gu: 'Noto Sans Gujarati', pa: 'Noto Sans Gurmukhi', or: 'Noto Sans Oriya',
  ur: 'Noto Naskh Arabic', sd: 'Noto Naskh Arabic', ks: 'Noto Naskh Arabic', sat: 'Noto Sans Ol Chiki'
};

export const TUTOR_STYLES = [
  { id: 'simple', label: 'Explain simply', hint: 'New to this? Everyday examples, no jargon.' },
  { id: 'exam', label: 'Interview & exam ready', hint: 'Deeper: key terms, edge cases, likely questions.' }
];

// Follow-up buttons under an explanation ("Still confused?").
export const TUTOR_ACTIONS = [
  { id: 'simpler', label: 'Explain simpler' },
  { id: 'example', label: 'Another example' },
  { id: 'reallife', label: 'Real-life use' },
  { id: 'code', label: 'Code line by line' },
  { id: 'quiz', label: 'Quiz me' }
];

export const findTutorLanguage = (code) => TUTOR_LANGUAGES.find(l => l.code === code) || null;
export const isTutorStyle = (id) => TUTOR_STYLES.some(s => s.id === id);
