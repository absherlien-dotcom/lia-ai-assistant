# LIA Pro V3.1 Final PWA

تحديث نهائي:
- شعار جديد احترافي بصيغة SVG + أيقونات PNG.
- دعم PWA للتجربة كتطبيق على الهاتف.
- تسجيل دخول من السيرفر وليس Local فقط.
- تحسين الصوت: يبحث عن أي صوت عربي تلقائيًا، مع تنبيه إذا المتصفح لا يوفر صوت عربي.
- لغة التعرف الصوتي قابلة للاختيار: ar-YE / ar-SA / ar / en-US.
- إصلاح شكل الشعار داخل الواجهة.
- تبقى البيانات المحلية في المتصفح.

استبدل الملفات التالية:
- server.js
- package.json
- app/index.html
- app/style.css
- app/app.js
- app/manifest.json
- app/sw.js
- app/assets/*

ثم Commit إلى GitHub وبعدها Redeploy في Vercel.

بيانات الدخول:
- username: hesham1amd
- password: 1236542080

الأفضل لاحقًا في Vercel إضافة:
- LIA_USER
- LIA_PASS
- LIA_SESSION_SECRET
حتى لا تبقى بيانات الدخول داخل الكود.
