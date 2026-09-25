// 3D Laboratory Apparatus Generator using Three.js

class Lab3DViewer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.currentModelGroup = null;
    this.currentModelType = 'mikroskop';
    this.animFrameId = null;
    this.hotspots = [];
    this.clock = new THREE.Clock();
    this.animatedObjects = {};
    this.isAutoRotate = false;
    this.isActionActive = false;

    if (this.container) {
      this.init();
    }
  }

  init() {
    // 1. Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a1128);

    // 2. Camera setup
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    this.camera.position.set(0, 5, 12);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    // 4. Controls
    if (THREE.OrbitControls) {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.maxDistance = 25;
      this.controls.minDistance = 2.5;
      this.controls.maxPolarAngle = Math.PI / 2 + 0.1;
    }

    // 5. Lighting
    this.setupLighting();

    // 6. Grid & Pedestal
    this.setupEnvironment();

    // 7. Load default model
    this.loadModel('mikroskop');

    // 8. Event listeners
    window.addEventListener('resize', () => this.onWindowResize());
    this.renderer.domElement.addEventListener('click', (e) => this.onCanvasClick(e));

    // 9. Start Loop
    this.animate();
  }

  setupLighting() {
    // Ambient Light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    this.scene.add(ambientLight);

    // Main Key Light
    const dirLight1 = new THREE.DirectionalLight(0x00f0ff, 1.3);
    dirLight1.position.set(5, 12, 7);
    dirLight1.castShadow = true;
    dirLight1.shadow.mapSize.width = 1024;
    dirLight1.shadow.mapSize.height = 1024;
    this.scene.add(dirLight1);

    // Fill Light (Warm Science Amber)
    const dirLight2 = new THREE.DirectionalLight(0xff9900, 0.6);
    dirLight2.position.set(-8, 6, -5);
    this.scene.add(dirLight2);

    // Point Glow Light in center
    const pointLight = new THREE.PointLight(0x38ef7d, 0.8, 15);
    pointLight.position.set(0, 3, 2);
    this.scene.add(pointLight);
  }

  setupEnvironment() {
    // Holographic Cyber Lab Floor Grid
    const gridHelper = new THREE.GridHelper(20, 20, 0x00f0ff, 0x1e3a8a);
    gridHelper.position.y = -2;
    this.scene.add(gridHelper);

    // Pedestal Platform
    const pedGeo = new THREE.CylinderGeometry(4.5, 5, 0.4, 32);
    const pedMat = new THREE.MeshStandardMaterial({
      color: 0x111c38,
      roughness: 0.3,
      metalness: 0.8,
      emissive: 0x071126
    });
    const pedestal = new THREE.Mesh(pedGeo, pedMat);
    pedestal.position.y = -2.2;
    pedestal.receiveShadow = true;
    this.scene.add(pedestal);

    // Glowing Ring around pedestal
    const ringGeo = new THREE.RingGeometry(4.4, 4.6, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -1.98;
    this.scene.add(ring);
  }

  loadModel(type) {
    this.currentModelType = type;
    this.isActionActive = false;
    this.animatedObjects = {};

    // Remove old model
    if (this.currentModelGroup) {
      this.scene.remove(this.currentModelGroup);
      this.currentModelGroup = null;
    }
    this.clearHotspots();

    const group = new THREE.Group();
    group.position.y = -2;

    switch (type) {
      case 'mikroskop':
        this.buildMicroscope(group);
        break;
      case 'bunsen':
        this.buildBunsenAndTripod(group);
        break;
      case 'gelas-kimia':
        this.buildBeakerAndPipette(group);
        break;
      case 'neraca':
      case 'neraca-ohaus':
        this.buildOhausBalance(group);
        break;
      case 'tabung-reaksi':
        this.buildTestTubeRack(group);
        break;
      case 'gelas-ukur':
        this.buildGraduatedCylinder(group);
        break;
      case 'erlenmeyer':
      case 'labu-erlenmeyer':
        this.buildErlenmeyer(group);
        break;
      case 'termometer':
      case 'termometer-lab':
        this.buildThermometer(group);
        break;
      case 'jangka-sorong':
        this.buildVernierCaliper(group);
        break;
      case 'lup':
        this.buildMagnifyingGlass(group);
        break;
      case 'cawan-petri':
        this.buildPetriDish(group);
        break;
      case 'kaki-tiga':
      case 'kawat-kasa':
        this.buildTripodAndGauze(group);
        break;
      case 'batang-pengaduk':
        this.buildStirringRod(group);
        break;
      case 'corong':
      case 'corong-kaca':
        this.buildFunnel(group);
        break;
      default:
        this.buildMicroscope(group);
    }

    this.currentModelGroup = group;
    this.scene.add(group);

    // Reset Camera
    this.camera.position.set(0, 4, 11);
    if (this.controls) {
      this.controls.target.set(0, 1.5, 0);
      this.controls.update();
    }

    // Render Hotspots in UI
    this.updateHotspotUI();
    this.updateActionButtonLabel();
  }

  // ================= 1. MODEL MIKROSKOP 3D =================
  buildMicroscope(group) {
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x2c3e50, metalness: 0.85, roughness: 0.25 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8f9fa, metalness: 0.3, roughness: 0.3 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xdfe6e9, metalness: 0.95, roughness: 0.1 });
    const blackMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 });
    const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x81ecec, transmission: 0.9, opacity: 1, transparent: true, roughness: 0.1, ior: 1.5 });

    // 1. Kaki Mikroskop
    const baseGeo = new THREE.BoxGeometry(3.2, 0.6, 3.8);
    const base = new THREE.Mesh(baseGeo, metalMat);
    base.position.set(0, 0.3, 0);
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    // 2. Pilar & Lengan Mikroskop
    const pillarGeo = new THREE.CylinderGeometry(0.5, 0.6, 2.5, 20);
    const pillar = new THREE.Mesh(pillarGeo, metalMat);
    pillar.position.set(0, 1.6, -1.2);
    group.add(pillar);

    const armCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 2.0, -1.2),
      new THREE.Vector3(0, 3.8, -1.5),
      new THREE.Vector3(0, 5.0, -0.8),
      new THREE.Vector3(0, 5.2, 0.0)
    ]);
    const armGeo = new THREE.TubeGeometry(armCurve, 20, 0.45, 12, false);
    const arm = new THREE.Mesh(armGeo, whiteMat);
    arm.castShadow = true;
    group.add(arm);

    // 3. Meja Preparat
    const stageGeo = new THREE.BoxGeometry(2.8, 0.2, 2.8);
    const stage = new THREE.Mesh(stageGeo, blackMat);
    stage.position.set(0, 2.8, 0.2);
    stage.castShadow = true;
    group.add(stage);

    const clip1 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.05, 1.2), chromeMat);
    clip1.position.set(-0.8, 2.93, 0.3);
    clip1.rotation.y = 0.2;
    group.add(clip1);
    const clip2 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.05, 1.2), chromeMat);
    clip2.position.set(0.8, 2.93, 0.3);
    clip2.rotation.y = -0.2;
    group.add(clip2);

    const slide = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.04, 0.8), glassMat);
    slide.position.set(0, 2.92, 0.2);
    group.add(slide);

    // 4. Tabung Mikroskop
    const tubeGeo = new THREE.CylinderGeometry(0.35, 0.35, 2.6, 20);
    const tube = new THREE.Mesh(tubeGeo, whiteMat);
    tube.position.set(0, 5.2, 0.4);
    tube.rotation.x = -0.15;
    group.add(tube);

    // 5. Lensa Okuler
    const eyepieceGeo = new THREE.CylinderGeometry(0.3, 0.38, 0.8, 20);
    const eyepiece = new THREE.Mesh(eyepieceGeo, blackMat);
    eyepiece.position.set(0, 6.4, 0.2);
    eyepiece.rotation.x = -0.15;
    group.add(eyepiece);

    const eyeGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.05, 16), glassMat);
    eyeGlass.position.set(0, 6.8, 0.15);
    group.add(eyeGlass);

    // 6. Revolver
    const nosepieceGroup = new THREE.Group();
    nosepieceGroup.position.set(0, 4.0, 0.58);
    const noseGeo = new THREE.CylinderGeometry(0.8, 0.5, 0.4, 20);
    const nose = new THREE.Mesh(noseGeo, chromeMat);
    nosepieceGroup.add(nose);

    const objLengths = [0.9, 1.2, 1.5];
    const objColors = [0xe74c3c, 0xf1c40f, 0x3498db];
    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3;
      const objGroup = new THREE.Group();
      objGroup.position.set(Math.sin(angle) * 0.45, -0.2, Math.cos(angle) * 0.45);

      const objGeo = new THREE.CylinderGeometry(0.18, 0.12, objLengths[i], 16);
      const objMesh = new THREE.Mesh(objGeo, chromeMat);
      objMesh.position.y = -objLengths[i] / 2;
      objGroup.add(objMesh);

      const ringId = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.08, 16), new THREE.MeshBasicMaterial({ color: objColors[i] }));
      ringId.position.y = -objLengths[i] * 0.7;
      objGroup.add(ringId);

      nosepieceGroup.add(objGroup);
    }
    group.add(nosepieceGroup);
    this.animatedObjects.revolver = nosepieceGroup;

    // 7. Makrometer & Mikrometer
    const macroGeo = new THREE.CylinderGeometry(0.5, 0.5, 2.0, 20);
    const macroKnob = new THREE.Mesh(macroGeo, blackMat);
    macroKnob.rotation.z = Math.PI / 2;
    macroKnob.position.set(0, 3.4, -1.2);
    group.add(macroKnob);

    const microGeo = new THREE.CylinderGeometry(0.3, 0.3, 2.4, 20);
    const microKnob = new THREE.Mesh(microGeo, chromeMat);
    microKnob.rotation.z = Math.PI / 2;
    microKnob.position.set(0, 3.4, -1.2);
    group.add(microKnob);

    // 8. Cermin / Kondensor
    const mirrorGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.15, 20);
    const mirror = new THREE.Mesh(mirrorGeo, chromeMat);
    mirror.position.set(0, 1.4, 0.2);
    mirror.rotation.x = 0.5;
    group.add(mirror);

    this.hotspots = [
      { id: "h-okuler", name: "Lensa Okuler", pos: new THREE.Vector3(0, 6.6, 0.2), desc: "Terletak di ujung atas tabung, berfungsi memperbesar bayangan objek dari lensa objektif (perbesaran 5x, 10x, atau 16x) untuk dilihat mata pengamat." },
      { id: "h-revolver", name: "Revolver & Lensa Objektif", pos: new THREE.Vector3(0, 4.0, 0.9), desc: "Revolver dapat diputar untuk mengganti perbesaran lensa objektif (4x lemah, 10x sedang, 40x kuat, 100x minyak imersi) yang berada dekat preparat." },
      { id: "h-stage", name: "Meja Preparat & Penjepit", pos: new THREE.Vector3(0, 3.0, 1.2), desc: "Tempat meletakkan kaca objek preparat yang diamati, dilengkapi penjepit agar kaca tidak bergeser saat diamati." },
      { id: "h-knob", name: "Makrometer & Mikrometer", pos: new THREE.Vector3(1.3, 3.4, -1.2), desc: "Makrometer (pemutar besar) untuk menaik-turunkan tabung secara cepat mencari fokus awal, dan Mikrometer (pemutar kecil) untuk memperjelas ketajaman bayangan secara presisi." },
      { id: "h-cermin", name: "Kondensor & Sumber Cahaya", pos: new THREE.Vector3(0, 1.4, 0.6), desc: "Mengarahkan dan memfokuskan berkas cahaya dari lampu atau cermin agar menembus lubang diafragma dan menerangi preparat." }
    ];
  }

  // ================= 2. MODEL BUNSEN & KAKI TIGA 3D =================
  buildBunsenAndTripod(group) {
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.2 });
    const castIronMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.7, roughness: 0.6 });
    const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 0.92, transparent: true, roughness: 0.1 });
    const liquidMat = new THREE.MeshPhysicalMaterial({ color: 0x3498db, transmission: 0.8, transparent: true, roughness: 0.2 });

    // 1. Kaki Tiga
    const ringGeo = new THREE.TorusGeometry(1.8, 0.15, 12, 32);
    const topRing = new THREE.Mesh(ringGeo, castIronMat);
    topRing.rotation.x = Math.PI / 2;
    topRing.position.set(0, 3.5, 0);
    group.add(topRing);

    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3;
      const legGeo = new THREE.CylinderGeometry(0.12, 0.12, 3.6, 12);
      const leg = new THREE.Mesh(legGeo, castIronMat);
      leg.position.set(Math.sin(angle) * 1.6, 1.8, Math.cos(angle) * 1.6);
      leg.rotation.z = Math.sin(angle) * 0.15;
      leg.rotation.x = Math.cos(angle) * -0.15;
      leg.castShadow = true;
      group.add(leg);
    }

    // 2. Kawat Kasa Asbes
    const gauzeGeo = new THREE.BoxGeometry(3.2, 0.05, 3.2);
    const gauzeMat = new THREE.MeshStandardMaterial({ color: 0xbdc3c7, wireframe: true });
    const gauze = new THREE.Mesh(gauzeGeo, gauzeMat);
    gauze.position.set(0, 3.65, 0);
    group.add(gauze);

    const ceramicDisk = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.06, 24), new THREE.MeshStandardMaterial({ color: 0xecf0f1, roughness: 0.8 }));
    ceramicDisk.position.set(0, 3.66, 0);
    group.add(ceramicDisk);

    // 3. Pembakar Spiritus
    const burnerBase = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, 0.4, 24), brassMat);
    burnerBase.position.set(0, 0.2, 0);
    group.add(burnerBase);

    const burnerBody = new THREE.Mesh(new THREE.SphereGeometry(1.1, 24, 16), glassMat);
    burnerBody.scale.set(1, 0.8, 1);
    burnerBody.position.set(0, 1.0, 0);
    group.add(burnerBody);

    const burnerFluid = new THREE.Mesh(new THREE.SphereGeometry(0.95, 20, 12), new THREE.MeshBasicMaterial({ color: 0x9b59b6, transparent: true, opacity: 0.6 }));
    burnerFluid.scale.set(1, 0.6, 1);
    burnerFluid.position.set(0, 0.8, 0);
    group.add(burnerFluid);

    const burnerCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 0.6, 16), brassMat);
    burnerCollar.position.set(0, 1.8, 0);
    group.add(burnerCollar);

    const burnerWick = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.4, 12), new THREE.MeshStandardMaterial({ color: 0x333333 }));
    burnerWick.position.set(0, 2.1, 0);
    group.add(burnerWick);

    // 4. Api Animasi
    const flameGroup = new THREE.Group();
    flameGroup.position.set(0, 2.3, 0);

    const innerFlameGeo = new THREE.ConeGeometry(0.25, 1.0, 16);
    const innerFlameMat = new THREE.MeshBasicMaterial({ color: 0x00d2ff, transparent: true, opacity: 0.85 });
    const innerFlame = new THREE.Mesh(innerFlameGeo, innerFlameMat);
    innerFlame.position.y = 0.5;
    flameGroup.add(innerFlame);

    const outerFlameGeo = new THREE.ConeGeometry(0.4, 1.3, 16);
    const outerFlameMat = new THREE.MeshBasicMaterial({ color: 0xff7700, transparent: true, opacity: 0.7 });
    const outerFlame = new THREE.Mesh(outerFlameGeo, outerFlameMat);
    outerFlame.position.y = 0.65;
    flameGroup.add(outerFlame);

    const flameLight = new THREE.PointLight(0xff7700, 2, 8);
    flameLight.position.set(0, 0.8, 0);
    flameGroup.add(flameLight);

    group.add(flameGroup);
    this.animatedObjects.flame = flameGroup;

    // 5. Gelas Beaker di atas Kasa
    const beakerGeo = new THREE.CylinderGeometry(1.1, 1.0, 2.2, 24, 1, true);
    const beakerMesh = new THREE.Mesh(beakerGeo, glassMat);
    beakerMesh.position.set(0, 4.8, 0);
    group.add(beakerMesh);

    const liquidGeo = new THREE.CylinderGeometry(1.0, 0.95, 1.4, 20);
    const liquidMesh = new THREE.Mesh(liquidGeo, liquidMat);
    liquidMesh.position.set(0, 4.4, 0);
    group.add(liquidMesh);

    this.hotspots = [
      { id: "h-flame", name: "Nyala Api Spiritus", pos: new THREE.Vector3(0, 2.5, 0.6), desc: "Sumber panas laboratorium. Bagian api biru adalah zona paling panas (pembakaran sempurna). Matikan selalu dengan menutupnya!" },
      { id: "h-tripod", name: "Kaki Tiga & Kawat Kasa", pos: new THREE.Vector3(1.5, 3.6, 0), desc: "Kaki tiga menyangga wadah pemanasan, kawat kasa menyebarkan panas api secara merata agar gelas kaca tidak pecah mendadak." },
      { id: "h-beaker", name: "Gelas Kimia (Beaker)", pos: new THREE.Vector3(0, 5.2, 1.2), desc: "Wadah larutan kimia berbahan kaca borosilikat (Pyrex) tahan pemanasan langsung." }
    ];
  }

  // ================= 3. MODEL GELAS KIMIA & PIPET 3D =================
  buildBeakerAndPipette(group) {
    const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 0.92, transparent: true, roughness: 0.1, ior: 1.5 });
    const liquidMat = new THREE.MeshPhysicalMaterial({ color: 0x00cec9, transmission: 0.8, transparent: true, roughness: 0.1 });
    const rubberMat = new THREE.MeshStandardMaterial({ color: 0xd63031, roughness: 0.4 });

    // Beaker
    const beakerGeo = new THREE.CylinderGeometry(1.8, 1.7, 3.8, 32, 1, true);
    const beaker = new THREE.Mesh(beakerGeo, glassMat);
    beaker.position.set(-1.0, 1.9, 0);
    beaker.castShadow = true;
    group.add(beaker);

    const bottomGeo = new THREE.CylinderGeometry(1.7, 1.7, 0.15, 32);
    const bottom = new THREE.Mesh(bottomGeo, glassMat);
    bottom.position.set(-1.0, 0.1, 0);
    group.add(bottom);

    const fluidGeo = new THREE.CylinderGeometry(1.68, 1.65, 2.4, 32);
    const fluid = new THREE.Mesh(fluidGeo, liquidMat);
    fluid.position.set(-1.0, 1.3, 0);
    group.add(fluid);

    for (let i = 1; i <= 4; i++) {
      const line = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.03, 0.05), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      line.position.set(-1.0 + 1.65, 0.8 + i * 0.5, 0.4);
      group.add(line);
    }

    // Pipet Tetes
    const pipetteGroup = new THREE.Group();
    pipetteGroup.position.set(1.5, 3.6, 0.5);
    pipetteGroup.rotation.z = -0.2;

    const stemGeo = new THREE.CylinderGeometry(0.18, 0.18, 3.0, 16);
    const stem = new THREE.Mesh(stemGeo, glassMat);
    pipetteGroup.add(stem);

    const tipGeo = new THREE.CylinderGeometry(0.18, 0.05, 0.8, 16);
    const tip = new THREE.Mesh(tipGeo, glassMat);
    tip.position.y = -1.9;
    pipetteGroup.add(tip);

    const bulbGeo = new THREE.SphereGeometry(0.45, 16, 16);
    const bulb = new THREE.Mesh(bulbGeo, rubberMat);
    bulb.scale.set(1, 1.4, 1);
    bulb.position.y = 1.9;
    pipetteGroup.add(bulb);

    const innerFluid = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.6, 12), liquidMat);
    innerFluid.position.y = -0.5;
    pipetteGroup.add(innerFluid);

    const dropGeo = new THREE.SphereGeometry(0.1, 12, 12);
    const dropMesh = new THREE.Mesh(dropGeo, liquidMat);
    dropMesh.position.set(0, -2.4, 0);
    pipetteGroup.add(dropMesh);
    this.animatedObjects.droplet = dropMesh;

    group.add(pipetteGroup);
    this.animatedObjects.pipette = pipetteGroup;

    this.hotspots = [
      { id: "h-beaker", name: "Gelas Kimia (Beaker Glass)", pos: new THREE.Vector3(-1.0, 3.0, 1.8), desc: "Wadah untuk menampung, melarutkan, dan memanaskan bahan kimia. Memiliki cerat penuang agar larutan tidak tumpah." },
      { id: "h-pipette", name: "Pipet Tetes (Dropper)", pos: new THREE.Vector3(1.5, 4.5, 0.8), desc: "Mengambil larutan tetes demi tetes dengan cara memencet karet hisap di ujung atasnya. Selalu jaga posisi tetap tegak!" },
      { id: "h-scale", name: "Skala Volume Perkiraan", pos: new THREE.Vector3(0.7, 2.0, 0.6), desc: "Menunjukkan perkiraan volume larutan (bukan untuk pengukuran presisi tinggi, gunakan gelas ukur untuk presisi)." }
    ];
  }

  // ================= 4. MODEL NERACA OHAUS 3D =================
  buildOhausBalance(group) {
    const castIronMat = new THREE.MeshStandardMaterial({ color: 0x34495e, metalness: 0.8, roughness: 0.3 });
    const silverMat = new THREE.MeshStandardMaterial({ color: 0xecf0f1, metalness: 0.95, roughness: 0.15 });
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xf39c12, metalness: 0.9, roughness: 0.2 });

    const baseGeo = new THREE.BoxGeometry(7.0, 0.5, 2.5);
    const base = new THREE.Mesh(baseGeo, castIronMat);
    base.position.set(0, 0.25, 0);
    group.add(base);

    const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.4, 16), brassMat);
    screw.position.set(-3.1, 0.1, 0);
    group.add(screw);

    const fulcrumGeo = new THREE.BoxGeometry(0.8, 2.2, 1.2);
    const fulcrum = new THREE.Mesh(fulcrumGeo, castIronMat);
    fulcrum.position.set(-0.8, 1.4, 0);
    group.add(fulcrum);

    const panPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 1.8, 16), silverMat);
    panPillar.position.set(-2.5, 1.5, 0);
    group.add(panPillar);

    const panGeo = new THREE.CylinderGeometry(1.3, 1.1, 0.2, 32);
    const pan = new THREE.Mesh(panGeo, silverMat);
    pan.position.set(-2.5, 2.4, 0);
    group.add(pan);

    const beamGroup = new THREE.Group();
    beamGroup.position.set(1.2, 1.8, 0);

    const beamFront = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.15, 0.15), silverMat);
    beamFront.position.set(0, 0, 0.4);
    beamGroup.add(beamFront);

    const beamMid = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.25, 0.15), silverMat);
    beamMid.position.set(0, 0.3, 0);
    beamGroup.add(beamMid);

    const beamBack = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.18, 0.15), silverMat);
    beamBack.position.set(0, 0, -0.4);
    beamGroup.add(beamBack);

    const rider1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.3), brassMat);
    rider1.position.set(-0.5, 0, 0.4);
    beamGroup.add(rider1);

    const rider2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.3), brassMat);
    rider2.position.set(0.8, 0.3, 0);
    beamGroup.add(rider2);

    const pointer = new THREE.Mesh(new THREE.ConeGeometry(0.08, 1.2, 8), new THREE.MeshBasicMaterial({ color: 0xe74c3c }));
    pointer.rotation.z = -Math.PI / 2;
    pointer.position.set(2.6, 0.1, 0);
    beamGroup.add(pointer);

    group.add(beamGroup);
    this.animatedObjects.beam = beamGroup;

    const zeroPlate = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.2, 0.6), silverMat);
    zeroPlate.position.set(3.8, 1.8, 0);
    group.add(zeroPlate);

    this.hotspots = [
      { id: "h-pan", name: "Piringan Penimbang (Pan)", pos: new THREE.Vector3(-2.5, 2.7, 0.5), desc: "Tempat meletakkan benda atau zat padat yang akan ditimbang massanya." },
      { id: "h-beam", name: "Tiga Lengan Skala & Anting Geser", pos: new THREE.Vector3(1.2, 2.3, 0.6), desc: "Lengan depan (satuan/desimal gram), lengan tengah (ratusan gram), lengan belakang (puluhan gram). Digeser untuk menyeimbangkan massa." },
      { id: "h-zero", name: "Jarum Penunjuk Titik Nol", pos: new THREE.Vector3(3.8, 2.1, 0.4), desc: "Jarum harus tepat sejajar lurus dengan garis skala nol untuk menandakan neraca sudah seimbang akurat." }
    ];
  }

  // ================= 5. MODEL RAK TABUNG REAKSI 3D =================
  buildTestTubeRack(group) {
    const woodMat = new THREE.MeshStandardMaterial({ color: 0xd35400, roughness: 0.6 });
    const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 0.95, transparent: true, roughness: 0.05, ior: 1.5 });
    const colors = [0xe74c3c, 0x3498db, 0x2ecc71, 0xf1c40f];

    const topBoard = new THREE.Mesh(new THREE.BoxGeometry(6.0, 0.2, 2.0), woodMat);
    topBoard.position.set(0, 2.6, 0);
    group.add(topBoard);

    const bottomBoard = new THREE.Mesh(new THREE.BoxGeometry(6.0, 0.3, 2.0), woodMat);
    bottomBoard.position.set(0, 0.15, 0);
    group.add(bottomBoard);

    const side1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.6, 2.0), woodMat);
    side1.position.set(-2.85, 1.3, 0);
    group.add(side1);
    const side2 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.6, 2.0), woodMat);
    side2.position.set(2.85, 1.3, 0);
    group.add(side2);

    for (let i = 0; i < 4; i++) {
      const posX = -1.8 + i * 1.2;
      const tubeGroup = new THREE.Group();
      tubeGroup.position.set(posX, 0.3, 0);

      const tubeMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 3.2, 20, 1, true), glassMat);
      tubeMesh.position.y = 1.6;
      tubeGroup.add(tubeMesh);

      const tubeBottom = new THREE.Mesh(new THREE.SphereGeometry(0.35, 20, 12), glassMat);
      tubeBottom.position.y = 0.35;
      tubeGroup.add(tubeBottom);

      const tubeRim = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.04, 12, 20), glassMat);
      tubeRim.rotation.x = Math.PI / 2;
      tubeRim.position.y = 3.2;
      tubeGroup.add(tubeRim);

      const fluidMat = new THREE.MeshPhysicalMaterial({ color: colors[i], transmission: 0.75, transparent: true, roughness: 0.2 });
      const fluidMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 1.6, 16), fluidMat);
      fluidMesh.position.y = 0.9;
      tubeGroup.add(fluidMesh);

      group.add(tubeGroup);
    }

    this.hotspots = [
      { id: "h-rack", name: "Rak Tabung Reaksi", pos: new THREE.Vector3(-2.8, 2.8, 1.0), desc: "Menata dan menjaga tabung reaksi agar tetap tegak dan tidak mudah terguling saat praktikum." },
      { id: "h-tube", name: "Tabung Reaksi Kaca", pos: new THREE.Vector3(0, 3.2, 0.6), desc: "Wadah untuk mereaksikan zat kimia dalam jumlah sedikit (skala mikro/semi-mikro) dan dapat dipanaskan secara miring." },
      { id: "h-reaction", name: "Larutan Reaksi Kimia", pos: new THREE.Vector3(0.6, 1.2, 0.6), desc: "Zat kimia yang sedang direaksikan menghasilkan perubahan warna, endapan, atau pelepasan gas." }
    ];
  }

  // ================= 6. MODEL GELAS UKUR 3D =================
  buildGraduatedCylinder(group) {
    const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 0.94, transparent: true, roughness: 0.08, ior: 1.5 });
    const liquidMat = new THREE.MeshPhysicalMaterial({ color: 0x00a8ff, transmission: 0.8, transparent: true, roughness: 0.1 });
    const plasticMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 });

    // 1. Hexagonal Base
    const baseGeo = new THREE.CylinderGeometry(1.6, 1.8, 0.35, 6);
    const base = new THREE.Mesh(baseGeo, plasticMat);
    base.position.set(0, 0.2, 0);
    group.add(base);

    // 2. Cylinder Glass Body
    const cylGeo = new THREE.CylinderGeometry(0.9, 0.9, 5.4, 32, 1, true);
    const cyl = new THREE.Mesh(cylGeo, glassMat);
    cyl.position.set(0, 3.0, 0);
    group.add(cyl);

    // Spout & Rim
    const rimGeo = new THREE.TorusGeometry(0.92, 0.06, 12, 32);
    const rim = new THREE.Mesh(rimGeo, glassMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.set(0, 5.7, 0);
    group.add(rim);

    // 3. Liquid Column with Meniscus
    const liquidGeo = new THREE.CylinderGeometry(0.86, 0.86, 3.2, 32);
    const liquid = new THREE.Mesh(liquidGeo, liquidMat);
    liquid.position.set(0, 1.95, 0);
    group.add(liquid);

    // Meniscus surface
    const meniscusGeo = new THREE.CylinderGeometry(0.86, 0.82, 0.12, 32);
    const meniscus = new THREE.Mesh(meniscusGeo, new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.9 }));
    meniscus.position.set(0, 3.55, 0);
    group.add(meniscus);
    this.animatedObjects.cylinderMeniscus = meniscus;

    // 4. White Graduation Ticks
    for (let i = 1; i <= 10; i++) {
      const tickW = (i % 2 === 0) ? 0.35 : 0.2;
      const tick = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, tickW), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      tick.position.set(0.88, 0.8 + i * 0.45, 0);
      group.add(tick);
    }

    this.hotspots = [
      { id: "h-meniscus", name: "Meniskus Cekung", pos: new THREE.Vector3(0, 3.6, 1.1), desc: "Kelengkungan permukaan zat cair dalam tabung sempit. Pembacaan skala volume yang akurat diambil tepat pada bagian paling dasar lengkungan meniskus." },
      { id: "h-scale", name: "Skala Mililiter (mL) Presisi", pos: new THREE.Vector3(0.9, 4.0, 0), desc: "Garis-garis kalibrasi presisi untuk mengukur volume zat cair secara kuantitatif dan tepat." },
      { id: "h-base", name: "Kaki Heksagonal Penstabil", pos: new THREE.Vector3(0, 0.4, 1.8), desc: "Dasar berbentuk segi enam lebar agar tabung berdiri tegak, seimbang, dan tidak mudah terguling saat ditaruh di meja lab." }
    ];
  }

  // ================= 7. MODEL LABU ERLENMEYER 3D =================
  buildErlenmeyer(group) {
    const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 0.93, transparent: true, roughness: 0.08, ior: 1.5 });
    const liquidMat = new THREE.MeshPhysicalMaterial({ color: 0x9b59b6, transmission: 0.8, transparent: true, roughness: 0.15 });

    // Conical Body
    const coneGeo = new THREE.CylinderGeometry(0.8, 2.4, 3.4, 32, 1, true);
    const cone = new THREE.Mesh(coneGeo, glassMat);
    cone.position.set(0, 2.0, 0);
    group.add(cone);

    // Bottom Base
    const bottom = new THREE.Mesh(new THREE.CylinderGeometry(2.38, 2.38, 0.15, 32), glassMat);
    bottom.position.set(0, 0.35, 0);
    group.add(bottom);

    // Narrow Neck
    const neckGeo = new THREE.CylinderGeometry(0.8, 0.8, 1.6, 32, 1, true);
    const neck = new THREE.Mesh(neckGeo, glassMat);
    neck.position.set(0, 4.4, 0);
    group.add(neck);

    // Rim
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.82, 0.06, 12, 32), glassMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.set(0, 5.2, 0);
    group.add(rim);

    // Liquid Body
    const fluidGeo = new THREE.CylinderGeometry(1.4, 2.3, 2.0, 32);
    const fluid = new THREE.Mesh(fluidGeo, liquidMat);
    fluid.position.set(0, 1.4, 0);
    group.add(fluid);
    this.animatedObjects.erlenmeyerFluid = fluid;

    // Rising Bubbles
    const bubblesGroup = new THREE.Group();
    for (let i = 0; i < 8; i++) {
      const bubble = new THREE.Mesh(new THREE.SphereGeometry(0.08 + Math.random() * 0.06, 12, 12), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 }));
      bubble.position.set((Math.random() - 0.5) * 2.2, 0.5 + Math.random() * 1.8, (Math.random() - 0.5) * 2.2);
      bubblesGroup.add(bubble);
    }
    group.add(bubblesGroup);
    this.animatedObjects.bubbles = bubblesGroup;

    this.hotspots = [
      { id: "h-neck", name: "Leher Sempit (Anti Tumpah)", pos: new THREE.Vector3(0, 4.6, 1.0), desc: "Mencegah cipratan dan tumpahan zat kimia saat larutan dikocok memutar (swirling) atau saat titrasi." },
      { id: "h-body", name: "Badan Kerucut & Reaksi", pos: new THREE.Vector3(0, 2.0, 2.2), desc: "Bentuk kerucut memudahkan pencampuran larutan homogen dan penangkapan uap reaksi." },
      { id: "h-bottom", name: "Dasar Rata Tahan Panas", pos: new THREE.Vector3(0, 0.5, 2.2), desc: "Dibuat dari kaca borosilikat yang dapat dipanaskan merata di atas kawat kasa dan kaki tiga." }
    ];
  }

  // ================= 8. MODEL TERMOMETER LAB 3D =================
  buildThermometer(group) {
    const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 0.95, transparent: true, roughness: 0.05, ior: 1.5 });
    const redLiquidMat = new THREE.MeshBasicMaterial({ color: 0xe74c3c });

    // Outer Glass Stem
    const stemGeo = new THREE.CylinderGeometry(0.35, 0.35, 5.8, 20);
    const stem = new THREE.Mesh(stemGeo, glassMat);
    stem.position.set(0, 3.2, 0);
    group.add(stem);

    // Red Bulb at bottom
    const bulbGeo = new THREE.SphereGeometry(0.65, 24, 20);
    const bulb = new THREE.Mesh(bulbGeo, redLiquidMat);
    bulb.position.set(0, 0.7, 0);
    group.add(bulb);

    const bulbGlass = new THREE.Mesh(new THREE.SphereGeometry(0.72, 24, 20), glassMat);
    bulbGlass.position.set(0, 0.7, 0);
    group.add(bulbGlass);

    // Inner Capillary Red Column
    const capGeo = new THREE.CylinderGeometry(0.08, 0.08, 3.4, 16);
    const cap = new THREE.Mesh(capGeo, redLiquidMat);
    cap.position.set(0, 2.4, 0);
    group.add(cap);
    this.animatedObjects.thermoColumn = cap;

    // Scale Markings
    for (let i = 0; i <= 10; i++) {
      const mark = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.03, 0.03), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      mark.position.set(0.36, 1.2 + i * 0.42, 0);
      group.add(mark);
    }

    this.hotspots = [
      { id: "h-bulb", name: "Tandon Reservoir (Bulb)", pos: new THREE.Vector3(0, 0.7, 0.9), desc: "Bagian ujung bawah yang berisi cairan pengisi (alkohol merah/raksa) peka suhu yang akan memuai saat terkena panas." },
      { id: "h-capillary", name: "Pipa Kapiler Kaca", pos: new THREE.Vector3(0, 3.0, 0.6), desc: "Saluran sempit tempat kolom cairan pemuai naik-turun sesuai perubahan suhu larutan." },
      { id: "h-scale", name: "Garis Skala Celsius (°C)", pos: new THREE.Vector3(0.4, 4.2, 0.4), desc: "Menunjukkan nilai suhu dalam satuan derajat Celsius (-10°C hingga 110°C) yang dibaca tepat sejajar mata." }
    ];
  }

  // ================= 9. MODEL JANGKA SORONG 3D =================
  buildVernierCaliper(group) {
    const steelMat = new THREE.MeshStandardMaterial({ color: 0xbdc3c7, metalness: 0.92, roughness: 0.15 });
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xf39c12, metalness: 0.85, roughness: 0.25 });

    // Main Scale Beam
    const beamGeo = new THREE.BoxGeometry(7.5, 0.7, 0.2);
    const beam = new THREE.Mesh(beamGeo, steelMat);
    beam.position.set(0, 2.5, 0);
    group.add(beam);

    // Fixed Jaws (Left)
    // Lower fixed jaw (outside)
    const fixedLower = new THREE.Mesh(new THREE.BoxGeometry(0.7, 2.2, 0.2), steelMat);
    fixedLower.position.set(-3.4, 1.2, 0);
    group.add(fixedLower);

    // Upper fixed jaw (inside)
    const fixedUpper = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.2, 0.2), steelMat);
    fixedUpper.position.set(-3.4, 3.4, 0);
    group.add(fixedUpper);

    // Sliding Vernier Block
    const vernierGroup = new THREE.Group();
    vernierGroup.position.set(-1.0, 2.5, 0);

    const vernierBody = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 0.26), steelMat);
    vernierGroup.add(vernierBody);

    const slideLower = new THREE.Mesh(new THREE.BoxGeometry(0.6, 2.2, 0.2), steelMat);
    slideLower.position.set(-0.5, -1.3, 0);
    vernierGroup.add(slideLower);

    const slideUpper = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.2, 0.2), steelMat);
    slideUpper.position.set(-0.5, 0.9, 0);
    vernierGroup.add(slideUpper);

    const lockScrew = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.35, 16), brassMat);
    lockScrew.position.set(0.3, 0.7, 0);
    vernierGroup.add(lockScrew);

    group.add(vernierGroup);
    this.animatedObjects.vernierJaw = vernierGroup;

    // Specimen Cylinder being measured
    const sample = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1.4, 24), new THREE.MeshStandardMaterial({ color: 0x3498db, metalness: 0.5, roughness: 0.3 }));
    sample.position.set(-2.4, 1.2, 0);
    group.add(sample);

    this.hotspots = [
      { id: "h-outjaws", name: "Rahang Luar (Outside Jaws)", pos: new THREE.Vector3(-2.4, 1.2, 0.5), desc: "Mengukur tebal, panjang, dan diameter luar benda silinder secara presisi." },
      { id: "h-injaws", name: "Rahang Dalam (Inside Jaws)", pos: new THREE.Vector3(-2.4, 3.4, 0.5), desc: "Mengukur diameter dalam pipa, lubang cincin, atau rongga benda." },
      { id: "h-scale", name: "Skala Utama & Nonius", pos: new THREE.Vector3(0.5, 2.6, 0.5), desc: "Skala utama dalam centimeter dan skala nonius bergerak untuk membaca ketelitian hingga 0.05 mm." }
    ];
  }

  // ================= 10. MODEL KACA PEMBESAR (LUP) 3D =================
  buildMagnifyingGlass(group) {
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.2 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x4a2c11, roughness: 0.5 });
    const lensMat = new THREE.MeshPhysicalMaterial({ color: 0xa0e7e5, transmission: 0.9, transparent: true, roughness: 0.05, ior: 1.6 });

    // Rim Frame (Ring)
    const rimGeo = new THREE.TorusGeometry(2.0, 0.18, 16, 48);
    const rim = new THREE.Mesh(rimGeo, brassMat);
    rim.position.set(0, 3.0, 0);
    group.add(rim);

    // Convex Optical Glass Lens
    const lensGeo = new THREE.SphereGeometry(2.0, 32, 16);
    lensGeo.scale(1, 1, 0.18);
    const lens = new THREE.Mesh(lensGeo, lensMat);
    lens.position.set(0, 3.0, 0);
    group.add(lens);

    // Handle (Gagang Kayu/Kuningan)
    const ferrule = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 0.6, 16), brassMat);
    ferrule.position.set(0, 0.8, 0);
    group.add(ferrule);

    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.25, 2.4, 20), woodMat);
    handle.position.set(0, -0.6, 0);
    group.add(handle);

    // Small Butterfly Specimen Behind Lens
    const sample = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 0.05), new THREE.MeshBasicMaterial({ color: 0x2ecc71 }));
    sample.position.set(0, 3.0, -0.8);
    group.add(sample);

    this.hotspots = [
      { id: "h-lens", name: "Lensa Bikonveks Cembung", pos: new THREE.Vector3(0, 3.0, 0.5), desc: "Lensa cembung optik berkualitas tinggi yang membiaskan berkas cahaya sehingga bayangan tampak lebih besar dan tegak." },
      { id: "h-frame", name: "Bingkai Cincin Logam", pos: new THREE.Vector3(1.9, 3.0, 0.3), desc: "Menjepit dan melindungi tepian kaca lensa dari benturan dan goresan." },
      { id: "h-handle", name: "Gagang Pegangan Ergonomis", pos: new THREE.Vector3(0, -0.4, 0.5), desc: "Pegangan tangan yang nyaman untuk mengarahkan posisi lup mendekati atau menjauhi mata." }
    ];
  }

  // ================= 11. MODEL CAWAN PETRI 3D =================
  buildPetriDish(group) {
    const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 0.95, transparent: true, roughness: 0.05, ior: 1.5 });
    const agarMat = new THREE.MeshStandardMaterial({ color: 0xf6e58d, roughness: 0.3, transparent: true, opacity: 0.85 });

    // Bottom Dish
    const dishGeo = new THREE.CylinderGeometry(2.6, 2.6, 0.5, 36, 1, true);
    const dish = new THREE.Mesh(dishGeo, glassMat);
    dish.position.set(0, 0.6, 0);
    group.add(dish);

    const dishBottom = new THREE.Mesh(new THREE.CylinderGeometry(2.58, 2.58, 0.1, 36), glassMat);
    dishBottom.position.set(0, 0.35, 0);
    group.add(dishBottom);

    // Agar Substrate Layer
    const agar = new THREE.Mesh(new THREE.CylinderGeometry(2.52, 2.52, 0.25, 36), agarMat);
    agar.position.set(0, 0.5, 0);
    group.add(agar);

    // Bacterial / Fungal Colonies
    const colonyColors = [0xe74c3c, 0x00cec9, 0x2ecc71, 0xe67e22];
    for (let i = 0; i < 14; i++) {
      const rad = 0.1 + Math.random() * 0.2;
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 1.8;
      const colMesh = new THREE.Mesh(new THREE.SphereGeometry(rad, 16, 8), new THREE.MeshStandardMaterial({ color: colonyColors[i % 4], roughness: 0.2 }));
      colMesh.scale.set(1, 0.4, 1);
      colMesh.position.set(Math.cos(angle) * dist, 0.65, Math.sin(angle) * dist);
      group.add(colMesh);
    }

    // Top Lid (Slightly tilted)
    const lidGroup = new THREE.Group();
    lidGroup.position.set(0.4, 1.2, 0);
    lidGroup.rotation.z = 0.15;

    const lidCyl = new THREE.Mesh(new THREE.CylinderGeometry(2.75, 2.75, 0.45, 36, 1, true), glassMat);
    lidGroup.add(lidCyl);
    const lidTop = new THREE.Mesh(new THREE.CylinderGeometry(2.75, 2.75, 0.08, 36), glassMat);
    lidTop.position.y = 0.22;
    lidGroup.add(lidTop);

    group.add(lidGroup);
    this.animatedObjects.petriLid = lidGroup;

    this.hotspots = [
      { id: "h-agar", name: "Media Nutrisi Agar", pos: new THREE.Vector3(0, 0.7, 0), desc: "Gel agar padat kaya nutrisi sebagai media biakan untuk pertumbuhan bakteri, khamir, atau jamur." },
      { id: "h-colony", name: "Koloni Mikroorganisme", pos: new THREE.Vector3(0.8, 0.8, 0.8), desc: "Kumpulan jutaan sel mikroorganisme hasil inokulasi yang berkembang biak membentuk koloni bundar berwarna khas." },
      { id: "h-lid", name: "Tutup Cawan Steril", pos: new THREE.Vector3(0.8, 1.6, 0.5), desc: "Penutup bening yang menjaga kondisi aseptis agar biakan di dalam tidak terkontaminasi spora dari udara bebas." }
    ];
  }

  // ================= 12. MODEL KAKI TIGA & KASA 3D =================
  buildTripodAndGauze(group) {
    const castIronMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.5 });
    const gauzeMat = new THREE.MeshStandardMaterial({ color: 0xbdc3c7, wireframe: true });
    const ceramicMat = new THREE.MeshStandardMaterial({ color: 0xecf0f1, roughness: 0.9 });

    // Top Ring
    const topRing = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.2, 12, 32), castIronMat);
    topRing.rotation.x = Math.PI / 2;
    topRing.position.set(0, 3.8, 0);
    group.add(topRing);

    // 3 Legs
    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3;
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 4.0, 16), castIronMat);
      leg.position.set(Math.sin(angle) * 1.9, 1.9, Math.cos(angle) * 1.9);
      leg.rotation.z = Math.sin(angle) * 0.18;
      leg.rotation.x = Math.cos(angle) * -0.18;
      group.add(leg);
    }

    // Wire Gauze
    const gauze = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.06, 4.0), gauzeMat);
    gauze.position.set(0, 4.0, 0);
    group.add(gauze);

    // Ceramic Center
    const ceramic = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 0.08, 24), ceramicMat);
    ceramic.position.set(0, 4.02, 0);
    group.add(ceramic);
    this.animatedObjects.ceramicHot = ceramic;

    this.hotspots = [
      { id: "h-ring", name: "Cincin Dudukan Penyangga", pos: new THREE.Vector3(0, 3.9, 2.2), desc: "Cincin besi kokoh tempat meletakkan kawat kasa dan wadah kimia tahan pemanasan." },
      { id: "h-legs", name: "3 Kaki Baja Stabil", pos: new THREE.Vector3(1.8, 1.8, 1.8), desc: "Konstruksi tiga kaki memberikan kestabilan statis terbaik pada permukaan laboratorium." },
      { id: "h-gauze", name: "Kawat Kasa & Keramik Perata Panas", pos: new THREE.Vector3(0, 4.1, 0.8), desc: "Meratakan persebaran panas dari nyala api pembakar agar gelas kaca di atasnya tidak pecah mendadak karena panas lokal." }
    ];
  }

  // ================= 13. MODEL BATANG PENGADUK 3D =================
  buildStirringRod(group) {
    const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 0.95, transparent: true, roughness: 0.05, ior: 1.5 });
    const liquidMat = new THREE.MeshPhysicalMaterial({ color: 0x00cec9, transmission: 0.8, transparent: true, roughness: 0.1 });

    // Beaker
    const beaker = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 1.9, 3.8, 32, 1, true), glassMat);
    beaker.position.set(0, 1.9, 0);
    group.add(beaker);

    const fluid = new THREE.Mesh(new THREE.CylinderGeometry(1.88, 1.85, 2.4, 32), liquidMat);
    fluid.position.set(0, 1.3, 0);
    group.add(fluid);

    // Stirring Rod at angle
    const rodGroup = new THREE.Group();
    rodGroup.position.set(0, 2.4, 0);

    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 5.2, 16), glassMat);
    rod.rotation.z = -0.35;
    rod.rotation.x = 0.2;
    rodGroup.add(rod);

    // Spherical rounded ends
    const endTop = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), glassMat);
    endTop.position.set(1.0, 2.5, -0.5);
    rodGroup.add(endTop);

    const endBot = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), glassMat);
    endBot.position.set(-1.0, -2.5, 0.5);
    rodGroup.add(endBot);

    group.add(rodGroup);
    this.animatedObjects.stirringRod = rodGroup;

    this.hotspots = [
      { id: "h-rod", name: "Batang Kaca Borosilikat Pejal", pos: new THREE.Vector3(0.5, 3.2, 0.5), desc: "Batang silinder kaca pejal bening yang tahan bahan kimia korosif asam maupun basa." },
      { id: "h-tips", name: "Ujung Membulat Halus", pos: new THREE.Vector3(1.1, 4.8, 0), desc: "Kedua ujungnya dipanaskan membulat halus agar tidak menggores dinding wadah gelas saat mengaduk." }
    ];
  }

  // ================= 14. MODEL CORONG KACA 3D =================
  buildFunnel(group) {
    const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 0.94, transparent: true, roughness: 0.08, ior: 1.5 });
    const paperMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.8 });
    const liquidMat = new THREE.MeshPhysicalMaterial({ color: 0x3498db, transmission: 0.85, transparent: true, roughness: 0.1 });

    // Erlenmeyer below collecting filtrate
    const flask = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 2.2, 2.8, 32, 1, true), glassMat);
    flask.position.set(0, 1.4, 0);
    group.add(flask);

    const flaskBottom = new THREE.Mesh(new THREE.CylinderGeometry(2.18, 2.18, 0.1, 32), glassMat);
    flaskBottom.position.set(0, 0.05, 0);
    group.add(flaskBottom);

    const filtrate = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 2.1, 1.0, 32), liquidMat);
    filtrate.position.set(0, 0.55, 0);
    group.add(filtrate);

    // Glass Funnel
    const funnelCone = new THREE.Mesh(new THREE.ConeGeometry(2.2, 2.4, 32, 1, true), glassMat);
    funnelCone.rotation.x = Math.PI;
    funnelCone.position.set(0, 4.6, 0);
    group.add(funnelCone);

    // Funnel Stem Pipe
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 2.2, 16), glassMat);
    stem.position.set(0, 2.4, 0);
    group.add(stem);

    // Filter Paper inside
    const filterPaper = new THREE.Mesh(new THREE.ConeGeometry(2.0, 2.0, 32, 1, true), paperMat);
    filterPaper.rotation.x = Math.PI;
    filterPaper.position.set(0, 4.7, 0);
    group.add(filterPaper);

    // Falling Drop
    const drop = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 12), liquidMat);
    drop.position.set(0, 1.3, 0);
    group.add(drop);
    this.animatedObjects.funnelDrop = drop;

    this.hotspots = [
      { id: "h-cone", name: "Kerucut Kaca & Kertas Saring", pos: new THREE.Vector3(0, 5.0, 1.2), desc: "Menampung campuran suspensi dan menyangga kertas saring berpori halus untuk memisahkan endapan padat dari cairan." },
      { id: "h-stem", name: "Tangkai Pipa Alir Miring", pos: new THREE.Vector3(0, 2.4, 0.5), desc: "Pipa panjang berujung miring (beveled) untuk mengalirkan filtrat jernih merayap di dinding leher wadah penampung tanpa menimbulkan percikan." }
    ];
  }

  // ================= HOTSPOT & UI UPDATES =================
  clearHotspots() {
    const existingHotspots = document.querySelectorAll('.hotspot-pin');
    existingHotspots.forEach(el => el.remove());
  }

  updateHotspotUI() {
    const listContainer = document.getElementById('hotspot-list-container');
    if (!listContainer) return;

    let html = `
      <div class="hotspots-header">
        <span class="badge-accent"><i class="fa-solid fa-circle-info"></i> Titik Anatomi & Fungsi</span>
        <span class="hotspot-count">${this.hotspots.length} Bagian</span>
      </div>
      <div class="hotspot-items">
    `;

    this.hotspots.forEach((h, idx) => {
      html += `
        <div class="hotspot-card" onclick="window.labViewer3D.focusHotspot(${idx})" id="hotspot-card-${idx}">
          <div class="hotspot-badge">${idx + 1}</div>
          <div class="hotspot-info">
            <h4>${h.name}</h4>
            <p>${h.desc}</p>
          </div>
        </div>
      `;
    });

    html += `</div>`;
    listContainer.innerHTML = html;
  }

  updateActionButtonLabel() {
    const btn = document.getElementById('btn-3d-action');
    if (!btn) return;
    const labels = {
      'mikroskop': '<i class="fa-solid fa-rotate"></i> Putar Revolver Lensa',
      'bunsen': '<i class="fa-solid fa-fire"></i> Nyalakan Api Spiritus',
      'gelas-kimia': '<i class="fa-solid fa-droplet"></i> Teteskan Pipet',
      'neraca': '<i class="fa-solid fa-sliders"></i> Geser Anting Timbangan',
      'neraca-ohaus': '<i class="fa-solid fa-sliders"></i> Geser Anting Timbangan',
      'tabung-reaksi': '<i class="fa-solid fa-wand-magic-sparkles"></i> Kocok Tabung',
      'gelas-ukur': '<i class="fa-solid fa-water"></i> Tuang Cairan Ukur',
      'erlenmeyer': '<i class="fa-solid fa-rotate"></i> Goyang Titrasi',
      'labu-erlenmeyer': '<i class="fa-solid fa-rotate"></i> Goyang Titrasi',
      'termometer': '<i class="fa-solid fa-temperature-arrow-up"></i> Panaskan Termometer',
      'termometer-lab': '<i class="fa-solid fa-temperature-arrow-up"></i> Panaskan Termometer',
      'jangka-sorong': '<i class="fa-solid fa-arrows-left-right"></i> Geser Rahang Ukur',
      'lup': '<i class="fa-solid fa-magnifying-glass-plus"></i> Fokuskan Lensa',
      'cawan-petri': '<i class="fa-solid fa-box-open"></i> Buka Tutup Cawan',
      'kaki-tiga': '<i class="fa-solid fa-fire-burner"></i> Nyalakan Pemanas',
      'kawat-kasa': '<i class="fa-solid fa-fire-burner"></i> Nyalakan Pemanas',
      'batang-pengaduk': '<i class="fa-solid fa-rotate"></i> Aduk Larutan',
      'corong': '<i class="fa-solid fa-filter"></i> Mulai Filtrasi',
      'corong-kaca': '<i class="fa-solid fa-filter"></i> Mulai Filtrasi'
    };
    btn.innerHTML = labels[this.currentModelType] || '<i class="fa-solid fa-play"></i> Jalankan Interaksi';
  }

  focusHotspot(index) {
    if (window.labAudio) window.labAudio.playClick();
    const h = this.hotspots[index];
    if (!h) return;

    document.querySelectorAll('.hotspot-card').forEach((el, i) => {
      el.classList.toggle('active', i === index);
    });

    const targetPos = new THREE.Vector3(h.pos.x * 1.4, h.pos.y + 0.8, h.pos.z + 4.5);
    this.animateCamera(targetPos, new THREE.Vector3(h.pos.x, h.pos.y, h.pos.z));
  }

  animateCamera(toPos, toTarget) {
    const startPos = this.camera.position.clone();
    const startTarget = this.controls ? this.controls.target.clone() : new THREE.Vector3();
    const duration = 1000;
    const startTime = performance.now();

    const animStep = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 0.5 - Math.cos(progress * Math.PI) / 2;

      this.camera.position.lerpVectors(startPos, toPos, ease);
      if (this.controls) {
        this.controls.target.lerpVectors(startTarget, toTarget, ease);
        this.controls.update();
      }

      if (progress < 1) {
        requestAnimationFrame(animStep);
      }
    };
    requestAnimationFrame(animStep);
  }

  // Action / Animation Trigger
  toggleAction() {
    if (window.labAudio) window.labAudio.playClick();
    this.isActionActive = !this.isActionActive;
    const btn = document.getElementById('btn-3d-action');

    if (this.currentModelType === 'bunsen') {
      if (btn) btn.innerHTML = this.isActionActive ? '<i class="fa-solid fa-fire-extinguisher"></i> Padamkan Api' : '<i class="fa-solid fa-fire"></i> Nyalakan Api Spiritus';
      if (this.animatedObjects.flame) {
        this.animatedObjects.flame.visible = this.isActionActive;
      }
    } else if (this.currentModelType === 'mikroskop') {
      if (btn) btn.innerHTML = '<i class="fa-solid fa-rotate"></i> Putar Revolver Lensa';
      if (this.animatedObjects.revolver) {
        this.animatedObjects.revolver.rotation.y += Math.PI * 2 / 3;
      }
    } else if (this.currentModelType === 'gelas-kimia') {
      if (btn) btn.innerHTML = '<i class="fa-solid fa-droplet"></i> Teteskan Pipet';
      if (window.labAudio) window.labAudio.playDrop();
      if (this.animatedObjects.droplet) {
        this.animatedObjects.droplet.position.y = -2.4;
      }
    } else if (this.currentModelType === 'neraca' || this.currentModelType === 'neraca-ohaus') {
      if (btn) btn.innerHTML = '<i class="fa-solid fa-sliders"></i> Geser Anting Timbangan';
      if (this.animatedObjects.beam) {
        this.animatedObjects.beam.rotation.z = (Math.random() - 0.5) * 0.08;
      }
    } else if (this.currentModelType === 'jangka-sorong') {
      if (this.animatedObjects.vernierJaw) {
        this.animatedObjects.vernierJaw.position.x = this.isActionActive ? 0.2 : -1.0;
      }
    } else if (this.currentModelType === 'termometer-lab' || this.currentModelType === 'termometer') {
      if (this.animatedObjects.thermoColumn) {
        this.animatedObjects.thermoColumn.scale.y = this.isActionActive ? 1.4 : 0.8;
      }
    } else if (this.currentModelType === 'cawan-petri') {
      if (this.animatedObjects.petriLid) {
        this.animatedObjects.petriLid.position.x = this.isActionActive ? 1.8 : 0.4;
        this.animatedObjects.petriLid.rotation.z = this.isActionActive ? 0.45 : 0.15;
      }
    } else if (this.currentModelType === 'kaki-tiga' || this.currentModelType === 'kawat-kasa') {
      if (this.animatedObjects.ceramicHot) {
        this.animatedObjects.ceramicHot.material.color.setHex(this.isActionActive ? 0xff7675 : 0xecf0f1);
      }
    }

    return this.isActionActive;
  }

  toggleAutoRotate() {
    this.isAutoRotate = !this.isAutoRotate;
    if (this.controls) {
      this.controls.autoRotate = this.isAutoRotate;
      this.controls.autoRotateSpeed = 2.0;
    }
    return this.isAutoRotate;
  }

  onCanvasClick(event) {}

  onWindowResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  animate() {
    this.animFrameId = requestAnimationFrame(() => this.animate());
    const elapsedTime = this.clock.getElapsedTime();

    if (this.controls) {
      this.controls.update();
    }

    // Dynamic Micro Animations
    if (this.currentModelType === 'bunsen' && this.animatedObjects.flame && this.animatedObjects.flame.visible) {
      const flicker = Math.sin(elapsedTime * 15) * 0.08 + Math.cos(elapsedTime * 23) * 0.05;
      this.animatedObjects.flame.scale.set(1 + flicker, 1 + flicker * 1.5, 1 + flicker);
    }

    if (this.currentModelType === 'gelas-kimia' && this.animatedObjects.droplet) {
      this.animatedObjects.droplet.position.y -= 0.04;
      if (this.animatedObjects.droplet.position.y < -4.2) {
        this.animatedObjects.droplet.position.y = -2.4;
      }
    }

    if ((this.currentModelType === 'erlenmeyer' || this.currentModelType === 'labu-erlenmeyer') && this.animatedObjects.bubbles) {
      this.animatedObjects.bubbles.children.forEach((b, i) => {
        b.position.y += 0.015 + (i % 3) * 0.005;
        if (b.position.y > 2.2) b.position.y = 0.6;
      });
    }

    if ((this.currentModelType === 'corong' || this.currentModelType === 'corong-kaca') && this.animatedObjects.funnelDrop) {
      this.animatedObjects.funnelDrop.position.y -= 0.03;
      if (this.animatedObjects.funnelDrop.position.y < 0.6) {
        this.animatedObjects.funnelDrop.position.y = 1.3;
      }
    }

    if (this.currentModelType === 'batang-pengaduk' && this.animatedObjects.stirringRod && this.isActionActive) {
      this.animatedObjects.stirringRod.rotation.y = elapsedTime * 3;
    }

    this.renderer.render(this.scene, this.camera);
  }
}

window.Lab3DViewer = Lab3DViewer;
