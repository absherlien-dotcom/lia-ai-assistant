# LIA V5.4 Clean Mobile No Overlap

هذه نسخة إصلاح جذري للتداخل الذي ظهر على الهاتف.

سبب المشكلة: الشاشات كانت تظهر فوق بعض أو الكاش/الترجمة كان يخرب النصوص.
هذه النسخة تستخدم نظام شاشات واضح:
.screen { display:none!important }
.screen.active { display:block!important }

ومنعنا ترجمة المتصفح:
translate="no"
meta google notranslate

## الرفع
1. احذف الملفات القديمة من المشروع قدر الإمكان، خصوصًا app.js و style.css القديمة لو كانت موجودة.
2. ارفع محتويات هذه الحزمة.
3. داخل api يوجد فقط api/index.js.
4. Commit ثم Redeploy بدون Build Cache.

## اختبار
/api/config?t=54
لازم يظهر version 5.4 و googleReady true.
ثم افتح:
https://lia-ai-assistant.vercel.app/?v=54

## مهم على الهاتف
في Chrome اضغط أيقونة الترجمة وأوقف ترجمة الصفحة للموقع.
