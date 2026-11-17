// مخزن البيانات العلمية عند جلبها من ملف JSON
let tectonicData = {};

// 1. جلب البيانات من ملف data.json عند فتح الموقع
async function loadTectonicData() {
    try {
        const response = await fetch('data.json');
        if (!response.ok) throw new Error('تعذر الوصول إلى ملف البيانات');
        
        tectonicData = await response.json();
        
        // تفعيل الوضع الافتراضي فور تحميل البيانات
        updateSimulationMode('divergent');
    } catch (error) {
        console.error("خطأ في تحميل البيانات:", error);
    }
}

// 2. تحديث النصوص والرسومات المتجهة (SVG) عند اختيار نوع الحركة
function updateSimulationMode(mode) {
    const data = tectonicData[mode];
    if (!data) return;

    // تحديث النصوص في البطاقة العلمية
    const titleElement = document.getElementById('sci-title');
    const descElement = document.getElementById('sci-desc');
    
    if (titleElement) titleElement.innerText = data.title;
    if (descElement) descElement.innerText = data.description;

    // تحديث حالة الأزرار (تفعيل الزر المختار)
    document.querySelectorAll('.control-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-mode') === mode) {
            btn.classList.add('active');
        }
    });

    // تفاعل ديناميكي مع رسومات الـ SVG حسب نوع الحركة
    updateSvgVisuals(mode);
}

// 3. التحكم بألوان ونبض رسومات الـ SVG في الخلفية
function updateSvgVisuals(mode) {
    const svgCircles = document.querySelectorAll('#canvas-container svg circle');
    const svgPaths = document.querySelectorAll('#canvas-container svg path');
    
    // تحديد اللون المناسب لكل حركة تكتونية
    const modeColors = {
        divergent: '#38bdf8',   // أزرق سماوي (تباعد وتكون قشرة)
        convergent: '#f43f5e',  // أحمر بركاني (تصادم واندساس)
        transform: '#fbbf24'    // أصفر تحذيري (احتكاك وزلازل)
    };

    const activeColor = modeColors[mode] || '#38bdf8';

    // تغيير ألوان الدوائر التفاعلية في الـ SVG
    svgCircles.forEach(circle => {
        if (circle.getAttribute('fill') !== 'none') {
            circle.setAttribute('fill', activeColor);
        }
        if (circle.getAttribute('stroke')) {
            circle.setAttribute('stroke', activeColor);
        }
    });

    // تحديث لون مسارات الصفائح
    if (svgPaths.length > 0) {
        svgPaths[0].setAttribute('stroke', activeColor);
    }
}

// 4. ربط الأحداث عند اكتمال تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    // بدء جلب البيانات
    loadTectonicData();

    // تفعيل الضغط على الأزرار
    document.querySelectorAll('.control-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const mode = e.currentTarget.getAttribute('data-mode');
            if (mode) {
                updateSimulationMode(mode);
            }
        });
    });
});
