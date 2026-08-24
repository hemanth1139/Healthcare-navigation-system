"""
Language Translation Service.
Translates medical reports and conversations between English, Hindi, Tamil, Telugu, and Bengali
to bridge low-health-literacy language barriers in underserved regions.
"""

from typing import Dict, Any
from app.config import settings

# Basic fallback dictionary for common triage questions/terms in regional languages
FALLBACK_TRANSLATION = {
    "hi": {
        "hello": "नमस्ते",
        "i have a headache and fever": "मुझे सिरदर्द और बुखार है",
        "immediate emergency triage required": "तत्काल आपातकालीन ट्राइएज की आवश्यकता है",
        "please consult a cardiologist": "कृपया हृदय रोग विशेषज्ञ से परामर्श लें"
    },
    "ta": {
        "hello": "வணக்கம்",
        "i have a headache and fever": "எனக்கு தலைவலியும் காய்ச்சலும் உள்ளது",
        "immediate emergency triage required": "உடனடி அவசர சிகிச்சை தேவைப்படுகிறது",
        "please consult a cardiologist": "தயவுசெய்து ஒரு இருதய மருத்துவரை அணுகவும்"
    },
    "te": {
        "hello": "నమస్కారం",
        "i have a headache and fever": "నాకు తలనొప్పి మరియు జ్వరం ఉంది",
        "immediate emergency triage required": "వెంటనే అత్యవసర చికిత్స అవసరం",
        "please consult a cardiologist": "దయచేసి కార్డియాలజిస్ట్‌ను సంప్రదించండి"
    },
    "bn": {
        "hello": "নমস্কার",
        "i have a headache and fever": "আমার মাথাব্যথা এবং জ্বর হয়েছে",
        "immediate emergency triage required": "অবিলম্বে জরুরি চিকিৎসার প্রয়োজন",
        "please consult a cardiologist": "অনুগ্রহ করে একজন হৃদরোগ বিশেষজ্ঞের সাথে পরামর্শ করুন"
    }
}


class TranslationService:
    @staticmethod
    async def translate(text: str, target_lang: str) -> Dict[str, Any]:
        """
        Translates text to the target language code.
        """
        t_lang = target_lang.lower().strip()
        
        # Default if target matches source or default en
        if t_lang == "en" or not text:
            return {
                "translatedText": text,
                "sourceLang": "en",
                "targetLang": t_lang
            }

        # 1. If LLM is configured, run semantic translation
        if settings.GOOGLE_API_KEY:
            from langchain_google_genai import ChatGoogleGenerativeAI
            from langchain_core.messages import SystemMessage, HumanMessage
            
            # Map code to lang name
            lang_names = {"hi": "Hindi", "ta": "Tamil", "te": "Telugu", "bn": "Bengali"}
            target_name = lang_names.get(t_lang, t_lang)
            
            SYSTEM_PROMPT = f"""You are a professional medical translator.
Translate the following medical statement into {target_name}. 
Provide ONLY the translated text without extra explanations or notes. Keep medical terms clear and culturally appropriate.
"""
            try:
                llm = ChatGoogleGenerativeAI(
                    model="gemini-2.5-flash",
                    temperature=0.1,
                    google_api_key=settings.GOOGLE_API_KEY
                )
                response = await llm.ainvoke([
                    SystemMessage(content=SYSTEM_PROMPT),
                    HumanMessage(content=text)
                ])
                return {
                    "translatedText": response.content.strip(),
                    "sourceLang": "en",
                    "targetLang": t_lang
                }
            except Exception as e:
                print(f"[ERROR] LLM Translation failed: {e}. Falling back to dictionary.")

        # 2. Fallback Rule-Based Dictionary translation
        text_lower = text.lower().strip().replace(".", "")
        lang_dict = FALLBACK_TRANSLATION.get(t_lang, {})
        
        # Try exact lookup
        translated = lang_dict.get(text_lower)
        if not translated:
            # Fallback placeholder showing translation intent
            translated = f"[{t_lang.upper()} Translation] {text}"

        return {
            "translatedText": translated,
            "sourceLang": "en",
            "targetLang": t_lang
        }
