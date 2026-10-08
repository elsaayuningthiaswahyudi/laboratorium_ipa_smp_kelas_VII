// 3D Laboratory Apparatus Generator using Three.js
// Enhanced with Photorealistic Materials, Studio Illumination, and Authentic Scientific Apparatus Geometries

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
    // 1. Scene setup with studio depth background
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060f22);

    // 2. Camera setup
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    this.camera.position.set(0, 4.5, 11);

    // 3. Renderer with ACES Filmic tone mapping for realistic bright exposure
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Photorealistic tone mapping & bright exposure
    if (THREE.ACESFilmicToneMapping) {
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.35;
    }
    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    // 4. OrbitControls
    if (THREE.OrbitControls) {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.maxDistance = 25;
      this.controls.minDistance = 2.5;
      this.controls.maxPolarAngle = Math.PI / 2 + 0.08;
    }

    // 5. Studio Multi-Light Rig
    this.setupLighting();

    // 6. Studio Pedestal & Holographic Grid
    this.setupEnvironment();

    // 7. Load default model
    this.loadModel('mikroskop');

    // 8. Event listeners
    window.addEventListener('resize', () => this.onWindowResize());
    this.renderer.domElement.addEventListener('click', (e) => this.onCanvasClick(e));

    // 9. Start Render Loop
    this.animate();
  }

  setupLighting() {
    // 1. Bright White Studio Ambient Light (Ensures no dark silhouettes)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    this.scene.add(ambientLight);

    // 2. Hemisphere Light (Soft Sky White / Slate Ground bounce)
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x334155, 1.2);
    hemiLight.position.set(0, 20, 0);
    this.scene.add(hemiLight);

    // 3. Main Key Light (Top-Front-Right)
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(6, 14, 8);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.001;
    this.scene.add(keyLight);

    // 4. Front-Left Soft Fill Light
    const fillLight = new THREE.DirectionalLight(0xf0f9ff, 1.4);
    fillLight.position.set(-8, 8, 7);
    this.scene.add(fillLight);

    // 5. Rim / Edge Back Light (Gives crisp specular reflections on metals & glass)
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.1);
    rimLight.position.set(0, 10, -9);
    this.scene.add(rimLight);

    // 6. Direct Top Light for volumetric glassware
    const topLight = new THREE.DirectionalLight(0xffffff, 0.8);
    topLight.position.set(0, 15, 0);
    this.scene.add(topLight);
  }

  setupEnvironment() {
    // Holographic Grid
    const gridHelper = new THREE.GridHelper(20, 20, 0x00f0ff, 0x1e3a8a);
    gridHelper.position.y = -2;
    this.scene.add(gridHelper);

    // Studio Pedestal Platform
    const pedGeo = new THREE.CylinderGeometry(4.6, 5.0, 0.4, 36);
    const pedMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.3,
      metalness: 0.6,
      emissive: 0x0b1329
    });
    const pedestal = new THREE.Mesh(pedGeo, pedMat);
    pedestal.position.y = -2.2;
    pedestal.receiveShadow = true;
    this.scene.add(pedestal);

    // Glowing Cyan Bezel Ring
    const ringGeo = new THREE.RingGeometry(4.5, 4.7, 36);
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

    // Reset Camera view
    this.camera.position.set(0, 4.2, 10.5);
    if (this.controls) {
      this.controls.target.set(0, 1.6, 0);
      this.controls.update();
    }

    // Render Hotspots in UI
    this.updateHotspotUI();
    this.updateActionButtonLabel();
  }

  // =========================================================================
  // 1. MODEL MIKROSKOP CAHAYA 3D
  // =========================================================================
  buildMicroscope(group) {
    const whiteEnamel = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.15, metalness: 0.1 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.95, roughness: 0.08 });
    const blackStageMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.4, metalness: 0.2 });
    const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xa5f3fc, transmission: 0.9, transparent: true, roughness: 0.05, ior: 1.5 });

    // 1. Base (Kaki Mikroskop berbentuk U/Tapal Kuda)
    const baseGeo = new THREE.BoxGeometry(3.4, 0.65, 3.8);
    const base = new THREE.Mesh(baseGeo, whiteEnamel);
    base.position.set(0, 0.32, 0);
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    // 2. Pillar & Arm
    const pillarGeo = new THREE.CylinderGeometry(0.55, 0.65, 2.5, 24);
    const pillar = new THREE.Mesh(pillarGeo, whiteEnamel);
    pillar.position.set(0, 1.6, -1.2);
    group.add(pillar);

    // Curved Sturdy Arm
    const armCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 2.0, -1.2),
      new THREE.Vector3(0, 3.8, -1.5),
      new THREE.Vector3(0, 5.0, -0.8),
      new THREE.Vector3(0, 5.2, 0.0)
    ]);
    const armGeo = new THREE.TubeGeometry(armCurve, 24, 0.5, 16, false);
    const arm = new THREE.Mesh(armGeo, whiteEnamel);
    arm.castShadow = true;
    group.add(arm);

    // Focusing Knobs (Makrometer & Mikrometer)
    const coarseKnobGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.4, 20);
    const fineKnobGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.6, 20);

    const leftCoarse = new THREE.Mesh(coarseKnobGeo, chromeMat);
    leftCoarse.rotation.z = Math.PI / 2;
    leftCoarse.position.set(-0.9, 2.2, -1.2);
    group.add(leftCoarse);

    const leftFine = new THREE.Mesh(fineKnobGeo, chromeMat);
    leftFine.rotation.z = Math.PI / 2;
    leftFine.position.set(-1.1, 2.2, -1.2);
    group.add(leftFine);

    const rightCoarse = new THREE.Mesh(coarseKnobGeo, chromeMat);
    rightCoarse.rotation.z = Math.PI / 2;
    rightCoarse.position.set(0.9, 2.2, -1.2);
    group.add(rightCoarse);

    const rightFine = new THREE.Mesh(fineKnobGeo, chromeMat);
    rightFine.rotation.z = Math.PI / 2;
    rightFine.position.set(1.1, 2.2, -1.2);
    group.add(rightFine);

    // 3. Stage (Meja Preparat) & Clips
    const stage = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.2, 2.8), blackStageMat);
    stage.position.set(0, 2.8, 0.2);
    stage.castShadow = true;
    group.add(stage);

    const clip1 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.06, 1.2), chromeMat);
    clip1.position.set(-0.8, 2.94, 0.3);
    clip1.rotation.y = 0.25;
    group.add(clip1);

    const clip2 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.06, 1.2), chromeMat);
    clip2.position.set(0.8, 2.94, 0.3);
    clip2.rotation.y = -0.25;
    group.add(clip2);

    // Glass Slide with specimen
    const slide = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.05, 0.8), glassMat);
    slide.position.set(0, 2.93, 0.2);
    group.add(slide);

    const coverslip = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.06, 0.6), new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.8 }));
    coverslip.position.set(0, 2.94, 0.2);
    group.add(coverslip);

    // 4. Condenser & Substage Illuminator
    const condenser = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.5, 20), blackStageMat);
    condenser.position.set(0, 2.3, 0.2);
    group.add(condenser);

    const ledLamp = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.7, 0.5, 24), chromeMat);
    ledLamp.position.set(0, 0.9, 0.2);
    group.add(ledLamp);

    const lampBulb = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 16), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    lampBulb.position.set(0, 1.15, 0.2);
    group.add(lampBulb);

    // 5. Body Tube & Eyepiece
    const tubeGeo = new THREE.CylinderGeometry(0.38, 0.38, 2.4, 20);
    const tube = new THREE.Mesh(tubeGeo, whiteEnamel);
    tube.position.set(0, 5.2, 0.3);
    tube.rotation.x = -0.15;
    group.add(tube);

    const eyepiece = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.4, 0.8, 20), blackStageMat);
    eyepiece.position.set(0, 6.4, 0.15);
    eyepiece.rotation.x = -0.15;
    group.add(eyepiece);

    const eyeLens = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.06, 16), glassMat);
    eyeLens.position.set(0, 6.8, 0.08);
    group.add(eyeLens);

    // 6. Revolving Nosepiece with 3 Objectives (Red 4x, Yellow 10x, Blue 40x)
    const noseGroup = new THREE.Group();
    noseGroup.position.set(0, 4.0, 0.5);

    const nosePlate = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.55, 0.35, 24), chromeMat);
    noseGroup.add(nosePlate);

    const objSpecs = [
      { len: 0.9, col: 0xef4444 }, // 4x Red
      { len: 1.2, col: 0xf59e0b }, // 10x Yellow
      { len: 1.5, col: 0x3b82f6 }  // 40x Blue
    ];

    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3;
      const objGroup = new THREE.Group();
      objGroup.position.set(Math.sin(angle) * 0.48, -0.2, Math.cos(angle) * 0.48);

      const objMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.13, objSpecs[i].len, 16), chromeMat);
      objMesh.position.y = -objSpecs[i].len / 2;
      objGroup.add(objMesh);

      const bandMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.08, 16), new THREE.MeshBasicMaterial({ color: objSpecs[i].col }));
      bandMesh.position.y = -objSpecs[i].len * 0.7;
      objGroup.add(bandMesh);

      noseGroup.add(objGroup);
    }
    group.add(noseGroup);
    this.animatedObjects.revolver = noseGroup;

    this.hotspots = [
      { id: "h-eyepiece", name: "Lensa Okuler (Eyepiece)", pos: new THREE.Vector3(0, 6.6, 0.4), desc: "Lensa pada ujung atas tabung mikroskop tempat mata pengamat melihat perbesaran bayangan (10x)." },
      { id: "h-revolver", name: "Revolver & Lensa Objektif", pos: new THREE.Vector3(0, 3.8, 1.2), desc: "Cakram putar dengan 3 pilihan lensa objektif: 4x (merah), 10x (kuning), dan 40x (biru)." },
      { id: "h-stage", name: "Meja Preparat & Penjepit", pos: new THREE.Vector3(0, 2.9, 1.0), desc: "Permukaan datar tempat meletakkan kaca objek preparat spesimen yang dijepit kuat." },
      { id: "h-knobs", name: "Makrometer & Mikrometer", pos: new THREE.Vector3(-1.3, 2.2, -1.0), desc: "Pemutar kasar (makrometer) dan pemutar halus (mikrometer) untuk menaik-turunkan tabung agar fokus optimal." }
    ];
  }

  // =========================================================================
  // 2. MODEL NERACA OHAUS 3 LENGAN (TERANG & REALISTIS)
  // =========================================================================
  buildOhausBalance(group) {
    const powderCoatBase = new THREE.MeshStandardMaterial({ color: 0x3b82f6, metalness: 0.6, roughness: 0.3 }); // Bright lab blue
    const brightSteel = new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.95, roughness: 0.1 });
    const brassPoiseMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.92, roughness: 0.15 });
    const darkSteelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 });

    // 1. Heavy Base Stand with Leveling Screws
    const baseGeo = new THREE.BoxGeometry(7.6, 0.6, 2.8);
    const base = new THREE.Mesh(baseGeo, powderCoatBase);
    base.position.set(0, 0.3, 0);
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    // Front Trim Chrome Strip
    const trim = new THREE.Mesh(new THREE.BoxGeometry(7.62, 0.1, 0.1), brightSteel);
    trim.position.set(0, 0.55, 1.41);
    group.add(trim);

    // Leveling Thumb Screws
    const screw1 = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.3, 16), brassPoiseMat);
    screw1.position.set(-3.3, 0.15, 1.1);
    group.add(screw1);

    const screw2 = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.3, 16), brassPoiseMat);
    screw2.position.set(3.3, 0.15, 1.1);
    group.add(screw2);

    // 2. Central Fulcrum Pillar & Agate Knife Bearing
    const fulcrumPillar = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.5, 1.3), powderCoatBase);
    fulcrumPillar.position.set(-0.6, 1.6, 0);
    group.add(fulcrumPillar);

    const agateBearing = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.25, 1.35), darkSteelMat);
    agateBearing.position.set(-0.6, 2.8, 0);
    group.add(agateBearing);

    // 3. Left Pan Assembly (Shiny Mirror Stainless Steel)
    const panPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 2.2, 16), brightSteel);
    panPillar.position.set(-2.6, 1.7, 0);
    group.add(panPillar);

    const panSupport = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 0.2, 0.4, 32), brightSteel);
    panSupport.position.set(-2.6, 2.7, 0);
    group.add(panSupport);

    const panGeo = new THREE.CylinderGeometry(1.5, 1.35, 0.15, 36);
    const pan = new THREE.Mesh(panGeo, brightSteel);
    pan.position.set(-2.6, 2.9, 0);
    pan.castShadow = true;
    group.add(pan);

    // Shiny Brass Test Weight Object on Pan
    const testWeight = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 0.8, 20), brassPoiseMat);
    testWeight.position.set(-2.6, 3.4, 0);
    group.add(testWeight);

    const testKnob = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), brassPoiseMat);
    testKnob.position.set(-2.6, 3.85, 0);
    group.add(testKnob);

    // 4. Three Beams Assembly (Lengan Skala Bertingkat)
    const beamGroup = new THREE.Group();
    beamGroup.position.set(1.4, 2.7, 0);

    // Stepped Aluminum Beams
    // Back Beam (10g - 100g)
    const beamBack = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.22, 0.14), brightSteel);
    beamBack.position.set(0, 0.4, -0.4);
    beamGroup.add(beamBack);

    // Middle Beam (100g - 500g, Deep Notched)
    const beamMid = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.35, 0.16), brightSteel);
    beamMid.position.set(0, 0.2, 0);
    beamGroup.add(beamMid);

    // Front Beam (0 - 10g, Fine Calibrated)
    const beamFront = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.18, 0.14), brightSteel);
    beamFront.position.set(0, 0.0, 0.4);
    beamGroup.add(beamFront);

    // Notches and markings lines on middle beam
    for (let i = 0; i <= 5; i++) {
      const notch = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.36, 0.18), darkSteelMat);
      notch.position.set(-2.2 + i * 0.88, 0.2, 0);
      beamGroup.add(notch);
    }

    // 3 Sliding Brass Poises (Anting Pemberat Kuningan Emas)
    // Poise 100g (Middle)
    const poise100 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.65, 0.35), brassPoiseMat);
    poise100.position.set(0.44, 0.2, 0);
    beamGroup.add(poise100);

    // Poise 10g (Back)
    const poise10 = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.28), brassPoiseMat);
    poise10.position.set(-0.8, 0.4, -0.4);
    beamGroup.add(poise10);

    // Poise 1g (Front)
    const poise1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.35, 0.25), brassPoiseMat);
    poise1.position.set(0.9, 0.0, 0.4);
    beamGroup.add(poise1);

    // Long Red Pointer Needle
    const pointer = new THREE.Mesh(new THREE.ConeGeometry(0.08, 1.4, 12), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    pointer.rotation.z = -Math.PI / 2;
    pointer.position.set(3.1, 0.15, 0);
    beamGroup.add(pointer);

    group.add(beamGroup);
    this.animatedObjects.beam = beamGroup;

    // 5. Right Zero Index Scale Card (Papan Skala Nol Putih)
    const scaleCardPillar = new THREE.Mesh(new THREE.BoxGeometry(0.4, 2.2, 0.8), powderCoatBase);
    scaleCardPillar.position.set(4.3, 1.8, 0);
    group.add(scaleCardPillar);

    const scaleCard = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.4, 0.7), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    scaleCard.position.set(4.08, 2.5, 0);
    group.add(scaleCard);

    // Center Zero Line
    const zeroLine = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.5), new THREE.MeshBasicMaterial({ color: 0x10b981 }));
    zeroLine.position.set(4.08, 2.85, 0);
    group.add(zeroLine);

    this.hotspots = [
      { id: "h-pan", name: "Piringan Penimbang (Pan)", pos: new THREE.Vector3(-2.6, 3.2, 0.6), desc: "Piringan baja tahan karat tempat meletakkan benda uji untuk ditimbang massanya." },
      { id: "h-beams", name: "Tiga Lengan Skala Bertingkat", pos: new THREE.Vector3(1.4, 3.1, 0.7), desc: "Lengan 100g, lengan 10g, dan lengan 0.1g yang dilengkapi anting geser kuningan." },
      { id: "h-zero", name: "Jarum Penunjuk Keseimbangan (0)", pos: new THREE.Vector3(4.1, 2.9, 0.5), desc: "Jarum merah harus tepat sejajar dengan garis hijau di titik nol untuk memastikan neraca seimbang sempurna." }
    ];
  }

  // =========================================================================
  // 3. MODEL GELAS UKUR 3D (TRANSPARAN & MENISKUS JELAS)
  // =========================================================================
  buildGraduatedCylinder(group) {
    const clearGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.94,
      transparent: true,
      roughness: 0.04,
      ior: 1.52,
      thickness: 0.6
    });
    const liquidMat = new THREE.MeshPhysicalMaterial({
      color: 0x00f0ff,
      transmission: 0.78,
      transparent: true,
      roughness: 0.08,
      ior: 1.33
    });
    const plasticBaseMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.3, metalness: 0.4 });

    // 1. Heavy Hexagonal Base
    const baseGeo = new THREE.CylinderGeometry(1.7, 1.9, 0.4, 6);
    const base = new THREE.Mesh(baseGeo, plasticBaseMat);
    base.position.set(0, 0.2, 0);
    base.castShadow = true;
    group.add(base);

    // 2. Glass Cylinder Column
    const cylGeo = new THREE.CylinderGeometry(0.95, 0.95, 5.6, 36, 1, true);
    const cyl = new THREE.Mesh(cylGeo, clearGlassMat);
    cyl.position.set(0, 3.1, 0);
    group.add(cyl);

    // Spout & Top Rim
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.96, 0.06, 16, 36), clearGlassMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.set(0, 5.9, 0);
    group.add(rim);

    // 3. Liquid Column with Concave Meniscus
    const liqGeo = new THREE.CylinderGeometry(0.9, 0.9, 3.4, 36);
    const liq = new THREE.Mesh(liqGeo, liquidMat);
    liq.position.set(0, 2.05, 0);
    group.add(liq);

    // Curved Meniscus Surface
    const meniscus = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.84, 0.15, 36), new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.9 }));
    meniscus.position.set(0, 3.75, 0);
    group.add(meniscus);
    this.animatedObjects.cylinderMeniscus = meniscus;

    // 4. White Volume Graduations Ring
    for (let i = 1; i <= 10; i++) {
      const ringW = (i % 2 === 0) ? 0.45 : 0.25;
      const tick = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, ringW), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      tick.position.set(0.93, 0.9 + i * 0.46, 0);
      group.add(tick);
    }

    this.hotspots = [
      { id: "h-meniscus", name: "Meniskus Cekung Zat Cair", pos: new THREE.Vector3(0, 3.8, 1.2), desc: "Kelengkungan permukaan air akibat gaya adhesi dinding kaca > kohesi cairan. Skala dibaca pada bagian paling dasar cekungan." },
      { id: "h-grad", name: "Skala Mililiter (mL)", pos: new THREE.Vector3(0.95, 4.2, 0.2), desc: "Garis-garis kalibrasi presisi untuk mengukur volume larutan secara kuantitatif." },
      { id: "h-base", name: "Kaki Heksagonal Penstabil", pos: new THREE.Vector3(0, 0.4, 1.9), desc: "Dasar segi enam berat agar tabung tidak mudah berguling saat diletakkan di meja lab." }
    ];
  }

  // =========================================================================
  // 4. MODEL JANGKA SORONG 3D (STAINLESS STEEL CERAH)
  // =========================================================================
  buildVernierCaliper(group) {
    const stainlessSteel = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.95, roughness: 0.15 });
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.2 });

    // Main Scale Beam
    const beam = new THREE.Mesh(new THREE.BoxGeometry(8.0, 0.75, 0.22), stainlessSteel);
    beam.position.set(0, 2.5, 0);
    group.add(beam);

    // Fixed Outside & Inside Jaws (Left)
    const fixedLower = new THREE.Mesh(new THREE.BoxGeometry(0.75, 2.4, 0.22), stainlessSteel);
    fixedLower.position.set(-3.6, 1.1, 0);
    group.add(fixedLower);

    const fixedUpper = new THREE.Mesh(new THREE.BoxGeometry(0.65, 1.3, 0.22), stainlessSteel);
    fixedUpper.position.set(-3.6, 3.5, 0);
    group.add(fixedUpper);

    // Sliding Vernier Jaw Block
    const vernierGroup = new THREE.Group();
    vernierGroup.position.set(-1.0, 2.5, 0);

    const vBody = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.3, 0.28), stainlessSteel);
    vernierGroup.add(vBody);

    const vLower = new THREE.Mesh(new THREE.BoxGeometry(0.65, 2.4, 0.22), stainlessSteel);
    vLower.position.set(-0.55, -1.4, 0);
    vernierGroup.add(vLower);

    const vUpper = new THREE.Mesh(new THREE.BoxGeometry(0.65, 1.3, 0.22), stainlessSteel);
    vUpper.position.set(-0.55, 1.0, 0);
    vernierGroup.add(vUpper);

    const lockScrew = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.4, 16), brassMat);
    lockScrew.position.set(0.35, 0.8, 0);
    vernierGroup.add(lockScrew);

    group.add(vernierGroup);
    this.animatedObjects.vernierJaw = vernierGroup;

    // Clamped Blue Specimen
    const sample = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 1.6, 24), new THREE.MeshStandardMaterial({ color: 0x3b82f6, metalness: 0.6, roughness: 0.2 }));
    sample.position.set(-2.5, 1.1, 0);
    group.add(sample);

    this.hotspots = [
      { id: "h-outjaws", name: "Rahang Luar (Outside Jaws)", pos: new THREE.Vector3(-2.5, 1.1, 0.6), desc: "Mengukur tebal, diameter luar, dan dimensi eksternal benda padat." },
      { id: "h-injaws", name: "Rahang Dalam (Inside Jaws)", pos: new THREE.Vector3(-2.5, 3.5, 0.6), desc: "Mengukur diameter dalam pipa, rongga, atau lubang silinder." },
      { id: "h-scale", name: "Skala Utama & Nonius", pos: new THREE.Vector3(0.6, 2.6, 0.6), desc: "Skala utama dalam cm/mm dan skala nonius 0.01 cm untuk pembacaan presisi tinggi." }
    ];
  }

  // =========================================================================
  // 5. MODEL TERMOMETER LAB 3D
  // =========================================================================
  buildThermometer(group) {
    const clearGlass = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 0.94, transparent: true, roughness: 0.04, ior: 1.5 });
    const redFluid = new THREE.MeshBasicMaterial({ color: 0xef4444 });

    // Glass Stem
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 6.0, 24), clearGlass);
    stem.position.set(0, 3.2, 0);
    group.add(stem);

    // Bottom Bulb Reservoir
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.55, 24, 24), redFluid);
    bulb.position.set(0, 0.45, 0);
    group.add(bulb);

    const bulbGlass = new THREE.Mesh(new THREE.SphereGeometry(0.62, 24, 24), clearGlass);
    bulbGlass.position.set(0, 0.45, 0);
    group.add(bulbGlass);

    // Capillary Red Column
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.8, 16), redFluid);
    cap.position.set(0, 2.4, 0);
    group.add(cap);
    this.animatedObjects.thermoColumn = cap;

    // Scale Markings
    for (let i = 0; i <= 10; i++) {
      const mark = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.03, 0.03), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      mark.position.set(0.28, 1.2 + i * 0.42, 0);
      group.add(mark);
    }

    this.hotspots = [
      { id: "h-bulb", name: "Tandon Reservoir (Bulb)", pos: new THREE.Vector3(0, 0.5, 0.9), desc: "Ujung bawah berisi cairan pemuai (alkohol merah) yang peka terhadap suhu." },
      { id: "h-cap", name: "Pipa Kapiler Kaca", pos: new THREE.Vector3(0, 2.8, 0.6), desc: "Saluran sempit tempat kolom cairan merah naik-turun memuai sesuai derajat panas." },
      { id: "h-scale", name: "Skala Celsius (°C)", pos: new THREE.Vector3(0.3, 4.4, 0.4), desc: "Menunjukkan nilai suhu dari -10°C sampai 110°C yang dibaca sejajar mata." }
    ];
  }

  // =========================================================================
  // 6. MODEL PEMBAKAR BUNSEN & KAKI TIGA 3D
  // =========================================================================
  buildBunsenAndTripod(group) {
    const castIron = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.4 });
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.85, roughness: 0.2 });
    const steelMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.1 });

    // Bunsen Base & Chimney Tube
    const bBase = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.3, 0.35, 24), castIron);
    bBase.position.set(0, 0.18, 0);
    group.add(bBase);

    const bCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.5, 20), brassMat);
    bCollar.position.set(0, 0.6, 0);
    group.add(bCollar);

    const bTube = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 2.2, 20), steelMat);
    bTube.position.set(0, 1.9, 0);
    group.add(bTube);

    // Multi-layered Luminous Blue Flame
    const flameGroup = new THREE.Group();
    flameGroup.position.set(0, 3.0, 0);

    const outerFlame = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1.6, 20), new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.85 }));
    outerFlame.position.y = 0.8;
    flameGroup.add(outerFlame);

    const innerFlame = new THREE.Mesh(new THREE.ConeGeometry(0.22, 1.0, 20), new THREE.MeshBasicMaterial({ color: 0x38ef7d, transparent: true, opacity: 0.9 }));
    innerFlame.position.y = 0.5;
    flameGroup.add(innerFlame);

    group.add(flameGroup);
    this.animatedObjects.flame = flameGroup;

    // Tripod Legs & Top Ring
    const topRing = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.16, 12, 32), castIron);
    topRing.rotation.x = Math.PI / 2;
    topRing.position.set(0, 3.8, 0);
    group.add(topRing);

    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3;
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 4.0, 16), castIron);
      leg.position.set(Math.sin(angle) * 1.8, 1.9, Math.cos(angle) * 1.8);
      leg.rotation.z = Math.sin(angle) * 0.18;
      leg.rotation.x = Math.cos(angle) * -0.18;
      group.add(leg);
    }

    // Wire Gauze with Ceramic Disc
    const gauze = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.05, 3.8), new THREE.MeshStandardMaterial({ color: 0xcbd5e1, wireframe: true }));
    gauze.position.set(0, 4.0, 0);
    group.add(gauze);

    const ceramic = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.08, 24), new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.9 }));
    ceramic.position.set(0, 4.05, 0);
    group.add(ceramic);
    this.animatedObjects.ceramicHot = ceramic;

    this.hotspots = [
      { id: "h-bunsen", name: "Pembakar Bunsen & Kerah Udara", pos: new THREE.Vector3(0, 0.8, 1.0), desc: "Pengatur aliran oksigen untuk menghasilkan nyala api biru oksidasi suhu tinggi." },
      { id: "h-flame", name: "Nyala Api Oksidasi Biru", pos: new THREE.Vector3(0, 3.5, 0.5), desc: "Zona pemanasan efisien tanpa jelaga dengan suhu mencapai ~800°C." },
      { id: "h-gauze", name: "Kawat Kasa Keramik", pos: new THREE.Vector3(0, 4.1, 1.2), desc: "Menyebarkan titik panas nyala api secara merata ke seluruh dasar gelas kimia." }
    ];
  }

  // =========================================================================
  // 7. MODEL GELAS KIMIA (BEAKER) & PIPET TETES 3D
  // =========================================================================
  buildBeakerAndPipette(group) {
    const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 0.94, transparent: true, roughness: 0.05, ior: 1.5 });
    const blueFluidMat = new THREE.MeshPhysicalMaterial({ color: 0x00a8ff, transmission: 0.8, transparent: true, roughness: 0.1 });
    const rubberBulbMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 });

    // Beaker Glass Body
    const beaker = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.5, 3.8, 36, 1, true), glassMat);
    beaker.position.set(0, 2.0, 0);
    group.add(beaker);

    const beakerBottom = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.12, 36), glassMat);
    beakerBottom.position.set(0, 0.16, 0);
    group.add(beakerBottom);

    // Liquid in Beaker
    const liquid = new THREE.Mesh(new THREE.CylinderGeometry(1.48, 1.48, 2.2, 36), blueFluidMat);
    liquid.position.set(0, 1.2, 0);
    group.add(liquid);

    // Dropper Pipette Suspended Above
    const pipStem = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.05, 3.2, 20), glassMat);
    pipStem.position.set(0.6, 5.0, 0.4);
    pipStem.rotation.z = -0.2;
    group.add(pipStem);

    const rubberBulb = new THREE.Mesh(new THREE.SphereGeometry(0.35, 20, 20), rubberBulbMat);
    rubberBulb.position.set(0.9, 6.6, 0.4);
    group.add(rubberBulb);

    // Falling Droplet
    const drop = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), blueFluidMat);
    drop.position.set(0.3, 3.2, 0.4);
    group.add(drop);
    this.animatedObjects.droplet = drop;

    this.hotspots = [
      { id: "h-beaker", name: "Gelas Kimia (Beaker Glass)", pos: new THREE.Vector3(0, 2.2, 1.8), desc: "Wadah penampung, melarutkan padatan, dan mencampur larutan reaksi kimia." },
      { id: "h-pipette", name: "Pipet Tetes (Dropper)", pos: new THREE.Vector3(0.8, 5.8, 0.7), desc: "Mengambil dan meneteskan larutan cairan kimia dalam jumlah kecil secara presisi." }
    ];
  }

  // =========================================================================
  // 8. MODEL LABU ERLENMEYER 3D
  // =========================================================================
  buildErlenmeyer(group) {
    const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 0.94, transparent: true, roughness: 0.05, ior: 1.5 });
    const purpleFluidMat = new THREE.MeshPhysicalMaterial({ color: 0xa855f7, transmission: 0.8, transparent: true, roughness: 0.1 });

    const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 2.4, 3.6, 36, 1, true), glassMat);
    cone.position.set(0, 2.1, 0);
    group.add(cone);

    const bottom = new THREE.Mesh(new THREE.CylinderGeometry(2.38, 2.38, 0.15, 36), glassMat);
    bottom.position.set(0, 0.35, 0);
    group.add(bottom);

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 1.8, 36, 1, true), glassMat);
    neck.position.set(0, 4.6, 0);
    group.add(neck);

    const fluid = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 2.3, 2.0, 36), purpleFluidMat);
    fluid.position.set(0, 1.4, 0);
    group.add(fluid);

    // Rising Bubbles
    const bubblesGroup = new THREE.Group();
    for (let i = 0; i < 8; i++) {
      const bubble = new THREE.Mesh(new THREE.SphereGeometry(0.08 + Math.random() * 0.05, 12, 12), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 }));
      bubble.position.set((Math.random() - 0.5) * 2.0, 0.6 + Math.random() * 1.6, (Math.random() - 0.5) * 2.0);
      bubblesGroup.add(bubble);
    }
    group.add(bubblesGroup);
    this.animatedObjects.bubbles = bubblesGroup;

    this.hotspots = [
      { id: "h-erlen", name: "Labu Erlenmeyer Kerucut", pos: new THREE.Vector3(0, 2.2, 1.6), desc: "Bentuk kerucut leher sempit ideal untuk mengocok larutan tanpa risiko tumpah dan proses titrasi." }
    ];
  }

  // =========================================================================
  // 9. MODEL RAK TABUNG REAKSI 3D
  // =========================================================================
  buildTestTubeRack(group) {
    const woodMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.5 });
    const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 0.95, transparent: true, roughness: 0.05, ior: 1.5 });
    const fluidColors = [0x3b82f6, 0xef4444, 0x10b981, 0xf59e0b];

    // Wooden Rack
    const basePlate = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.35, 2.2), woodMat);
    basePlate.position.set(0, 0.2, 0);
    group.add(basePlate);

    const topPlate = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.3, 2.2), woodMat);
    topPlate.position.set(0, 2.8, 0);
    group.add(topPlate);

    const sideL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 2.8, 2.2), woodMat);
    sideL.position.set(-3.0, 1.5, 0);
    group.add(sideL);

    const sideR = new THREE.Mesh(new THREE.BoxGeometry(0.35, 2.8, 2.2), woodMat);
    sideR.position.set(3.0, 1.5, 0);
    group.add(sideR);

    // 4 Test Tubes with Reagents
    for (let i = 0; i < 4; i++) {
      const posX = -1.8 + i * 1.2;
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 3.6, 24), glassMat);
      tube.position.set(posX, 2.2, 0);
      group.add(tube);

      const fluid = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 1.8, 24), new THREE.MeshPhysicalMaterial({ color: fluidColors[i], transmission: 0.8, transparent: true }));
      fluid.position.set(posX, 1.3, 0);
      group.add(fluid);
    }

    this.hotspots = [
      { id: "h-rack", name: "Rak Tabung Kayu", pos: new THREE.Vector3(-2.8, 2.8, 1.0), desc: "Menjaga tabung reaksi tetap tegak dan tersusun rapi saat pengamatan." },
      { id: "h-tube", name: "Tabung Reaksi Reagen", pos: new THREE.Vector3(0, 3.2, 0.6), desc: "Wadah mereaksikan zat kimia skala mikro/semi-mikro." }
    ];
  }

  // =========================================================================
  // 10. MODEL CAWAN PETRI 3D
  // =========================================================================
  buildPetriDish(group) {
    const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 0.95, transparent: true, roughness: 0.05, ior: 1.5 });
    const agarMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.3, transparent: true, opacity: 0.85 });

    const dish = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 0.5, 36, 1, true), glassMat);
    dish.position.set(0, 0.6, 0);
    group.add(dish);

    const agar = new THREE.Mesh(new THREE.CylinderGeometry(2.52, 2.52, 0.25, 36), agarMat);
    agar.position.set(0, 0.5, 0);
    group.add(agar);

    // Bacterial colonies
    const cols = [0xef4444, 0x06b6d4, 0x10b981, 0xf59e0b];
    for (let i = 0; i < 14; i++) {
      const rad = 0.12 + Math.random() * 0.18;
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 1.8;
      const colMesh = new THREE.Mesh(new THREE.SphereGeometry(rad, 16, 8), new THREE.MeshStandardMaterial({ color: cols[i % 4], roughness: 0.2 }));
      colMesh.scale.set(1, 0.4, 1);
      colMesh.position.set(Math.cos(angle) * dist, 0.65, Math.sin(angle) * dist);
      group.add(colMesh);
    }

    const lidGroup = new THREE.Group();
    lidGroup.position.set(0.4, 1.2, 0);
    lidGroup.rotation.z = 0.15;
    const lidCyl = new THREE.Mesh(new THREE.CylinderGeometry(2.75, 2.75, 0.45, 36, 1, true), glassMat);
    lidGroup.add(lidCyl);
    group.add(lidGroup);
    this.animatedObjects.petriLid = lidGroup;

    this.hotspots = [
      { id: "h-agar", name: "Media Agar & Koloni", pos: new THREE.Vector3(0, 0.7, 0), desc: "Gel nutrisi tempat perkembangbiakan koloni mikroorganisme biologi." }
    ];
  }

  // =========================================================================
  // 11. MODEL LUP (KACA PEMBESAR) 3D
  // =========================================================================
  buildMagnifyingGlass(group) {
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.92, roughness: 0.15 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.5 });
    const lensMat = new THREE.MeshPhysicalMaterial({ color: 0xa5f3fc, transmission: 0.9, transparent: true, roughness: 0.04, ior: 1.6 });

    const rim = new THREE.Mesh(new THREE.TorusGeometry(2.0, 0.18, 16, 48), brassMat);
    rim.position.set(0, 3.0, 0);
    group.add(rim);

    const lensGeo = new THREE.SphereGeometry(2.0, 32, 16);
    lensGeo.scale(1, 1, 0.18);
    const lens = new THREE.Mesh(lensGeo, lensMat);
    lens.position.set(0, 3.0, 0);
    group.add(lens);

    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.25, 2.4, 20), woodMat);
    handle.position.set(0, -0.6, 0);
    group.add(handle);

    this.hotspots = [
      { id: "h-lens", name: "Lensa Bikonveks Cembung", pos: new THREE.Vector3(0, 3.0, 0.5), desc: "Lensa cembung optik berkualitas tinggi untuk menghasilkan bayangan maya diperbesar." }
    ];
  }

  // =========================================================================
  // 12. MODEL KAKI TIGA & KASA 3D
  // =========================================================================
  buildTripodAndGauze(group) {
    this.buildBunsenAndTripod(group);
  }

  // =========================================================================
  // 13. MODEL BATANG PENGADUK 3D
  // =========================================================================
  buildStirringRod(group) {
    const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 0.95, transparent: true, roughness: 0.05, ior: 1.5 });
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 6.0, 20), glassMat);
    rod.position.set(0, 3.0, 0);
    rod.rotation.z = 0.2;
    group.add(rod);
    this.animatedObjects.stirringRod = rod;

    this.hotspots = [
      { id: "h-rod", name: "Batang Pengaduk Borosilikat", pos: new THREE.Vector3(0, 3.0, 0.5), desc: "Kaca pejal untuk mengaduk larutan dan membantu dekantasi cairan." }
    ];
  }

  // =========================================================================
  // 14. MODEL CORONG KACA 3D
  // =========================================================================
  buildFunnel(group) {
    const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 0.94, transparent: true, roughness: 0.05, ior: 1.5 });
    const paperMat = new THREE.MeshStandardMaterial({ color: 0xfef9c3, roughness: 0.8 });

    const cone = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 0.35, 2.5, 36, 1, true), glassMat);
    cone.position.set(0, 3.6, 0);
    group.add(cone);

    const paper = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 0.32, 2.3, 36, 1, true), paperMat);
    paper.position.set(0, 3.6, 0);
    group.add(paper);

    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 2.4, 20, 1, true), glassMat);
    stem.position.set(0, 1.4, 0);
    group.add(stem);

    this.hotspots = [
      { id: "h-funnel", name: "Corong Kaca & Kertas Saring", pos: new THREE.Vector3(0, 3.6, 1.5), desc: "Peralatan pemisahan campuran heterogen (filtrasi)." }
    ];
  }

  // =========================================================================
  // HOTSPOTS & ANIMATION CONTROLS
  // =========================================================================
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

    const targetPos = new THREE.Vector3(h.pos.x * 1.3, h.pos.y + 0.6, h.pos.z + 4.2);
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
        this.animatedObjects.droplet.position.y = 3.2;
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

    // Micro Animations
    if (this.currentModelType === 'bunsen' && this.animatedObjects.flame && this.animatedObjects.flame.visible) {
      const flicker = Math.sin(elapsedTime * 15) * 0.08 + Math.cos(elapsedTime * 23) * 0.05;
      this.animatedObjects.flame.scale.set(1 + flicker, 1 + flicker * 1.5, 1 + flicker);
    }

    if (this.currentModelType === 'gelas-kimia' && this.animatedObjects.droplet) {
      this.animatedObjects.droplet.position.y -= 0.035;
      if (this.animatedObjects.droplet.position.y < 1.4) {
        this.animatedObjects.droplet.position.y = 3.2;
      }
    }

    if ((this.currentModelType === 'erlenmeyer' || this.currentModelType === 'labu-erlenmeyer') && this.animatedObjects.bubbles) {
      this.animatedObjects.bubbles.children.forEach((b, i) => {
        b.position.y += 0.015 + (i % 3) * 0.005;
        if (b.position.y > 2.2) b.position.y = 0.6;
      });
    }

    this.renderer.render(this.scene, this.camera);
  }
}

window.Lab3DViewer = Lab3DViewer;
