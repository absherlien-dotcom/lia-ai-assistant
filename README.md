# LIA Full V4.1 - Vercel Ready - One API Function

هذه نسخة مخصصة لحل خطأ Vercel:

> لا يمكن إضافة أكثر من 12 وظيفة بدون خادم

تم دمج كل الـ API في ملف واحد فقط:

api/index.js

## مهم جدًا قبل الرفع

احذف مجلد api القديم بالكامل من GitHub، ثم ارفع مجلد api الجديد الذي يحتوي على ملف واحد فقط:

api/index.js

لا تترك الملفات القديمة مثل:

api/debts.js
api/firebase.js
api/gemini.js
api/memory.js
api/reminders.js
api/server.js
api/tasks.js
api/login.js
api/chat.js
api/health.js

لأن كل ملف يحسبه Vercel كوظيفة مستقلة.

## طريقة الرفع الصحيحة

1. فك الضغط.
2. افتح GitHub.
3. احذف مجلد api القديم كامل.
4. ارفع محتويات هذه الحزمة إلى جذر المشروع.
5. وافق على الاستبدال.
6. Commit changes.
7. انتظر Vercel.

## اختبار بعد النشر

افتح:

/api/auth-check

المفروض يظهر:

{"loggedIn":false}

ثم:

/assets/lia-icon.svg

المفروض يظهر الشعار الجديد.

## بيانات الدخول

username:
hesham1amd

password:
1236542080

## متغيرات Vercel

GEMINI_API_KEY
GEMINI_MODEL=gemini-2.5-flash
