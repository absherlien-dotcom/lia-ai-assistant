# LIA V5.1 Google Mobile Fix

إصلاح حقيقي لمشكلة V5:

- إصلاح توزيع الشاشة الذي جعل الواجهة تظهر في المنتصف.
- عند الفتح من الهاتف لا يظهر إطار هاتف وهمي؛ التطبيق يملأ الشاشة.
- إصلاح أزرار التنقل والواجهة.
- تسجيل دخول Google فقط.
- شاشة رئيسية، محادثة، صوت، مهام، ديون، ذاكرة، إعدادات.
- API واحد فقط: api/index.js

## مهم جدًا قبل الرفع

احذف مجلد api القديم واترك فقط:

api/index.js

## متغيرات Vercel المطلوبة لتسجيل Google

GOOGLE_CLIENT_ID=ضع Google OAuth Client ID هنا
LIA_ALLOWED_EMAIL=absherlien@gmail.com
GEMINI_API_KEY=مفتاح Gemini
GEMINI_MODEL=gemini-2.5-flash

بدون GOOGLE_CLIENT_ID سيظهر زر Google لكنه سيطلب منك إضافة المتغير.

## اختبار بعد النشر

/api/auth-check
/api/config
/?v=51

## ملاحظة Google

لا يمكن عمل دخول Google حقيقي بدون Google OAuth Client ID.
لازم تنشئه من Google Cloud Console ثم تضيفه في Vercel كمتغير GOOGLE_CLIENT_ID.
