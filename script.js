let sciData = {};
let currentMainType = 'convergent';
let currentSubType = 'ocean-cont';
let isPlaying = true;
let simSpeed = 1.0;
let progress = 0;

// متغيرات Three.js للمجسم ثلاثي الأبعاد
let scene, camera, renderer, controls;
let plateLeftGroup, plateRightGroup, magmaMesh, mountainMesh;

// 1. تحميل البيانات من data.json
async function initData() {
    try {
        const res = await fetch('data.json');
        sciData = await res.json();
        updateScientificText();
    } catch (err) {
        console.error('خطأ في تحميل ملف البيانات:', err);
    }
}

function updateScientificText() {
    const key = currentMainType === 'convergent' ? currentSubType : currentMainType;
    const item = sciData[key];
    if (!item) return;

    document.getElementById('sci-title').innerText = item.title;
    document.getElementById('sci-en-tag').innerText = item.enTag;
    document.getElementById('sci-desc').innerText = item.description;
    document.getElementById('sci-phenomena').innerText = item.phenomena;
}

// 2. بناء المشهد ثلاثي الأبعاد
function init3DScene() {
    const container = document.getElementById('three-container');
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050811);

    camera = new THREE.PerspectiveCamera(42, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 4.8, 9.5);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // أدوات التدوير والتكبير
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 4;
    controls.maxDistance = 18;

    // الإضاءة
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(6, 10, 7);
    scene.add(dirLight);

    const magmaLight = new THREE.PointLight(0xff5500, 1.5, 12);
    magmaLight.position.set(0, -1.5, 0);
    scene.add(magmaLight);

    // طبقة الغلاف الموري / الوشاح السفلية (Asthenosphere)
    const mantleGeo = new THREE.BoxGeometry(11, 1.8, 4.2);
    const mantleMat = new THREE.MeshStandardMaterial({
        color: 0xd9480f,
        emissive: 0x7c2d12,
        roughness: 0.7
    });
    const mantleMesh = new THREE.Mesh(mantleGeo, mantleMat);
    mantleMesh.position.y = -1.6;
    scene.add(mantleMesh);

    // عمود الصهارة الصاعدة (للحركة التباعدية)
    const magmaGeo = new THREE.BoxGeometry(0.9, 2.2, 4.05);
    const magmaMat = new THREE.MeshStandardMaterial({
        color: 0xff3b00,
        emissive: 0xea580c,
        emissiveIntensity: 0.8
    });
    magmaMesh = new THREE.Mesh(magmaGeo, magmaMat);
    magmaMesh.position.set(0, -0.8, 0);
    magmaMesh.visible = false;
    scene.add(magmaMesh);

    // إنشاء الصفيحتين التكتونيتين
    plateLeftGroup = new THREE.Group();
    plateRightGroup = new THREE.Group();
    scene.add(plateLeftGroup);
    scene.add(plateRightGroup);

    buildPlatesGeometry();

    window.addEventListener('resize', () => {
        if (!container) return;
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });

    animate();
}

// بناء هندسة الصفائح حسب النوع المختار
function buildPlatesGeometry() {
    plateLeftGroup.clear();
    plateRightGroup.clear();
    progress = 0;

    // خامات الطبقات
    const lithoMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 });
    const oceanMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 });
    const waterMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, transparent: true, opacity: 0.65 });
    const contMat = new THREE.MeshStandardMaterial({ color: 0x785549, roughness: 0.9 });

    const activeMode = currentMainType === 'convergent' ? currentSubType : currentMainType;

    // بناء الصفيحة اليسرى
    const leftLitho = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.7, 4), lithoMat);
    leftLitho.position.y = -0.35;
    plateLeftGroup.add(leftLitho);

    if (activeMode === 'cont-cont') {
        const leftCrust = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.55, 4), contMat);
        leftCrust.position.y = 0.25;
        plateLeftGroup.add(leftCrust);
    } else {
        // قشرة محيطية + مياه محيط
        const leftOcean = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.3, 4), oceanMat);
        leftOcean.position.y = 0.15;
        const leftWater = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.25, 4), waterMat);
        leftWater.position.y = 0.42;
        plateLeftGroup.add(leftOcean, leftWater);
    }

    // بناء الصفيحة اليمنى
    const rightLitho = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.7, 4), lithoMat);
    rightLitho.position.y = -0.35;
    plateRightGroup.add(rightLitho);

    if (activeMode === 'ocean-cont' || activeMode === 'cont-cont') {
        const rightCrust = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.55, 4), contMat);
        rightCrust.position.y = 0.25;
        plateRightGroup.add(rightCrust);
    } else {
        const rightOcean = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.3, 4), oceanMat);
        rightOcean.position.y = 0.15;
        const rightWater = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.25, 4), waterMat);
        rightWater.position.y = 0.42;
        plateRightGroup.add(rightOcean, rightWater);
    }

    // سلسلة جبلية تنمو في حالة التصادم القاري أو الاندساس
    const mtnGeo = new THREE.ConeGeometry(0.9, 1.3, 5);
    const mtnMat = new THREE.MeshStandardMaterial({ color: 0x57534e, roughness: 0.95 });
    mountainMesh = new THREE.Mesh(mtnGeo, mtnMat);
    mountainMesh.position.set(-1.5, 0.5, 0);
    mountainMesh.scale.set(1, 0.01, 2.2);
    mountainMesh.visible = (activeMode === 'ocean-cont' || activeMode === 'cont-cont');
    plateRightGroup.add(mountainMesh);

    // ضبط المواقع الابتدائية
    plateLeftGroup.position.set(-2.25, 0, 0);
    plateLeftGroup.rotation.set(0, 0, 0);
    plateRightGroup.position.set(2.25, 0, 0);
    plateRightGroup.rotation.set(0, 0, 0);

    magmaMesh.visible = (activeMode === 'divergent');
}

