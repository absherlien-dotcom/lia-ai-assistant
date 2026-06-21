# LIA Full V4.2 - Inline Fix

هذه نسخة علاجية لحل مشكلة ظهور الصفحة بدون تصميم.

## ما الذي تغير؟

- تم وضع CSS داخل index.html مباشرة.
- تم وضع JavaScript داخل index.html مباشرة.
- تم تضمين الشعار داخل الصفحة مباشرة بصيغة Data URI.
- تم تعديل sw.js حتى يمسح الكاش القديم ويلغي Service Worker بدل تخزين نسخة قديمة.
- بقي api/index.js فقط لتجنب خطأ Vercel الخاص بأكثر من 12 وظيفة.

## طريقة الرفع

1. فك الضغط.
2. في GitHub ارفع محتويات المجلد إلى جذر المشروع.
3. وافق على الاستبدال.
4. تأكد أن مجلد api يحتوي index.js فقط.
5. Commit changes.
6. انتظر Vercel.

## بعد النشر

افتح:

/api/auth-check

يجب أن يظهر:

{"loggedIn":false}

ثم افتح:

/?v=42

إذا بقي الشكل بدون تصميم:
- F12
- Application
- Storage
- Clear site data
- Service Workers
- Unregister
- Ctrl + F5

## بيانات الدخول

username:
hesham1amd

password:
1236542080
