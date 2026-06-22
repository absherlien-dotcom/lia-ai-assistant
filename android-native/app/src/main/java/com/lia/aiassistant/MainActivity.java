package com.lia.aiassistant;

import android.app.Activity;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.LinearGradient;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.RadialGradient;
import android.graphics.RectF;
import android.graphics.Shader;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

import java.util.Locale;

public class MainActivity extends Activity {
    private FrameLayout root;
    private LinearLayout drawer;
    private View shade;
    private TextView title;
    private TextView sub;
    private TextView status;
    private TextView tasksView;
    private TextView financeView;
    private TextView memoryView;
    private VoiceOrb orb;
    private TextToSpeech tts;
    private int tasks = 0;
    private int finance = 0;
    private int memory = 0;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Window w = getWindow();
        w.setStatusBarColor(Color.parseColor("#050414"));
        w.setNavigationBarColor(Color.parseColor("#050414"));
        tts = new TextToSpeech(this, r -> {
            if (r == TextToSpeech.SUCCESS) {
                tts.setLanguage(new Locale("ar"));
                tts.setSpeechRate(.95f);
                tts.setPitch(1.05f);
            }
        });
        buildNativeUi();
    }

    private void buildNativeUi() {
        root = new FrameLayout(this);
        root.setBackground(new NeonBg());
        root.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);
        setContentView(root);

        LinearLayout main = new LinearLayout(this);
        main.setOrientation(LinearLayout.VERTICAL);
        main.setPadding(dp(14), dp(10), dp(14), dp(10));
        root.addView(main, new FrameLayout.LayoutParams(-1, -1));

        LinearLayout top = new LinearLayout(this);
        top.setGravity(Gravity.CENTER);
        main.addView(top, new LinearLayout.LayoutParams(-1, dp(62)));

        Button menu = round("☰", 20);
        top.addView(menu, new LinearLayout.LayoutParams(dp(50), dp(50)));
        menu.setOnClickListener(v -> toggleDrawer());

        TextView brand = new TextView(this);
        brand.setText("lia.ai");
        brand.setTextColor(Color.WHITE);
        brand.setTextSize(30);
        brand.setTypeface(null, 1);
        brand.setGravity(Gravity.CENTER);
        top.addView(brand, new LinearLayout.LayoutParams(0, -1, 1));

        Button eq = round("≋", 23);
        top.addView(eq, new LinearLayout.LayoutParams(dp(50), dp(50)));

        title = text("ليا جاهزة للاستماع", 31, true, Color.WHITE);
        main.addView(title, new LinearLayout.LayoutParams(-1, -2));
        sub = text("نسخة Android أصلية — لا تفتح موقع ولا WebView", 14, false, Color.parseColor("#B8B1D3"));
        main.addView(sub, new LinearLayout.LayoutParams(-1, -2));

        TextView dots = text("•  •  •", 26, true, Color.parseColor("#22E8FF"));
        main.addView(dots, new LinearLayout.LayoutParams(-1, dp(36)));

        orb = new VoiceOrb(this);
        main.addView(orb, new LinearLayout.LayoutParams(-1, 0, 1));

        status = text("التطبيق الأصلي يعمل الآن داخل الهاتف", 19, false, Color.parseColor("#E7E1FF"));
        main.addView(status, new LinearLayout.LayoutParams(-1, -2));
        TextView bars = text("▁ ▃ ▅ ▇ ▅ ▃ ▁", 22, true, Color.parseColor("#22E8FF"));
        main.addView(bars, new LinearLayout.LayoutParams(-1, dp(34)));

        LinearLayout row1 = new LinearLayout(this);
        LinearLayout row2 = new LinearLayout(this);
        main.addView(row1, new LinearLayout.LayoutParams(-1, dp(80)));
        main.addView(row2, new LinearLayout.LayoutParams(-1, dp(80)));
        quick(row1, "ذكرني\nبشرب الماء", "تم يا هشام، حفظت مهمة شرب الماء.", "task");
        quick(row1, "ما مهامي\nاليوم؟", "عندك " + tasks + " مهام محفوظة حاليًا.", "readTasks");
        quick(row2, "أضف دراسة\nالساعة 8", "تم يا هشام، حفظت موعد الدراسة الساعة 8.", "task");
        quick(row2, "سجل مصروف\n200 ريال", "تم يا هشام، سجلت مصروف 200 ريال.", "finance");

        Button listen = bigButton("اختبار صوت ليا   ▶");
        main.addView(listen, new LinearLayout.LayoutParams(-1, dp(66)));
        listen.setOnClickListener(v -> reply("أنا ليا يا هشام. هذه نسخة تطبيق Android أصلية وليست صفحة ويب."));

        LinearLayout bottom = new LinearLayout(this);
        bottom.setGravity(Gravity.CENTER);
        bottom.setPadding(0, dp(10), 0, 0);
        main.addView(bottom, new LinearLayout.LayoutParams(-1, dp(64)));
        Button keyboard = round("⌨", 22);
        Button settings = round("☷", 22);
        bottom.addView(keyboard, new LinearLayout.LayoutParams(dp(54), dp(54)));
        View space = new View(this);
        bottom.addView(space, new LinearLayout.LayoutParams(dp(32), 1));
        bottom.addView(settings, new LinearLayout.LayoutParams(dp(54), dp(54)));
        keyboard.setOnClickListener(v -> reply("الكتابة الاختيارية سنضيفها في الخطوة التالية."));
        settings.setOnClickListener(v -> reply("إعدادات التطبيق الأصلية ستضاف بعد تثبيت هذه النسخة."));

        buildDrawer();
    }

    private void quick(LinearLayout row, String label, String message, String type) {
        Button b = new Button(this);
        b.setText(label);
        b.setTextSize(14);
        b.setTextColor(Color.WHITE);
        b.setAllCaps(false);
        b.setGravity(Gravity.CENTER);
        b.setBackground(glass(dp(18)));
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(0, -1, 1);
        lp.setMargins(dp(4), dp(4), dp(4), dp(4));
        row.addView(b, lp);
        b.setOnClickListener(v -> {
            if ("task".equals(type)) tasks++;
            if ("finance".equals(type)) finance++;
            if ("readTasks".equals(type)) message = "عندك " + tasks + " مهام محفوظة حاليًا.";
            updateCounts();
            reply(message);
        });
    }

    private void buildDrawer() {
        shade = new View(this);
        shade.setBackgroundColor(Color.argb(115, 0, 0, 0));
        shade.setVisibility(View.GONE);
        root.addView(shade, new FrameLayout.LayoutParams(-1, -1));
        shade.setOnClickListener(v -> closeDrawer());

        drawer = new LinearLayout(this);
        drawer.setOrientation(LinearLayout.VERTICAL);
        drawer.setPadding(dp(14), dp(18), dp(14), dp(14));
        drawer.setBackground(drawerBg());
        FrameLayout.LayoutParams lp = new FrameLayout.LayoutParams(dp(292), -1);
        lp.gravity = Gravity.LEFT;
        lp.setMargins(dp(10), dp(10), 0, dp(10));
        root.addView(drawer, lp);
        drawer.setTranslationX(-dp(320));

        TextView brand = text("lia.ai", 30, true, Color.WHITE);
        brand.setGravity(Gravity.LEFT | Gravity.CENTER_VERTICAL);
        drawer.addView(brand, new LinearLayout.LayoutParams(-1, dp(58)));

        ScrollView scroll = new ScrollView(this);
        LinearLayout nav = new LinearLayout(this);
        nav.setOrientation(LinearLayout.VERTICAL);
        scroll.addView(nav);
        drawer.addView(scroll, new LinearLayout.LayoutParams(-1, 0, 1));

        tasksView = navBadge(nav, "☑  المهام");
        memoryView = navBadge(nav, "▤  المذكرات");
        navItem(nav, "♧  التذكيرات");
        navItem(nav, "▣  المواعيد");
        financeView = navBadge(nav, "▰  الديون والمالية");
        navItem(nav, "▣  صلاحيات الوصول");
        navItem(nav, "⚙  الإعدادات");

        TextView profile = text("هشام\nالمستوى الماسي\n━━━━━━━", 15, false, Color.WHITE);
        profile.setGravity(Gravity.RIGHT | Gravity.CENTER_VERTICAL);
        profile.setPadding(dp(12), 0, dp(12), 0);
        profile.setBackground(glass(dp(22)));
        drawer.addView(profile, new LinearLayout.LayoutParams(-1, dp(92)));
        updateCounts();
    }

    private TextView navBadge(LinearLayout nav, String label) {
        LinearLayout row = new LinearLayout(this);
        row.setGravity(Gravity.CENTER_VERTICAL);
        row.setPadding(dp(10), 0, dp(10), 0);
        row.setBackground(glass(dp(17)));
        TextView t = new TextView(this);
        t.setText(label);
        t.setTextColor(Color.WHITE);
        t.setTextSize(15);
        row.addView(t, new LinearLayout.LayoutParams(0, dp(48), 1));
        TextView badge = new TextView(this);
        badge.setGravity(Gravity.CENTER);
        badge.setTextColor(Color.WHITE);
        badge.setTextSize(12);
        badge.setBackground(glass(dp(14)));
        row.addView(badge, new LinearLayout.LayoutParams(dp(30), dp(30)));
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(-1, dp(50));
        lp.setMargins(0, dp(4), 0, dp(4));
        nav.addView(row, lp);
        row.setOnClickListener(v -> closeDrawer());
        return badge;
    }

    private void navItem(LinearLayout nav, String label) {
        TextView t = text(label, 15, false, Color.WHITE);
        t.setGravity(Gravity.RIGHT | Gravity.CENTER_VERTICAL);
        t.setPadding(dp(12), 0, dp(12), 0);
        t.setBackground(glass(dp(17)));
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(-1, dp(50));
        lp.setMargins(0, dp(4), 0, dp(4));
        nav.addView(t, lp);
        t.setOnClickListener(v -> closeDrawer());
    }

    private void updateCounts() {
        if (tasksView != null) tasksView.setText(String.valueOf(tasks));
        if (financeView != null) financeView.setText(String.valueOf(finance));
        if (memoryView != null) memoryView.setText(String.valueOf(memory));
    }

    private void reply(String msg) {
        status.setText(msg);
        orb.setSpeaking(true);
        if (tts != null) tts.speak(msg, TextToSpeech.QUEUE_FLUSH, null, "lia");
        root.postDelayed(() -> orb.setSpeaking(false), Math.max(1800, msg.length() * 80L));
    }

    private void toggleDrawer() { if (drawer.getTranslationX() < 0) openDrawer(); else closeDrawer(); }
    private void openDrawer() { shade.setVisibility(View.VISIBLE); drawer.animate().translationX(0).setDuration(220).start(); }
    private void closeDrawer() { drawer.animate().translationX(-dp(320)).setDuration(220).start(); shade.setVisibility(View.GONE); }

    private TextView text(String s, int size, boolean bold, int color) {
        TextView t = new TextView(this);
        t.setText(s);
        t.setTextSize(size);
        t.setTextColor(color);
        t.setGravity(Gravity.CENTER);
        if (bold) t.setTypeface(null, 1);
        return t;
    }

    private Button round(String s, int size) {
        Button b = new Button(this);
        b.setText(s);
        b.setTextSize(size);
        b.setTextColor(Color.WHITE);
        b.setAllCaps(false);
        b.setBackground(glass(dp(18)));
        return b;
    }

    private Button bigButton(String s) {
        Button b = new Button(this);
        b.setText(s);
        b.setTextSize(21);
        b.setTextColor(Color.WHITE);
        b.setTypeface(null, 1);
        b.setAllCaps(false);
        b.setBackground(neon(dp(28)));
        return b;
    }

    private android.graphics.drawable.Drawable glass(int radius) {
        android.graphics.drawable.GradientDrawable gd = new android.graphics.drawable.GradientDrawable();
        gd.setCornerRadius(radius);
        gd.setColor(Color.argb(24,255,255,255));
        gd.setStroke(1, Color.argb(38,255,255,255));
        return gd;
    }

    private android.graphics.drawable.Drawable neon(int radius) {
        android.graphics.drawable.GradientDrawable gd = new android.graphics.drawable.GradientDrawable(android.graphics.drawable.GradientDrawable.Orientation.LEFT_RIGHT, new int[]{Color.parseColor("#22E8FF"), Color.parseColor("#774DFF"), Color.parseColor("#F040FF")});
        gd.setCornerRadius(radius);
        return gd;
    }

    private android.graphics.drawable.Drawable drawerBg() {
        android.graphics.drawable.GradientDrawable gd = new android.graphics.drawable.GradientDrawable(android.graphics.drawable.GradientDrawable.Orientation.TOP_BOTTOM, new int[]{Color.rgb(8,19,50), Color.rgb(2,9,27)});
        gd.setCornerRadius(dp(28));
        gd.setStroke(1, Color.argb(42,255,255,255));
        return gd;
    }

    private int dp(int v) { return (int)(v * getResources().getDisplayMetrics().density + .5f); }

    @Override protected void onDestroy() {
        super.onDestroy();
        if (tts != null) { tts.stop(); tts.shutdown(); }
    }

    public static class NeonBg extends android.graphics.drawable.Drawable {
        Paint p = new Paint(1);
        @Override public void draw(Canvas c) {
            int w = getBounds().width(), h = getBounds().height();
            p.setShader(new LinearGradient(0,0,w,h,Color.rgb(2,2,10),Color.rgb(17,5,38),Shader.TileMode.CLAMP));
            c.drawRect(0,0,w,h,p);
            p.setShader(new RadialGradient(w*.5f,h*.12f,w*.55f,Color.argb(55,34,232,255),Color.TRANSPARENT,Shader.TileMode.CLAMP));
            c.drawCircle(w*.5f,h*.12f,w*.55f,p);
            p.setShader(new RadialGradient(w*.82f,h*.76f,w*.55f,Color.argb(48,240,64,255),Color.TRANSPARENT,Shader.TileMode.CLAMP));
            c.drawCircle(w*.82f,h*.76f,w*.55f,p);
            p.setShader(null);
        }
        @Override public void setAlpha(int alpha){p.setAlpha(alpha);} @Override public void setColorFilter(android.graphics.ColorFilter f){p.setColorFilter(f);} @Override public int getOpacity(){return android.graphics.PixelFormat.OPAQUE;}
    }

    public class VoiceOrb extends View {
        Paint p = new Paint(1); boolean speaking = false;
        public VoiceOrb(Activity a){super(a);} void setSpeaking(boolean s){speaking=s;invalidate();}
        @Override protected void onDraw(Canvas c){
            int w=getWidth(),h=getHeight(); float cx=w/2f,cy=h/2f,r=Math.min(w,h)*.30f;
            p.setStyle(Paint.Style.STROKE); p.setStrokeWidth(dp(1)); p.setColor(Color.argb(42,34,232,255));
            for(int i=0;i<5;i++) c.drawCircle(cx,cy,r+dp(24*i),p);
            p.setStrokeWidth(dp(3)); p.setShader(new LinearGradient(cx-r,cy-r,cx+r,cy+r,Color.parseColor("#22E8FF"),Color.parseColor("#F040FF"),Shader.TileMode.CLAMP)); drawWave(c,cx,cy,r+dp(18)); p.setShader(null);
            p.setStyle(Paint.Style.FILL); p.setShader(new RadialGradient(cx,cy,r*1.15f,new int[]{Color.rgb(8,10,38),Color.rgb(9,7,35),Color.rgb(60,20,80)},null,Shader.TileMode.CLAMP)); c.drawCircle(cx,cy,r,p); p.setShader(null);
            p.setStyle(Paint.Style.STROKE); p.setStrokeWidth(dp(3)); p.setShader(new LinearGradient(cx-r,cy-r,cx+r,cy+r,Color.parseColor("#22E8FF"),Color.parseColor("#F040FF"),Shader.TileMode.CLAMP)); c.drawCircle(cx,cy,r,p); p.setShader(null);
            drawLogo(c,cx,cy,r*.48f); if(speaking) postInvalidateDelayed(80);
        }
        void drawWave(Canvas c,float cx,float cy,float radius){Path wave=new Path();float amp=dp(speaking?18:8);wave.moveTo(cx-radius*1.55f,cy);for(int i=0;i<=80;i++){float x=cx-radius*1.55f+(radius*3.1f)*i/80f;float y=cy+(float)Math.sin(i*.55f+System.currentTimeMillis()/160.0)*amp*(i%3==0?1.4f:.8f);wave.lineTo(x,y);}c.drawPath(wave,p);} 
        void drawLogo(Canvas c,float cx,float cy,float s){p.setStyle(Paint.Style.STROKE);p.setStrokeCap(Paint.Cap.ROUND);p.setStrokeJoin(Paint.Join.ROUND);p.setStrokeWidth(s*.23f);p.setShader(new LinearGradient(cx-s,cy-s,cx+s,cy+s,Color.parseColor("#16F5EF"),Color.parseColor("#F040FF"),Shader.TileMode.CLAMP));Path path=new Path();path.moveTo(cx-s*.75f,cy-s*.85f);path.lineTo(cx-s*.75f,cy+s*.25f);RectF oval=new RectF(cx-s*.45f,cy-s*.15f,cx+s*.85f,cy+s*.65f);path.arcTo(oval,195,225);c.drawPath(path,p);p.setStyle(Paint.Style.FILL);c.drawCircle(cx+s*.55f,cy-s*.92f,s*.15f,p);p.setShader(null);} 
    }
}
