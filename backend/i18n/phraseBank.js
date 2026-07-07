/**
 * Offline phrase bank so the assistant works with zero external API
 * dependency (reliable for hackathon judging environments / offline demo).
 * Swap `translate()` for a real provider (Google Translate, DeepL, an LLM)
 * by setting TRANSLATION_API_KEY in .env and extending translate.js.
 *
 * Supported languages: en, hi, gu, es, fr, ar
 */

const PHRASES = {
  greeting: {
    en: 'Welcome to the stadium! Ask me about gates, restrooms, food, or accessible routes.',
    hi: 'स्टेडियम में आपका स्वागत है! गेट, शौचालय, भोजन या सुलभ मार्गों के बारे में पूछें।',
    gu: 'સ્ટેડિયમમાં આપનું સ્વાગત છે! ગેટ, શૌચાલય, ભોજન અથવા સુલભ માર્ગો વિશે પૂછો.',
    es: '¡Bienvenido al estadio! Pregúntame sobre puertas, baños, comida o rutas accesibles.',
    fr: "Bienvenue au stade ! Demandez-moi les portes, toilettes, nourriture ou itinéraires accessibles.",
    ar: 'مرحبًا بك في الملعب! اسألني عن البوابات أو الحمامات أو الطعام أو المسارات التي يسهل الوصول إليها.',
  },
  zone_clear: {
    en: 'Zone {zone} is clear right now. Go ahead.',
    hi: 'ज़ोन {zone} अभी खाली है। आगे बढ़ें।',
    gu: 'ઝોન {zone} અત્યારે ખાલી છે. આગળ વધો.',
    es: 'La zona {zone} está despejada ahora. Adelante.',
    fr: "La zone {zone} est dégagée en ce moment. Allez-y.",
    ar: 'المنطقة {zone} خالية الآن. تفضل.',
  },
  zone_congested: {
    en: 'Zone {zone} is congested. I recommend using {alt} instead — it is less crowded.',
    hi: 'ज़ोन {zone} में भीड़ है। इसके बजाय {alt} का उपयोग करें — वहाँ कम भीड़ है।',
    gu: 'ઝોન {zone} માં ભીડ છે. તેના બદલે {alt} નો ઉપયોગ કરો — ત્યાં ઓછી ભીડ છે.',
    es: 'La zona {zone} está congestionada. Te recomiendo usar {alt} en su lugar, hay menos gente.',
    fr: "La zone {zone} est encombrée. Je vous recommande d'utiliser {alt} à la place, il y a moins de monde.",
    ar: 'المنطقة {zone} مزدحمة. أوصي باستخدام {alt} بدلاً منها، فهي أقل ازدحامًا.',
  },
  accessible_route: {
    en: 'The nearest wheelchair-accessible route is via {zone}, with ramps and no stairs.',
    hi: 'निकटतम व्हीलचेयर-सुलभ मार्ग {zone} से है, जिसमें रैंप हैं और सीढ़ियाँ नहीं हैं।',
    gu: 'નજીકનો વ્હીલચેર-સુલભ માર્ગ {zone} મારફતે છે, જેમાં રેમ્પ છે અને સીડીઓ નથી.',
    es: 'La ruta accesible en silla de ruedas más cercana es por {zone}, con rampas y sin escaleras.',
    fr: "L'itinéraire accessible en fauteuil roulant le plus proche passe par {zone}, avec des rampes et sans escaliers.",
    ar: 'أقرب مسار يمكن الوصول إليه بالكرسي المتحرك هو عبر {zone}، مع منحدرات وبدون درج.',
  },
  not_understood: {
    en: "I didn't quite catch that. Try asking about a gate, restroom, exit, or accessibility.",
    hi: 'मुझे समझ नहीं आया। गेट, शौचालय, निकास या सुगमता के बारे में पूछें।',
    gu: 'મને સમજાયું નહીં. ગેટ, શૌચાલય, બહાર નીકળવાના માર્ગ અથવા સુલભતા વિશે પૂછો.',
    es: 'No entendí bien. Intenta preguntar sobre una puerta, baño, salida o accesibilidad.',
    fr: "Je n'ai pas bien compris. Essayez de demander une porte, des toilettes, une sortie ou l'accessibilité.",
    ar: 'لم أفهم ذلك تمامًا. حاول السؤال عن بوابة أو حمام أو مخرج أو إمكانية الوصول.',
  },
};

const SUPPORTED_LANGUAGES = ['en', 'hi', 'gu', 'es', 'fr', 'ar'];

/**
 * Render a phrase key in the requested language, substituting {placeholders}.
 * Falls back to English if the language or key is missing.
 */
function translate(key, lang, vars = {}) {
  const langSafe = SUPPORTED_LANGUAGES.includes(lang) ? lang : 'en';
  const entry = PHRASES[key];
  if (!entry) return '';
  let text = entry[langSafe] || entry.en;
  for (const [k, v] of Object.entries(vars)) {
    text = text.replaceAll(`{${k}}`, v);
  }
  return text;
}

module.exports = { translate, SUPPORTED_LANGUAGES, PHRASES };
