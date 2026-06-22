# LIA V5.2 Google Chooser Once

هذه نسخة إصلاح تسجيل Google:

- زر Google يفتح نافذة اختيار الحسابات مثل المواقع الطبيعية.
- يستخدم Google OAuth Token Client مع prompt=select_account.
- بعد تسجيل الدخول مرة واحدة يتم حفظ جلسة على الجهاز لمدة طويلة عبر Cookie.
- إذا GOOGLE_CLIENT_ID غير مضاف يظهر تنبيه واضح بدل زر جامد.
- API واحد فقط: api/index.js

## مهم جدًا قبل الرفع

احذف مجلد api القديم واترك فقط:

api/index.js

## متغيرات Vercel المطلوبة

GEMINI_API_KEY=مفتاح Gemini
GEMINI_MODEL=gemini-2.5-flash
GOOGLE_CLIENT_ID=Client ID من Google Cloud
LIA_ALLOWED_EMAIL=absherlien@gmail.com

## إعداد Google Cloud الضروري

في OAuth Client من نوع Web application أضف Authorized JavaScript origin:

https://lia-ai-assistant.vercel.app

لو تستخدم رابط Preview من Vercel للتجربة أضفه أيضًا.

## اختبار بعد النشر

/api/config
/api/auth-check
/?v=52

إذا كان /api/config يرجع googleClientId فارغ، فالزر لن يفتح قائمة الحسابات حتى تضيف GOOGLE_CLIENT_ID في Vercel.
