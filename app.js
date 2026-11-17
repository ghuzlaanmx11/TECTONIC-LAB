// ==========================================
// 1. إعداد المشهد والكاميرا بأعلى أداء (60 FPS)
// ==========================================
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x070b14, 0.035); // ضباب عمق لإعطاء واقعية

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 6.5, 13);

const renderer = new THREE.WebGLRenderer({ 
    antialias: true, 
    powerPreference: "high-performance" // إجبار المتصفح على استخدام كرت الشاشة القوي
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // منع استهلاك الذاكرة في الشاشات فائقة الدقة
container.appendChild(renderer.domElement);

// تفعيل التحكم بالماوس (تدوير وتقريب)
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI / 2.1; // منع الكاميرا من النزول أسفل الأرض
controls.minDistance = 6;
controls.maxDistance = 22;

// ==========================================
// 2. الإضاءة الواقعية
// ==========================================
const ambientLight = new THREE.AmbientLight(0x94a3b8, 0.7);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.1);
dirLight.position.set(8, 15, 10);
scene.add(dirLight);

// إضاءة برتقالية سفلية تحاكي وهج الماغما على الصفائح
const magmaLight = new THREE.PointLight(0xff5500, 2.5, 12);
magmaLight.position.set(0, -0.5, 0);
scene.add(magmaLight);

// ==========================================
// 3. برمجة الماغما بلغة GLSL (تعمل على كرت الشاشة بدون أي Lag)
// ==========================================
const magmaUniforms = {
    uTime: { value: 0 }
};

const magmaMaterial = new THREE.ShaderMaterial({
    uniforms: magmaUniforms,
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform float uTime;
        varying vec2 vUv;
        void main() {
            // معادلة موجية لمحاكاة تدفق الصهارة المنصهرة
            float wave1 = sin(vUv.x * 12.0 + uTime * 2.0) * cos(vUv.y * 12.0 - uTime * 1.5);
            float wave2 = sin((vUv.x + vUv.y) * 20.0 - uTime * 3.0) * 0.5;
            float heat = smoothstep(-0.8, 1.0, wave1 + wave2);
            
            vec3 darkRock = vec3(0.35, 0.05, 0.0);
            vec3 brightLava = vec3(1.0, 0.45, 0.05);
            vec3 color = mix(darkRock, brightLava, heat);
            
            gl_FragColor = vec4(color, 1.0);
        }
    `
});

// بناء طبقة الوشاح المنصهرة
const mantleGeo = new THREE.BoxGeometry(12, 1.8, 5);
const mantle = new THREE.Mesh(mantleGeo, magmaMaterial);
mantle.position.y = -1.1;
scene.add(mantle);

// ==========================================
// 4. بناء الصفائح التكتونية والتضاريس الجبلية
// ==========================================
function createTectonicPlate(colorHex, xPos) {
    const group = new THREE.Group();
    
    // جسم الصفيحة الصخري
    const geo = new THREE.BoxGeometry(4.8, 1.1, 4.8);
    const mat = new THREE.MeshStandardMaterial({ 
        color: colorHex, 
        roughness: 0.85,
        metalness: 0.1
    });
    const mesh = new THREE.Mesh(geo, mat);
    group.add(mesh);

    // طبقة القشرة العلوية
    const crustGeo = new THREE.BoxGeometry(4.82, 0.2, 4.82);
    const crustMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
    const crust = new THREE.Mesh(crustGeo, crustMat);
    crust.position.y = 0.55;
    group.add(crust);

    group.position.set(xPos, 0.25, 0);
    scene.add(group);
    return group;
}

const plateLeft = createTectonicPlate(0x334155, -2.45);
const plateRight = createTectonicPlate(0x475569, 2.45);

// بناء سلسلة جبلية تظهر عند الحركة التقاربية
const mountains = new THREE.Group();
const mountainMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9, flatShading: true });

for (let i = 0; i < 7; i++) {
    const coneGeo = new THREE.ConeGeometry(0.45 + Math.random() * 0.3, 1.2 + Math.random() * 0.6, 5);
    const peak = new THREE.Mesh(coneGeo, mountainMat);
    peak.position.set(-1.3 + (Math.random() * 0.4), 0.8, -1.8 + (i * 0.6));
    mountains.add(peak);
}
mountains.scale.set(1, 0.01, 1); // مخفية في البداية
plateLeft.add(mountains);

// ==========================================
// 5. قاعدة البيانات العلمية وإدارة التفاعل
// ==========================================
const scientificData = {
    divergent: {
        title: "الحركة التباعدية (انتشار قاع المحيط)",
        desc: "تتباعد الصفيحتان التكتونيتان نتيجة تيارات الحمل الصاعدة في الوشاح، مما يسمح للماغما بالصعود والتصلب لتكوين قشرة محيطية جديدة وسلاسل جبلية وسط المحيط.",
        tags: ["صعود الماغما", "حيد وسط المحيط", "قشرة محيطية جديدة"]
    },
    convergent: {
        title: "الحركة التقاربية والاندساس (Subduction)",
        desc: "تتصادم الصفيحتان وتغوص الصفيحة الأكثر كثافة أسفل الصفيحة الأقل كثافة نحو الوشاح، مما يؤدي إلى انصهارها وتكوّن السلاسل الجبلية والنشاط البركاني.",
        tags: ["منطقة الاندساس", "تكون الجبال", "أخاديد محيطية"]
    },
    transform: {
        title: "الانزلاق التحويلي (Transform Fault)",
        desc: "تتحرك الصفيحتان أفقياً بمحاذاة بعضهما في اتجاهين متعاكسين دون تكوين أو تدمير للقشرة، ويسبب الاحتكاك الشديد بينهما طاقة زلزالية عالية.",
        tags: ["صدوع تحويلية", "نشاط زلزالي", "احتكاك صخري"]
    }
};

let currentMode = 'divergent';
let simSpeed = 1.0;
let simTime = 0;

// ربط أزرار الواجهة
document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        currentMode = btn.dataset.mode;
        simTime = 0;

        // إعادة ضبط المواقع والزوايا
        plateLeft.position.set(-2.45, 0.25, 0);
        plateRight.position.set(2.45, 0.25, 0);
        plateLeft.rotation.set(0, 0, 0);
        plateRight.rotation.set(0, 0, 0);
        mountains.scale.set(1, 0.01, 1);

        // تحديث النصوص العلمية
        const data = scientificData[currentMode];
        document.getElementById('sci-title').innerText = data.title;
        document.getElementById('sci-desc').innerText = data.desc;
        document.getElementById('sci-tags').innerHTML = data.tags.map(t => `<span>${t}</span>`).join('');
    });
});

// ربط شريط التحكم بالسرعة
const speedSlider = document.getElementById('speed-slider');
const speedVal = document.getElementById('speed-val');
speedSlider.addEventListener('input', (e) => {
    simSpeed = parseFloat(e.target.value);
    speedVal.innerText = simSpeed.toFixed(1) + 'x';
});

// ==========================================
// 6. حلقة المحاكاة الرئيسية (Animation Loop)
// ==========================================
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    magmaUniforms.uTime.value += delta; // تحديث حركة الماغما دائماً
    simTime += delta * simSpeed;

    // موجة ناعمة تتراوح بين 0 و 1
    const progress = (Math.sin(simTime * 1.2 - Math.PI / 2) + 1) / 2;

    if (currentMode === 'divergent') {
        plateLeft.position.x = -2.45 - (progress * 1.3);
        plateRight.position.x = 2.45 + (progress * 1.3);
        magmaLight.intensity = 2.0 + (progress * 2.5);
    } 
    else if (currentMode === 'convergent') {
        plateLeft.position.x = -2.45 + (progress * 0.4);
        plateRight.position.x = 2.45 - (progress * 1.1);
        plateRight.position.y = 0.25 - (progress * 0.85);
        plateRight.rotation.z = progress * 0.32; // زاوية الاندساس
        
        // نمو الجبال تدريجياً مع التصادم
        mountains.scale.y = Math.max(0.01, progress * 1.2);
    } 
    else if (currentMode === 'transform') {
        plateLeft.position.z = (progress * 1.8) - 0.9;
        plateRight.position.z = -(progress * 1.8) + 0.9;
        
        // اهتزاز زلزالي خفيف عند الاحتكاك
        const quake = Math.sin(simTime * 45) * 0.025 * simSpeed;
        plateLeft.position.x = -2.45 + quake;
        plateRight.position.x = 2.45 - quake;
    }

    controls.update();
    renderer.render(scene, camera);
}

// استجابة سلسة لتغيير حجم الشاشة
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
