# LIA Full V4 - Vercel Ready

هذه حزمة كاملة جاهزة لـ Vercel وتمنع الرجوع للتصميم القديم.

## طريقة الرفع
1. فك ضغط الملف.
2. ارفع كل محتويات المجلد إلى جذر مشروع GitHub، وليس داخل مجلد فرعي.
3. وافق على Replace/Overwrite لكل الملفات.
4. Commit changes.
5. انتظر Vercel حتى ينشر.

## اختبار التحديث
افتح:
/api/auth-check

المفروض يظهر JSON مثل:
{"loggedIn":false}

وافتح:
/assets/lia-icon.svg

المفروض يظهر الشعار الجديد، وليس صفحة HTML.

## بيانات الدخول
username: hesham1amd
password: 1236542080

## متغيرات Vercel المطلوبة
GEMINI_API_KEY
GEMINI_MODEL=gemini-2.5-flash

اختياريًا:
LIA_USER
LIA_PASS
LIA_SESSION_SECRET