// 3. حلقة التحريك الفيزيائي المستمر
function animate() {
    requestAnimationFrame(animate);

    if (isPlaying) {
        progress += 0.004 * simSpeed;
        if (progress > 1) progress = 0; // إعادة الدورة بسلاسة

        const activeMode = currentMainType === 'convergent' ? currentSubType : currentMainType;

        if (activeMode === 'ocean-cont' || activeMode === 'ocean-ocean') {
            // اندساس الصفيحة اليسرى تحت اليمنى
            plateLeftGroup.position.x = -2.25 + progress * 1.1;
            plateLeftGroup.position.y = -progress * 0.75;
            plateLeftGroup.rotation.z = -progress * 0.28;

            plateRightGroup.position.x = 2.25 - progress * 0.3;
            if (mountainMesh) mountainMesh.scale.y = 0.1 + progress * 0.9;

        } else if (activeMode === 'cont-cont') {
            // تصادم قاري وتكوّن الجبال
            plateLeftGroup.position.x = -2.25 + progress * 0.55;
            plateRightGroup.position.x = 2.25 - progress * 0.55;
            if (mountainMesh) {
                mountainMesh.position.x = -2.1;
                mountainMesh.scale.y = 0.1 + progress * 1.35;
            }

        } else if (activeMode === 'divergent') {
            // تباعد الصفائح وصعود الصهارة
            plateLeftGroup.position.x = -2.25 - progress * 0.95;
            plateRightGroup.position.x = 2.25 + progress * 0.95;
            magmaMesh.scale.x = 0.4 + progress * 2.1;
            magmaMesh.position.y = -1.1 + progress * 0.85;

        } else if (activeMode === 'transform') {
            // انزلاق أفقي متعاكس مع اهتزاز زلزالي خفيف
            const slide = Math.sin(progress * Math.PI * 2) * 0.85;
            const tremor = (Math.random() - 0.5) * 0.03 * simSpeed;
            plateLeftGroup.position.z = slide + tremor;
            plateRightGroup.position.z = -slide - tremor;
        }
    }

    controls.update();
    renderer.render(scene, camera);
}

// 4. ربط أزرار الواجهة
document.addEventListener('DOMContentLoaded', () => {
    initData();
    init3DScene();

    // أزرار الحدود الرئيسية
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentMainType = btn.dataset.type;

            const subBar = document.getElementById('sub-modes');
            if (currentMainType === 'convergent') {
                subBar.classList.remove('hidden');
            } else {
                subBar.classList.add('hidden');
            }

            buildPlatesGeometry();
            updateScientificText();
        });
    });

    // أزرار الحالات الفرعية للحدود التقاربية
    document.querySelectorAll('.sub-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.sub-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentSubType = btn.dataset.sub;

            buildPlatesGeometry();
            updateScientificText();
        });
    });

    // زر التشغيل والإيقاف
    const playPauseBtn = document.getElementById('btn-play-pause');
    playPauseBtn.addEventListener('click', () => {
        isPlaying = !isPlaying;
        playPauseBtn.innerText = isPlaying ? '⏸ إيقاف مؤقت' : '▶️ تشغيل المحاكاة';
    });

    // زر إعادة التجربة
    document.getElementById('btn-reset').addEventListener('click', () => {
        progress = 0;
        buildPlatesGeometry();
    });

    // شريط السرعة
    const speedSlider = document.getElementById('speed-slider');
    const speedVal = document.getElementById('speed-val');
    speedSlider.addEventListener('input', (e) => {
        simSpeed = parseFloat(e.target.value);
        speedVal.innerText = simSpeed.toFixed(1) + 'x';
    });
});
