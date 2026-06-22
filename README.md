# LIA V5.3 Google Fixed Mobile

إصلاح مباشر للمشكلة التي جعلت زر Google لا يعمل.

السبب في النسخة السابقة: كان هناك كود قديم يحاول تشغيل `loginForm.addEventListener` رغم أننا حذفنا نموذج اسم المستخدم وكلمة المرور. هذا يوقف JavaScript بالكامل، لذلك الزر لا يفتح أي شيء.

## الرفع

1. احذف مجلد api القديم كاملًا.
2. ارفع كل محتويات هذه الحزمة.
3. تأكد أن داخل api يوجد ملف واحد فقط:
   api/index.js
4. Commit.
5. Redeploy في Vercel.

## المتغيرات المطلوبة في Vercel

GOOGLE_CLIENT_ID
LIA_ALLOWED_EMAIL=absherlien@gmail.com
GEMINI_API_KEY
GEMINI_MODEL=gemini-2.5-flash

## اختبار

افتح:
/api/config

لازم يظهر:
googleReady: true
version: 5.3

ثم:
? v=53
