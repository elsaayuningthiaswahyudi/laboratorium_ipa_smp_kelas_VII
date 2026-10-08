// 3D Laboratory Apparatus Generator using Three.js
// Ultra-High-Fidelity Models, Studio Illumination, Razor-Sharp Scale Decals & Opaque Readouts

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
    this.flameLight = null;

    if (this.container) {
      this.init();
    }
  }

  // =========================================================================
  // PROCEDURAL HIGH-DPI SCALE TEXTURE GENERATORS (100% SHARP & READABLE)
  // =========================================================================
  createTextureCanvas(width, height, drawFn) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    drawFn(ctx, width, height);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.needsUpdate = true;
    return texture;
  }

  // 1. Gelas Ukur: Skala Putih & Biru Kontras Tinggi
  createGraduationTextureCylinder() {
    return this.createTextureCanvas(512, 1024, (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);

      // Semi-translucent white frost calibration background strip
      ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.fillRect(w * 0.1, 40, w * 0.8, h - 80);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
      ctx.lineWidth = 3;
      ctx.strokeRect(w * 0.1, 40, w * 0.8, h - 80);

      // Header Text
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.font = 'bold 32px Inter, Arial, sans-serif';
      ctx.fillText('100 mL', w / 2, 85);
      ctx.font = '22px Inter, Arial, sans-serif';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('In 20°C ±1mL', w / 2, 120);

      // Scale ticks & numbers (10 to 100 mL)
      ctx.textAlign = 'left';
      for (let i = 10; i <= 100; i += 2) {
        const y = (h - 120) - ((i - 10) / 90) * (h - 280);
        const isMajor = (i % 10 === 0);
        const isMid = (i % 5 === 0 && !isMajor);

        // Tick line
        ctx.beginPath();
        const lineLen = isMajor ? 140 : (isMid ? 90 : 55);
        ctx.lineWidth = isMajor ? 6 : (isMid ? 4 : 2.5);
        ctx.strokeStyle = isMajor ? '#ffffff' : (isMid ? '#e0f2fe' : '#93c5fd');
        ctx.moveTo(w * 0.15, y);
        ctx.lineTo(w * 0.15 + lineLen, y);
        ctx.stroke();

        // Major Number with text shadow
        if (isMajor) {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 44px Inter, Arial, sans-serif';
          ctx.shadowColor = '#000000';
          ctx.shadowBlur = 6;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;
          ctx.fillText(i.toString(), w * 0.15 + lineLen + 20, y + 14);
          ctx.shadowColor = 'transparent';
        }
      }
    });
  }

  // 2. Beaker / Gelas Kimia: Skala Putih Enamel Tebal
  createBeakerTexture() {
    return this.createTextureCanvas(512, 512, (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);

      // White frosted patch
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.fillRect(40, 50, 160, 90);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.strokeRect(40, 50, 160, 90);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px Inter, Arial, sans-serif';
      ctx.fillText('BORO 3.3', 55, 95);
      ctx.font = 'bold 20px Inter, Arial, sans-serif';
      ctx.fillText('APPROX 250ml', 55, 125);

      // Graduation marks
      const marks = [
        { vol: '200', y: 170 },
        { vol: '150', y: 250 },
        { vol: '100', y: 330 },
        { vol: '50',  y: 410 }
      ];

      marks.forEach(m => {
        ctx.beginPath();
        ctx.lineWidth = 6;
        ctx.strokeStyle = '#ffffff';
        ctx.moveTo(w - 40, m.y);
        ctx.lineTo(w - 180, m.y);
        ctx.stroke();

        ctx.font = 'bold 36px Inter, Arial, sans-serif';
        ctx.textAlign = 'right';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 6;
        ctx.fillText(m.vol, w - 200, m.y + 12);
        ctx.shadowColor = 'transparent';
      });
    });
  }

  // 3. Jangka Sorong: Skala Metrik 0-15 cm Bergaris Tajam
  createVernierScaleTexture() {
    return this.createTextureCanvas(1024, 256, (ctx, w, h) => {
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(0, 0, w, h);

      // Boundary Line
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, h - 25);
      ctx.lineTo(w, h - 25);
      ctx.stroke();

      ctx.fillStyle = '#0f172a';
      ctx.textAlign = 'center';

      for (let cm = 0; cm <= 15; cm++) {
        for (let mm = 0; mm < 10; mm++) {
          if (cm === 15 && mm > 0) break;
          const x = 40 + (cm * 10 + mm) * 6.2;
          const isCm = mm === 0;
          const isMid = mm === 5;

          ctx.lineWidth = isCm ? 4 : (isMid ? 2.5 : 1.5);
          const yLen = isCm ? 80 : (isMid ? 55 : 35);

          ctx.beginPath();
          ctx.moveTo(x, h - 25);
          ctx.lineTo(x, h - 25 - yLen);
          ctx.stroke();

          if (isCm) {
            ctx.font = 'bold 30px Inter, Arial, sans-serif';
            ctx.fillText(cm.toString(), x, h - 125);
          }
        }
      }

      ctx.font = 'bold 24px Inter, Arial, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('cm (0.05 mm)', w - 40, 50);
    });
  }

  // 4. Termometer: Skala Celsius Kuning-Hitam Kontras Maksimal
  createThermometerScaleTexture() {
    return this.createTextureCanvas(256, 1024, (ctx, w, h) => {
      // Solid bright yellow enamel background
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(0, 0, w, h);

      // Red center capillary line channel
      ctx.fillStyle = '#fee2e2';
      ctx.fillRect(w / 2 - 8, 40, 16, h - 80);

      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#0f172a';
      ctx.textAlign = 'right';

      for (let t = -10; t <= 110; t += 2) {
        const y = h - 90 - ((t + 10) / 120) * (h - 180);
        const isMajor = (t % 10 === 0);
        const isMid = (t % 5 === 0 && !isMajor);

        ctx.lineWidth = isMajor ? 4 : (isMid ? 2.5 : 1.5);
        const len = isMajor ? 45 : (isMid ? 30 : 18);

        // Right side ticks
        ctx.beginPath();
        ctx.moveTo(w / 2 + 10, y);
        ctx.lineTo(w / 2 + 10 + len, y);
        ctx.stroke();

        // Left side ticks
        ctx.beginPath();
        ctx.moveTo(w / 2 - 10, y);
        ctx.lineTo(w / 2 - 10 - len, y);
        ctx.stroke();

        if (isMajor) {
          ctx.font = 'bold 28px Inter, Arial, sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(t.toString(), w / 2 + 10 + len + 8, y + 9);
        }
      }

      ctx.font = 'bold 36px Inter, Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#b91c1c';
      ctx.fillText('°C', w / 2, 48);
    });
  }

  // =========================================================================
  // INITIALIZATION & STUDIO ENVIRONMENT
  // =========================================================================
  init() {
    // 1. Scene setup with rich studio depth
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0f1c3f);

    // 2. Camera setup
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(42, aspect, 0.1, 1000);
    this.camera.position.set(0, 3.8, 8.5);

    // 3. Renderer with ACES Filmic tone mapping for bright, vivid clarity
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    if (THREE.ACESFilmicToneMapping) {
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.48;
    }
    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    // 4. OrbitControls
    if (THREE.OrbitControls) {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.06;
      this.controls.maxDistance = 20;
      this.controls.minDistance = 2.0;
      this.controls.maxPolarAngle = Math.PI / 2 + 0.05;
    }

    // 5. Studio Multi-Light Rig
    this.setupLighting();

    // 6. Studio Pedestal & Grid
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
    // 1. Bright White Studio Ambient Light
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.8);
    this.scene.add(ambientLight);

    // 2. Hemisphere Light (Soft Sky White / Slate Ground bounce)
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x475569, 1.5);
    hemiLight.position.set(0, 20, 0);
    this.scene.add(hemiLight);

    // 3. Main Key Light (Top-Front-Right)
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.8);
    keyLight.position.set(6, 14, 8);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.001;
    this.scene.add(keyLight);

    // 4. Front-Left Soft Fill Light
    const fillLight = new THREE.DirectionalLight(0xf0f9ff, 2.0);
    fillLight.position.set(-8, 8, 7);
    this.scene.add(fillLight);

    // 5. Rim / Edge Back Light
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.5);
    rimLight.position.set(0, 10, -9);
    this.scene.add(rimLight);

    // 6. Direct Top Light
    const topLight = new THREE.DirectionalLight(0xffffff, 1.2);
    topLight.position.set(0, 15, 0);
    this.scene.add(topLight);

    // 7. Dynamic Flame Point Light
    this.flameLight = new THREE.PointLight(0x00f0ff, 0, 8);
    this.flameLight.position.set(0, 1.8, 0);
    this.scene.add(this.flameLight);
  }

  setupEnvironment() {
    // Holographic Benchtop Grid
    const gridHelper = new THREE.GridHelper(18, 18, 0x00f0ff, 0x1e3a8a);
    gridHelper.position.y = -2;
    this.scene.add(gridHelper);

    // Studio Pedestal Platform with Bright Beveled Edge
    const pedGeo = new THREE.CylinderGeometry(4.8, 5.2, 0.4, 48);
    const pedMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.25,
      metalness: 0.5,
      emissive: 0x0f172a
    });
    const pedestal = new THREE.Mesh(pedGeo, pedMat);
    pedestal.position.y = -2.2;
    pedestal.receiveShadow = true;
    this.scene.add(pedestal);

    // Glowing Cyan Bezel Ring
    const ringGeo = new THREE.RingGeometry(4.7, 4.9, 48);
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
    if (this.flameLight) this.flameLight.intensity = 0;

    // Remove old model
    if (this.currentModelGroup) {
      this.scene.remove(this.currentModelGroup);
      this.currentModelGroup = null;
    }
    this.clearHotspots();

    const group = new THREE.Group();
    group.position.y = -2;

    let targetCamPos = new THREE.Vector3(0, 3.8, 8.5);
    let targetLook = new THREE.Vector3(0, 2.0, 0);

    switch (type) {
      case 'mikroskop':
        this.buildMicroscope(group);
        targetCamPos.set(0, 3.5, 7.8);
        targetLook.set(0, 2.4, 0);
        break;
      case 'bunsen':
      case 'bunsen-spiritus':
        this.buildBunsenAndTripod(group);
        targetCamPos.set(0, 3.2, 7.6);
        targetLook.set(0, 2.3, 0);
        break;
      case 'gelas-kimia':
        this.buildBeakerAndPipette(group);
        targetCamPos.set(0, 3.0, 7.0);
        targetLook.set(0, 2.0, 0);
        break;
      case 'neraca':
      case 'neraca-ohaus':
        this.buildOhausBalance(group);
        targetCamPos.set(0, 3.0, 7.8);
        targetLook.set(0, 1.8, 0);
        break;
      case 'tabung-reaksi':
        this.buildTestTubeRack(group);
        targetCamPos.set(0, 2.8, 7.2);
        targetLook.set(0, 1.8, 0);
        break;
      case 'gelas-ukur':
        this.buildGraduatedCylinder(group);
        targetCamPos.set(0, 3.2, 6.8);
        targetLook.set(0, 2.6, 0);
        break;
      case 'erlenmeyer':
      case 'labu-erlenmeyer':
        this.buildErlenmeyer(group);
        targetCamPos.set(0, 2.8, 7.0);
        targetLook.set(0, 2.0, 0);
        break;
      case 'termometer':
      case 'termometer-lab':
        this.buildThermometer(group);
        targetCamPos.set(0, 3.0, 6.5);
        targetLook.set(0, 2.6, 0);
        break;
      case 'jangka-sorong':
        this.buildVernierCaliper(group);
        targetCamPos.set(0, 2.5, 6.8);
        targetLook.set(0, 2.0, 0);
        break;
      case 'lup':
        this.buildMagnifyingGlass(group);
        targetCamPos.set(0, 2.5, 6.5);
        targetLook.set(0, 2.0, 0);
        break;
      case 'cawan-petri':
        this.buildPetriDish(group);
        targetCamPos.set(0, 3.5, 6.5);
        targetLook.set(0, 1.2, 0);
        break;
      case 'kaki-tiga':
      case 'kawat-kasa':
        this.buildTripodAndGauze(group);
        targetCamPos.set(0, 3.2, 7.6);
        targetLook.set(0, 2.3, 0);
        break;
      case 'batang-pengaduk':
        this.buildStirringRod(group);
        targetCamPos.set(0, 2.5, 6.5);
        targetLook.set(0, 1.8, 0);
        break;
      case 'corong':
      case 'corong-kaca':
        this.buildFunnel(group);
        targetCamPos.set(0, 3.0, 7.0);
        targetLook.set(0, 2.2, 0);
        break;
      default:
        this.buildMicroscope(group);
    }

    this.currentModelGroup = group;
    this.scene.add(group);

    // Frame model prominently
    this.camera.position.copy(targetCamPos);
    if (this.controls) {
      this.controls.target.copy(targetLook);
      this.controls.update();
    }

    // Render Hotspots in UI
    this.updateHotspotUI();
    this.updateActionButtonLabel();
  }

  // =========================================================================
  // 1. MODEL GELAS UKUR 3D (SKALA OPAQUE 100% TERANG & MENISKUS JELAS)
  // =========================================================================
  buildGraduatedCylinder(group) {
    // Glass Material with visible cyan edges & reflections
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0xe0f2fe,
      transparent: true,
      opacity: 0.45,
      roughness: 0.1,
      metalness: 0.2,
      side: THREE.DoubleSide
    });
    
    // Rich, Solid Blue Aqueous Solution (50 mL)
    const liquidMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.86,
      roughness: 0.15,
      metalness: 0.1
    });

    const plasticBaseMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.25, metalness: 0.4 });

    // 1. Heavy Royal Blue Hexagonal Base
    const baseGeo = new THREE.CylinderGeometry(2.0, 2.2, 0.5, 6);
    const base = new THREE.Mesh(baseGeo, plasticBaseMat);
    base.position.set(0, 0.25, 0);
    base.castShadow = true;
    group.add(base);

    // 2. Clear Glass Cylinder Body
    const cylGeo = new THREE.CylinderGeometry(1.05, 1.05, 6.6, 48, 1, true);
    const cyl = new THREE.Mesh(cylGeo, glassMat);
    cyl.position.set(0, 3.6, 0);
    group.add(cyl);

    const cylBottom = new THREE.Mesh(new THREE.CylinderGeometry(1.03, 1.03, 0.18, 36), glassMat);
    cylBottom.position.set(0, 0.4, 0);
    group.add(cylBottom);

    // Molded Spout & Glass Rim
    const rim = new THREE.Mesh(new THREE.TorusGeometry(1.06, 0.09, 16, 36), glassMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.set(0, 6.9, 0);
    group.add(rim);

    // Safety Yellow Hexagonal Bumper Collar
    const bumper = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.35, 0.3, 6), new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.35 }));
    bumper.position.set(0, 6.35, 0);
    group.add(bumper);

    // 3. Dedicated High-Contrast Opaque Scale Decal Banner (100% Crisp & Visible!)
    const scaleTex = this.createGraduationTextureCylinder();
    const scaleBannerGeo = new THREE.PlaneGeometry(1.5, 5.8);
    const scaleBannerMat = new THREE.MeshBasicMaterial({
      map: scaleTex,
      transparent: true,
      opacity: 1.0,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const scaleBanner = new THREE.Mesh(scaleBannerGeo, scaleBannerMat);
    scaleBanner.position.set(0, 3.55, 1.08);
    group.add(scaleBanner);

    // 4. Solid Blue Liquid Column (Up to 50 mL mark)
    const liqGeo = new THREE.CylinderGeometry(1.0, 1.0, 3.4, 36);
    const liq = new THREE.Mesh(liqGeo, liquidMat);
    liq.position.set(0, 2.1, 0);
    group.add(liq);

    // Glowing Cyan Meniscus Curve Surface
    const meniscus = new THREE.Mesh(
      new THREE.CylinderGeometry(1.0, 0.88, 0.18, 36),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide })
    );
    meniscus.position.set(0, 3.75, 0);
    group.add(meniscus);
    this.animatedObjects.cylinderMeniscus = meniscus;

    this.hotspots = [
      { id: "h-meniscus", name: "Meniskus Cekung Zat Cair", pos: new THREE.Vector3(0, 3.8, 1.2), desc: "Kelengkungan permukaan air akibat gaya adhesi dinding kaca > kohesi cairan. Pembacaan volume yang benar selalu diambil pada dasar cekungan." },
      { id: "h-scale", name: "Skala Mililiter (10 - 100 mL)", pos: new THREE.Vector3(0.9, 4.4, 0.8), desc: "Garis-garis kalibrasi presisi dengan interval 1 mL untuk mengukur volume zat cair secara kuantitatif." },
      { id: "h-bumper", name: "Cincin Pelindung Plastik (Bumper)", pos: new THREE.Vector3(0, 6.35, 1.2), desc: "Cincin segi enam pelindung benturan untuk mencegah bibir kaca pecah saat terbentur atau terjatuh." }
    ];
  }

  // =========================================================================
  // 2. MODEL MIKROSKOP CAHAYA 3D (ULTRA-DETAILED)
  // =========================================================================
  buildMicroscope(group) {
    const whiteEnamel = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.15, metalness: 0.1 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.95, roughness: 0.08 });
    const blackStageMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.35, metalness: 0.2 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0xa5f3fc, transparent: true, opacity: 0.6, roughness: 0.05 });

    // 1. Heavy Base Stand with Anti-Slip Foot Pads
    const baseGeo = new THREE.BoxGeometry(3.6, 0.7, 4.0);
    const base = new THREE.Mesh(baseGeo, whiteEnamel);
    base.position.set(0, 0.35, 0);
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    // Front Brightness Dimmer Knob on Base
    const dimmerKnob = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.2, 20), blackStageMat);
    dimmerKnob.rotation.x = Math.PI / 2;
    dimmerKnob.position.set(1.1, 0.35, 1.95);
    group.add(dimmerKnob);

    // 2. Pillar & Curved Arm
    const pillarGeo = new THREE.CylinderGeometry(0.6, 0.7, 2.6, 24);
    const pillar = new THREE.Mesh(pillarGeo, whiteEnamel);
    pillar.position.set(0, 1.7, -1.3);
    group.add(pillar);

    // Ergonomic Curved Arm
    const armCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 2.0, -1.3),
      new THREE.Vector3(0, 3.9, -1.6),
      new THREE.Vector3(0, 5.1, -0.9),
      new THREE.Vector3(0, 5.3, 0.0)
    ]);
    const armGeo = new THREE.TubeGeometry(armCurve, 32, 0.55, 20, false);
    const arm = new THREE.Mesh(armGeo, whiteEnamel);
    arm.castShadow = true;
    group.add(arm);

    // Dual Coaxial Focusing Knobs
    const coarseKnobGeo = new THREE.CylinderGeometry(0.65, 0.65, 0.45, 24);
    const fineKnobGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.7, 24);

    [-1.0, 1.0].forEach(side => {
      const coarse = new THREE.Mesh(coarseKnobGeo, chromeMat);
      coarse.rotation.z = Math.PI / 2;
      coarse.position.set(side * 0.95, 2.3, -1.3);
      group.add(coarse);

      const fine = new THREE.Mesh(fineKnobGeo, blackStageMat);
      fine.rotation.z = Math.PI / 2;
      fine.position.set(side * 1.2, 2.3, -1.3);
      group.add(fine);
    });

    // 3. Stage (Meja Preparat) with Glass Slide & Specimen
    const stage = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.22, 3.0), blackStageMat);
    stage.position.set(0, 2.9, 0.2);
    stage.castShadow = true;
    group.add(stage);

    // Mechanical Stage Clips
    [-0.9, 0.9].forEach((x, i) => {
      const clip = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.07, 1.3), chromeMat);
      clip.position.set(x, 3.05, 0.3);
      clip.rotation.y = (i === 0 ? 0.3 : -0.3);
      group.add(clip);
    });

    // Glass Slide with stained pink/purple cell specimen
    const slide = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.04, 0.9), glassMat);
    slide.position.set(0, 3.04, 0.2);
    group.add(slide);

    const coverslip = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.05, 0.7), new THREE.MeshBasicMaterial({ color: 0xe879f9 }));
    coverslip.position.set(0, 3.05, 0.2);
    group.add(coverslip);

    // 4. Substage Condenser & LED Light Source
    const condenser = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.6, 24), blackStageMat);
    condenser.position.set(0, 2.4, 0.2);
    group.add(condenser);

    const ledHousing = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.75, 0.55, 24), chromeMat);
    ledHousing.position.set(0, 0.95, 0.2);
    group.add(ledHousing);

    const ledBulb = new THREE.Mesh(new THREE.SphereGeometry(0.32, 20, 20), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    ledBulb.position.set(0, 1.2, 0.2);
    group.add(ledBulb);

    // 5. Eyepiece Tube & Angled Head
    const tubeGeo = new THREE.CylinderGeometry(0.4, 0.4, 2.5, 24);
    const tube = new THREE.Mesh(tubeGeo, whiteEnamel);
    tube.position.set(0, 5.4, 0.3);
    tube.rotation.x = -0.18;
    group.add(tube);

    const eyepiece = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.42, 0.9, 24), blackStageMat);
    eyepiece.position.set(0, 6.7, 0.12);
    eyepiece.rotation.x = -0.18;
    group.add(eyepiece);

    const eyecup = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.08, 16, 24), blackStageMat);
    eyecup.position.set(0, 7.15, 0.04);
    eyecup.rotation.x = Math.PI / 2 - 0.18;
    group.add(eyecup);

    // 6. Revolving Nosepiece with 3 Color-Coded Objectives
    const noseGroup = new THREE.Group();
    noseGroup.position.set(0, 4.15, 0.52);

    const nosePlate = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.6, 0.4, 28), chromeMat);
    noseGroup.add(nosePlate);

    const objSpecs = [
      { len: 0.95, col: 0xef4444, label: '4x' },   // Red
      { len: 1.3,  col: 0xf59e0b, label: '10x' },  // Yellow
      { len: 1.65, col: 0x3b82f6, label: '40x' }   // Blue
    ];

    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3;
      const objGroup = new THREE.Group();
      objGroup.position.set(Math.sin(angle) * 0.52, -0.2, Math.cos(angle) * 0.52);

      const objMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.14, objSpecs[i].len, 20), chromeMat);
      objMesh.position.y = -objSpecs[i].len / 2;
      objGroup.add(objMesh);

      // Color Band Ring
      const bandMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.1, 20), new THREE.MeshBasicMaterial({ color: objSpecs[i].col }));
      bandMesh.position.y = -objSpecs[i].len * 0.7;
      objGroup.add(bandMesh);

      noseGroup.add(objGroup);
    }
    group.add(noseGroup);
    this.animatedObjects.revolver = noseGroup;

    this.hotspots = [
      { id: "h-eyepiece", name: "Lensa Okuler (Eyepiece 10x)", pos: new THREE.Vector3(0, 6.8, 0.4), desc: "Lensa pada ujung atas tabung mikroskop tempat mata pengamat melihat perbesaran bayangan maya tegak." },
      { id: "h-revolver", name: "Revolver & 3 Lensa Objektif", pos: new THREE.Vector3(0, 3.9, 1.2), desc: "Cakram putar dengan 3 lensa objektif berkode warna internasional: 4x (merah), 10x (kuning), dan 40x (biru)." },
      { id: "h-stage", name: "Meja Preparat & Kaca Objek", pos: new THREE.Vector3(0, 3.0, 1.0), desc: "Permukaan datar tempat meletakkan kaca preparat spesimen yang dijepit kuat." },
      { id: "h-knobs", name: "Makrometer & Mikrometer Koaksial", pos: new THREE.Vector3(-1.4, 2.3, -1.1), desc: "Pemutar kasar (makrometer) dan pemutar halus (mikrometer) untuk menaik-turunkan fokus secara presisi." }
    ];
  }

  // =========================================================================
  // 3. MODEL PEMBAKAR BUNSEN & KAKI TIGA (LENGKAP DENGAN BEAKER PEMANASAN)
  // =========================================================================
  buildBunsenAndTripod(group) {
    const castIron = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.35 });
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.2 });
    const steelMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.95, roughness: 0.1 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.45, roughness: 0.1, metalness: 0.2 });
    const waterMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, transparent: true, opacity: 0.82, roughness: 0.15 });

    // 1. Bunsen Base (Heavy Hexagonal Base with Hose Inlet)
    const bBase = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, 0.4, 6), castIron);
    bBase.position.set(0, 0.2, 0);
    bBase.castShadow = true;
    group.add(bBase);

    // Gas Hose Connector Spigot
    const spigot = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.8, 16), brassMat);
    spigot.rotation.z = Math.PI / 2;
    spigot.position.set(-1.4, 0.2, 0);
    group.add(spigot);

    // Rotating Brass Air Collar with Air Intake Ports
    const bCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.55, 20), brassMat);
    bCollar.position.set(0, 0.65, 0);
    group.add(bCollar);

    // Vertical Stainless Steel Chimney Barrel
    const bTube = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 2.4, 24), steelMat);
    bTube.position.set(0, 2.0, 0);
    group.add(bTube);

    // 2. Realistic Dynamic 3D Flame
    const flameGroup = new THREE.Group();
    flameGroup.position.set(0, 3.2, 0);

    const outerFlame = new THREE.Mesh(
      new THREE.ConeGeometry(0.45, 1.8, 24),
      new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.85 })
    );
    outerFlame.position.y = 0.9;
    flameGroup.add(outerFlame);

    const innerFlame = new THREE.Mesh(
      new THREE.ConeGeometry(0.25, 1.1, 24),
      new THREE.MeshBasicMaterial({ color: 0x38ef7d, transparent: true, opacity: 0.95 })
    );
    innerFlame.position.y = 0.55;
    flameGroup.add(innerFlame);

    group.add(flameGroup);
    this.animatedObjects.flame = flameGroup;

    // 3. Sturdy Laboratory Tripod Stand
    const tripodGroup = new THREE.Group();
    const topRing = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.18, 16, 36), castIron);
    topRing.rotation.x = Math.PI / 2;
    topRing.position.set(0, 4.4, 0);
    tripodGroup.add(topRing);

    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3;
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 4.6, 16), castIron);
      leg.position.set(Math.sin(angle) * 1.9, 2.2, Math.cos(angle) * 1.9);
      leg.rotation.z = Math.sin(angle) * 0.18;
      leg.rotation.x = Math.cos(angle) * -0.18;
      tripodGroup.add(leg);
    }
    group.add(tripodGroup);

    // 4. Wire Gauze with Textured White Ceramic Center Disc
    const gauze = new THREE.Mesh(
      new THREE.BoxGeometry(4.0, 0.06, 4.0),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, wireframe: true })
    );
    gauze.position.set(0, 4.6, 0);
    group.add(gauze);

    const ceramic = new THREE.Mesh(
      new THREE.CylinderGeometry(1.4, 1.4, 0.1, 32),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.9, emissive: 0x000000 })
    );
    ceramic.position.set(0, 4.66, 0);
    group.add(ceramic);
    this.animatedObjects.ceramicHot = ceramic;

    // 5. Beaker Glass on top of Gauze (Authentic Heating Experiment!)
    const beakerGroup = new THREE.Group();
    beakerGroup.position.set(0, 4.75, 0);

    const beakerGeo = new THREE.CylinderGeometry(1.3, 1.25, 2.8, 36, 1, true);
    const beakerMesh = new THREE.Mesh(beakerGeo, glassMat);
    beakerMesh.position.y = 1.4;
    beakerGroup.add(beakerMesh);

    const beakerBottom = new THREE.Mesh(new THREE.CylinderGeometry(1.24, 1.24, 0.1, 36), glassMat);
    beakerBottom.position.y = 0.05;
    beakerGroup.add(beakerBottom);

    // Beaker Measurement Scale Decal
    const beakerTex = this.createBeakerTexture();
    const scaleBanner = new THREE.Mesh(
      new THREE.PlaneGeometry(1.4, 2.6),
      new THREE.MeshBasicMaterial({ map: beakerTex, transparent: true, opacity: 1.0, depthWrite: false, side: THREE.DoubleSide })
    );
    scaleBanner.position.set(0, 1.4, 1.28);
    beakerGroup.add(scaleBanner);

    // Boiling Water inside Beaker
    const waterMesh = new THREE.Mesh(new THREE.CylinderGeometry(1.22, 1.22, 1.8, 36), waterMat);
    waterMesh.position.y = 0.95;
    beakerGroup.add(waterMesh);

    // Steam Bubbles in Water
    const bubbles = new THREE.Group();
    for (let i = 0; i < 10; i++) {
      const b = new THREE.Mesh(
        new THREE.SphereGeometry(0.06 + Math.random() * 0.05, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 })
      );
      b.position.set((Math.random() - 0.5) * 1.6, 0.3 + Math.random() * 1.3, (Math.random() - 0.5) * 1.6);
      bubbles.add(b);
    }
    beakerGroup.add(bubbles);
    this.animatedObjects.boilingBubbles = bubbles;

    group.add(beakerGroup);

    this.hotspots = [
      { id: "h-bunsen", name: "Pembakar Bunsen & Kerah Udara", pos: new THREE.Vector3(0, 0.8, 1.2), desc: "Pengatur aliran oksigen untuk menghasilkan nyala api biru oksidasi bersuhu tinggi tanpa jelaga." },
      { id: "h-flame", name: "Nyala Api Oksidasi Biru Panas", pos: new THREE.Vector3(0, 3.6, 0.6), desc: "Zona pemanasan efisien dengan suhu api mencapai ~800°C untuk memanaskan larutan kimia." },
      { id: "h-gauze", name: "Kawat Kasa Keramik Tahan Panas", pos: new THREE.Vector3(0, 4.65, 1.4), desc: "Menyebarkan titik panas api secara merata ke seluruh dasar gelas kimia agar tidak pecah mendadak." },
      { id: "h-beaker", name: "Gelas Kimia Pemanasan", pos: new THREE.Vector3(0, 5.8, 1.2), desc: "Wadah kaca borosilikat tahan panas untuk mendidihkan cairan atau mereaksikan zat pada suhu tinggi." }
    ];
  }

  // =========================================================================
  // 4. MODEL NERACA OHAUS 3 LENGAN (ULTRA-REALISTIC BRIGHT POWDER-COAT)
  // =========================================================================
  buildOhausBalance(group) {
    const powderCoatBase = new THREE.MeshStandardMaterial({ color: 0x2563eb, metalness: 0.6, roughness: 0.25 }); // Royal Lab Blue
    const brightSteel = new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.95, roughness: 0.08 });
    const brassPoiseMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.94, roughness: 0.12 });
    const darkSteelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 });

    // 1. Heavy Base Stand with Leveling Screws
    const baseGeo = new THREE.BoxGeometry(8.2, 0.65, 3.0);
    const base = new THREE.Mesh(baseGeo, powderCoatBase);
    base.position.set(0, 0.32, 0);
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    // Front Stainless Steel Nameplate Strip
    const trim = new THREE.Mesh(new THREE.BoxGeometry(8.22, 0.12, 0.08), brightSteel);
    trim.position.set(0, 0.58, 1.51);
    group.add(trim);

    // Brass Leveling Screws
    [-3.6, 3.6].forEach(x => {
      const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.32, 20), brassPoiseMat);
      screw.position.set(x, 0.16, 1.2);
      group.add(screw);
    });

    // 2. Central Fulcrum Pillar & Agate Knife Bearing
    const fulcrumPillar = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.6, 1.4), powderCoatBase);
    fulcrumPillar.position.set(-0.7, 1.65, 0);
    group.add(fulcrumPillar);

    const agateBearing = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.28, 1.45), darkSteelMat);
    agateBearing.position.set(-0.7, 2.9, 0);
    group.add(agateBearing);

    // 3. Left Weighing Pan Assembly (Mirror Stainless Steel)
    const panPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 2.4, 20), brightSteel);
    panPillar.position.set(-2.8, 1.7, 0);
    group.add(panPillar);

    const panSupport = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 0.22, 0.45, 36), brightSteel);
    panSupport.position.set(-2.8, 2.8, 0);
    group.add(panSupport);

    const panGeo = new THREE.CylinderGeometry(1.6, 1.45, 0.16, 48);
    const pan = new THREE.Mesh(panGeo, brightSteel);
    pan.position.set(-2.8, 3.0, 0);
    pan.castShadow = true;
    group.add(pan);

    // Brass 100g Test Weight on Pan
    const testWeight = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.58, 0.85, 24), brassPoiseMat);
    testWeight.position.set(-2.8, 3.52, 0);
    group.add(testWeight);

    const testKnob = new THREE.Mesh(new THREE.SphereGeometry(0.22, 20, 20), brassPoiseMat);
    testKnob.position.set(-2.8, 4.0, 0);
    group.add(testKnob);

    // 4. Three Beams Assembly (Lengan Skala Bertingkat)
    const beamGroup = new THREE.Group();
    beamGroup.position.set(1.5, 2.8, 0);

    // Rear Beam (10g - 100g)
    const beamBack = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.24, 0.15), brightSteel);
    beamBack.position.set(0, 0.45, -0.45);
    beamGroup.add(beamBack);

    // Middle Beam (100g - 500g, Deep Notched)
    const beamMid = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.38, 0.18), brightSteel);
    beamMid.position.set(0, 0.22, 0);
    beamGroup.add(beamMid);

    // Front Beam (0 - 10g, Fine Calibrated 0.1g)
    const beamFront = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.2, 0.15), brightSteel);
    beamFront.position.set(0, 0.0, 0.45);
    beamGroup.add(beamFront);

    // Notches on Middle Beam
    for (let i = 0; i <= 5; i++) {
      const notch = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.4, 0.2), darkSteelMat);
      notch.position.set(-2.4 + i * 0.96, 0.22, 0);
      beamGroup.add(notch);
    }

    // 3 Brass Sliding Poises (Anting Pemberat Kuningan Emas)
    const poise100 = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.7, 0.38), brassPoiseMat);
    poise100.position.set(0.48, 0.22, 0);
    beamGroup.add(poise100);

    const poise10 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.3), brassPoiseMat);
    poise10.position.set(-0.85, 0.45, -0.45);
    beamGroup.add(poise10);

    const poise1 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.38, 0.28), brassPoiseMat);
    poise1.position.set(0.95, 0.0, 0.45);
    beamGroup.add(poise1);

    // Bright Red Long Pointer Needle
    const pointer = new THREE.Mesh(new THREE.ConeGeometry(0.08, 1.5, 16), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    pointer.rotation.z = -Math.PI / 2;
    pointer.position.set(3.3, 0.18, 0);
    beamGroup.add(pointer);

    group.add(beamGroup);
    this.animatedObjects.beam = beamGroup;

    // 5. Zero-Index Scale Card at Right End
    const scalePillar = new THREE.Mesh(new THREE.BoxGeometry(0.45, 2.4, 0.9), powderCoatBase);
    scalePillar.position.set(4.6, 1.9, 0);
    group.add(scalePillar);

    const scaleCard = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.5, 0.8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    scaleCard.position.set(4.35, 2.65, 0);
    group.add(scaleCard);

    const zeroLine = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.06, 0.6), new THREE.MeshBasicMaterial({ color: 0x10b981 }));
    zeroLine.position.set(4.35, 3.0, 0);
    group.add(zeroLine);

    this.hotspots = [
      { id: "h-pan", name: "Piringan Penimbang Stainless Steel", pos: new THREE.Vector3(-2.8, 3.3, 0.7), desc: "Piringan baja tahan karat tempat meletakkan objek padat yang akan diukur massanya." },
      { id: "h-beams", name: "Tiga Lengan Skala Bertingkat", pos: new THREE.Vector3(1.5, 3.2, 0.8), desc: "Lengan tengah (100-500g), lengan belakang (10-100g), dan lengan depan (0-10g ketelitian 0.1g)." },
      { id: "h-zero", name: "Jarum Penunjuk Keseimbangan (0)", pos: new THREE.Vector3(4.4, 3.0, 0.5), desc: "Ujung jarum merah harus tepat sejajar dengan garis hijau di titik nol untuk memastikan neraca seimbang." }
    ];
  }

  // =========================================================================
  // 5. MODEL JANGKA SORONG 3D (SATIN CHROME & TEKSTUR SKALA PRESI)
  // =========================================================================
  buildVernierCaliper(group) {
    const stainlessSteel = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.95, roughness: 0.12 });
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.18 });

    // Main Beam Body
    const beam = new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.8, 0.24), stainlessSteel);
    beam.position.set(0, 2.5, 0);
    group.add(beam);

    // Front Metric Scale Decal Banner (0 - 15 cm)
    const scaleTex = this.createVernierScaleTexture();
    const scaleDecal = new THREE.Mesh(
      new THREE.PlaneGeometry(8.2, 0.76),
      new THREE.MeshBasicMaterial({ map: scaleTex, transparent: true, opacity: 1.0, depthWrite: false, side: THREE.DoubleSide })
    );
    scaleDecal.position.set(0, 2.5, 0.13);
    group.add(scaleDecal);

    // Fixed Outside & Inside Jaws (Left End)
    const fixedLower = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2.6, 0.24), stainlessSteel);
    fixedLower.position.set(-3.8, 1.0, 0);
    group.add(fixedLower);

    const fixedUpper = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.4, 0.24), stainlessSteel);
    fixedUpper.position.set(-3.8, 3.6, 0);
    group.add(fixedUpper);

    // Sliding Vernier Jaw Block Assembly
    const vernierGroup = new THREE.Group();
    vernierGroup.position.set(-1.2, 2.5, 0);

    const vBody = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.4, 0.3), stainlessSteel);
    vernierGroup.add(vBody);

    const vLower = new THREE.Mesh(new THREE.BoxGeometry(0.7, 2.6, 0.24), stainlessSteel);
    vLower.position.set(-0.6, -1.5, 0);
    vernierGroup.add(vLower);

    const vUpper = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.4, 0.24), stainlessSteel);
    vUpper.position.set(-0.6, 1.1, 0);
    vernierGroup.add(vUpper);

    // Knurled Locking Thumbscrew
    const lockScrew = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.45, 20), brassMat);
    lockScrew.position.set(0.4, 0.9, 0);
    vernierGroup.add(lockScrew);

    group.add(vernierGroup);
    this.animatedObjects.vernierJaw = vernierGroup;

    // Clamped Blue Precision Test Cylinder
    const sample = new THREE.Mesh(
      new THREE.CylinderGeometry(0.6, 0.6, 1.8, 32),
      new THREE.MeshStandardMaterial({ color: 0x3b82f6, metalness: 0.6, roughness: 0.2 })
    );
    sample.position.set(-2.6, 1.0, 0);
    group.add(sample);

    this.hotspots = [
      { id: "h-outjaws", name: "Rahang Luar (Outside Jaws)", pos: new THREE.Vector3(-2.6, 1.0, 0.6), desc: "Mengukur tebal benda, lebar balok, atau diameter luar tabung silinder." },
      { id: "h-injaws", name: "Rahang Dalam (Inside Jaws)", pos: new THREE.Vector3(-2.6, 3.6, 0.6), desc: "Mengukur diameter dalam pipa, rongga, atau lubang silinder." },
      { id: "h-scale", name: "Skala Utama & Skala Nonius", pos: new THREE.Vector3(0.5, 2.6, 0.6), desc: "Skala utama dalam cm/mm dipadukan dengan skala nonius berketelitian 0.05 mm (0.005 cm)." }
    ];
  }

  // =========================================================================
  // 6. MODEL TERMOMETER LAB 3D (TEKSTUR CELSIUS & TANDON MERAH)
  // =========================================================================
  buildThermometer(group) {
    const clearGlass = new THREE.MeshStandardMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.45, roughness: 0.05 });
    const redFluid = new THREE.MeshBasicMaterial({ color: 0xdc2626 });

    // Outer Glass Stem
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 6.4, 32), clearGlass);
    stem.position.set(0, 3.4, 0);
    group.add(stem);

    // Inner Solid Yellow Enamel Scale Board with Sharp Markings
    const scaleTex = this.createThermometerScaleTexture();
    const scaleBoard = new THREE.Mesh(
      new THREE.PlaneGeometry(0.52, 6.0),
      new THREE.MeshBasicMaterial({ map: scaleTex, depthWrite: false, side: THREE.DoubleSide })
    );
    scaleBoard.position.set(0, 3.4, 0.02);
    group.add(scaleBoard);

    // Top Triangular Anti-Roll Cap
    const topCap = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.35, 3), new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 }));
    topCap.position.set(0, 6.7, 0);
    group.add(topCap);

    const loop = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.05, 12, 24), clearGlass);
    loop.position.set(0, 7.0, 0);
    group.add(loop);

    // Bottom Bulb Reservoir with Red Alcohol
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.62, 32, 32), redFluid);
    bulb.position.set(0, 0.5, 0);
    group.add(bulb);

    const bulbGlass = new THREE.Mesh(new THREE.SphereGeometry(0.7, 32, 32), clearGlass);
    bulbGlass.position.set(0, 0.5, 0);
    group.add(bulbGlass);

    // Red Liquid Capillary Thread
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 4.2, 16), redFluid);
    cap.position.set(0, 2.6, 0.04);
    group.add(cap);
    this.animatedObjects.thermoColumn = cap;

    this.hotspots = [
      { id: "h-bulb", name: "Tandon Reservoir (Bulb) Alkohol Merah", pos: new THREE.Vector3(0, 0.5, 0.9), desc: "Tandon kaca tipis berisi cairan pemuai yang sensitif menyerap panas lingkungan sekitar." },
      { id: "h-cap", name: "Pipa Kapiler Presisi", pos: new THREE.Vector3(0, 3.0, 0.6), desc: "Saluran sempit tempat kolom cairan merah naik-turun memuai secara linier terhadap suhu." },
      { id: "h-scale", name: "Skala Celsius (°C)", pos: new THREE.Vector3(0.4, 4.8, 0.5), desc: "Rentang ukur -10°C sampai 110°C dengan garis skala tertera pada bilah kuning kontras." }
    ];
  }

  // =========================================================================
  // 7. MODEL GELAS KIMIA (BEAKER) & PIPET TETES 3D
  // =========================================================================
  buildBeakerAndPipette(group) {
    const glassMat = new THREE.MeshStandardMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.45, roughness: 0.05, side: THREE.DoubleSide });
    const blueFluidMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, transparent: true, opacity: 0.85, roughness: 0.1 });
    const rubberBulbMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.35 });

    // Beaker Glass Body
    const beaker = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.6, 4.0, 36, 1, true), glassMat);
    beaker.position.set(0, 2.1, 0);
    group.add(beaker);

    const beakerBottom = new THREE.Mesh(new THREE.CylinderGeometry(1.58, 1.58, 0.12, 36), glassMat);
    beakerBottom.position.set(0, 0.18, 0);
    group.add(beakerBottom);

    // Front Beaker Scale Decal
    const beakerTex = this.createBeakerTexture();
    const scaleBanner = new THREE.Mesh(
      new THREE.PlaneGeometry(1.8, 3.6),
      new THREE.MeshBasicMaterial({ map: beakerTex, transparent: true, opacity: 1.0, depthWrite: false, side: THREE.DoubleSide })
    );
    scaleBanner.position.set(0, 2.1, 1.68);
    group.add(scaleBanner);

    // Liquid in Beaker
    const liquid = new THREE.Mesh(new THREE.CylinderGeometry(1.56, 1.56, 2.4, 36), blueFluidMat);
    liquid.position.set(0, 1.3, 0);
    group.add(liquid);

    // Suspended Dropper Pipette
    const pipGroup = new THREE.Group();
    pipGroup.position.set(0.7, 5.2, 0.4);
    pipGroup.rotation.z = -0.22;

    const pipStem = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.05, 3.4, 20), glassMat);
    pipGroup.add(pipStem);

    const rubberBulb = new THREE.Mesh(new THREE.SphereGeometry(0.38, 24, 24), rubberBulbMat);
    rubberBulb.position.y = 1.9;
    pipGroup.add(rubberBulb);

    const pipFluid = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.04, 1.8, 16), blueFluidMat);
    pipFluid.position.y = -0.5;
    pipGroup.add(pipFluid);

    group.add(pipGroup);

    // Falling Droplet
    const drop = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), blueFluidMat);
    drop.position.set(0.35, 3.4, 0.4);
    group.add(drop);
    this.animatedObjects.droplet = drop;

    this.hotspots = [
      { id: "h-beaker", name: "Gelas Kimia 250 mL (Beaker Glass)", pos: new THREE.Vector3(0, 2.2, 1.9), desc: "Wadah serbaguna untuk melarutkan padatan, menampung zat kimia, dan memanaskan larutan." },
      { id: "h-pipette", name: "Pipet Tetes (Dropper Pipette)", pos: new THREE.Vector3(0.9, 6.0, 0.8), desc: "Alat pengambil cairan dalam volume tetesan kecil yang akurat menggunakan balon karet hisap." }
    ];
  }

  // =========================================================================
  // 8. MODEL LABU ERLENMEYER 3D
  // =========================================================================
  buildErlenmeyer(group) {
    const glassMat = new THREE.MeshStandardMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.45, roughness: 0.05, side: THREE.DoubleSide });
    const purpleFluidMat = new THREE.MeshStandardMaterial({ color: 0xa855f7, transparent: true, opacity: 0.85, roughness: 0.1 });

    const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 2.5, 3.8, 36, 1, true), glassMat);
    cone.position.set(0, 2.2, 0);
    group.add(cone);

    const bottom = new THREE.Mesh(new THREE.CylinderGeometry(2.48, 2.48, 0.15, 36), glassMat);
    bottom.position.set(0, 0.38, 0);
    group.add(bottom);

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 2.0, 36, 1, true), glassMat);
    neck.position.set(0, 4.8, 0);
    group.add(neck);

    // Beaded Rim at Top
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.07, 16, 36), glassMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.set(0, 5.8, 0);
    group.add(rim);

    // Purple Chemical Solution
    const fluid = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 2.4, 2.1, 36), purpleFluidMat);
    fluid.position.set(0, 1.45, 0);
    group.add(fluid);

    // Rising Effervescence Bubbles
    const bubblesGroup = new THREE.Group();
    for (let i = 0; i < 12; i++) {
      const bubble = new THREE.Mesh(
        new THREE.SphereGeometry(0.08 + Math.random() * 0.06, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 })
      );
      bubble.position.set((Math.random() - 0.5) * 2.2, 0.6 + Math.random() * 1.8, (Math.random() - 0.5) * 2.2);
      bubblesGroup.add(bubble);
    }
    group.add(bubblesGroup);
    this.animatedObjects.bubbles = bubblesGroup;

    this.hotspots = [
      { id: "h-erlen", name: "Labu Erlenmeyer Kerucut 250 mL", pos: new THREE.Vector3(0, 2.4, 1.7), desc: "Bentuk kerucut dengan leher sempit sangat ideal untuk mengocok larutan kuat tanpa tumpah dan proses titrasi asam-basa." }
    ];
  }

  // =========================================================================
  // 9. MODEL RAK TABUNG REAKSI & 6 TABUNG REAGEN KIMIA
  // =========================================================================
  buildTestTubeRack(group) {
    const woodMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.35, metalness: 0.1 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.45, roughness: 0.04, side: THREE.DoubleSide });
    
    // 6 Vibrant Reagents
    const reagentColors = [0x3b82f6, 0xf97316, 0xa855f7, 0xeab308, 0x10b981, 0x38bdf8];

    // Wooden Rack Base Plate
    const basePlate = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.35, 2.4), woodMat);
    basePlate.position.set(0, 0.2, 0);
    group.add(basePlate);

    const topPlate = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.3, 2.4), woodMat);
    topPlate.position.set(0, 2.9, 0);
    group.add(topPlate);

    [-3.6, 3.6].forEach(x => {
      const side = new THREE.Mesh(new THREE.BoxGeometry(0.35, 2.9, 2.4), woodMat);
      side.position.set(x, 1.55, 0);
      group.add(side);
    });

    // 6 Wooden Drying Pegs on Back
    for (let i = 0; i < 6; i++) {
      const peg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.8, 16), woodMat);
      peg.position.set(-2.5 + i * 1.0, 3.8, -0.8);
      group.add(peg);
    }

    // 6 Borosilicate Test Tubes
    for (let i = 0; i < 6; i++) {
      const posX = -2.5 + i * 1.0;
      const tubeGroup = new THREE.Group();
      tubeGroup.position.set(posX, 2.3, 0.2);

      const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 3.8, 24), glassMat);
      tubeGroup.add(tube);

      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.05, 12, 24), glassMat);
      rim.rotation.x = Math.PI / 2;
      rim.position.y = 1.9;
      tubeGroup.add(rim);

      const fluid = new THREE.Mesh(
        new THREE.CylinderGeometry(0.28, 0.28, 2.0, 24),
        new THREE.MeshStandardMaterial({ color: reagentColors[i], transparent: true, opacity: 0.85, roughness: 0.1 })
      );
      fluid.position.y = -0.9;
      tubeGroup.add(fluid);

      group.add(tubeGroup);
    }

    this.hotspots = [
      { id: "h-rack", name: "Rak Tabung Kayu Jati", pos: new THREE.Vector3(-3.2, 2.9, 1.1), desc: "Menjaga deretan tabung reaksi tetap tegak stabil saat pengamatan dan pengeringan tabung." },
      { id: "h-tube", name: "Deretan Tabung Reaksi Reagen", pos: new THREE.Vector3(0, 3.4, 0.8), desc: "Tabung kaca borosilikat untuk mereaksikan larutan uji nutrisi (Benedict, Biuret, Lugol, dsb.)." }
    ];
  }

  // =========================================================================
  // 10. MODEL CAWAN PETRI 3D
  // =========================================================================
  buildPetriDish(group) {
    const glassMat = new THREE.MeshStandardMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.45, roughness: 0.04, side: THREE.DoubleSide });
    const agarMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.25, transparent: true, opacity: 0.9 });

    // Lower Dish
    const dish = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 2.8, 0.55, 48, 1, true), glassMat);
    dish.position.set(0, 0.6, 0);
    group.add(dish);

    const dishBottom = new THREE.Mesh(new THREE.CylinderGeometry(2.78, 2.78, 0.12, 48), glassMat);
    dishBottom.position.set(0, 0.35, 0);
    group.add(dishBottom);

    // Nutrient Agar Gel Bed
    const agar = new THREE.Mesh(new THREE.CylinderGeometry(2.72, 2.72, 0.28, 48), agarMat);
    agar.position.set(0, 0.52, 0);
    group.add(agar);

    // 3D Bacterial Colonies
    const cols = [0xf59e0b, 0xef4444, 0xf8fafc, 0x06b6d4, 0x10b981];
    for (let i = 0; i < 20; i++) {
      const rad = 0.12 + Math.random() * 0.22;
      const angle = Math.random() * Math.PI * 2;
      const dist = 0.3 + Math.random() * 1.9;
      const colMesh = new THREE.Mesh(
        new THREE.SphereGeometry(rad, 16, 12),
        new THREE.MeshStandardMaterial({ color: cols[i % cols.length], roughness: 0.2, metalness: 0.1 })
      );
      colMesh.scale.set(1, 0.35, 1);
      colMesh.position.set(Math.cos(angle) * dist, 0.68, Math.sin(angle) * dist);
      group.add(colMesh);
    }

    // Upper Glass Lid (Ajar)
    const lidGroup = new THREE.Group();
    lidGroup.position.set(0.5, 1.3, 0);
    lidGroup.rotation.z = 0.16;

    const lidCyl = new THREE.Mesh(new THREE.CylinderGeometry(2.95, 2.95, 0.5, 48, 1, true), glassMat);
    lidGroup.add(lidCyl);

    const lidTop = new THREE.Mesh(new THREE.CylinderGeometry(2.95, 2.95, 0.12, 48), glassMat);
    lidTop.position.y = 0.25;
    lidGroup.add(lidTop);

    group.add(lidGroup);
    this.animatedObjects.petriLid = lidGroup;

    this.hotspots = [
      { id: "h-agar", name: "Media Nutrient Agar & Koloni Mikroba", pos: new THREE.Vector3(0, 0.8, 0.8), desc: "Gel nutrisi steril tempat perkembangbiakan dan isolasi koloni bakteri/jamur mikrobiologi." }
    ];
  }

  // =========================================================================
  // 11. MODEL LUP (KACA PEMBESAR) 3D
  // =========================================================================
  buildMagnifyingGlass(group) {
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.94, roughness: 0.12 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.45 });
    const lensMat = new THREE.MeshStandardMaterial({ color: 0xa5f3fc, transparent: true, opacity: 0.55, roughness: 0.03 });

    const rim = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.2, 20, 64), brassMat);
    rim.position.set(0, 3.2, 0);
    group.add(rim);

    // Thick Biconvex Optical Lens
    const lensGeo = new THREE.SphereGeometry(2.2, 36, 20);
    lensGeo.scale(1, 1, 0.2);
    const lens = new THREE.Mesh(lensGeo, lensMat);
    lens.position.set(0, 3.2, 0);
    group.add(lens);

    const ferrule = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.32, 0.6, 24), brassMat);
    ferrule.position.set(0, 0.8, 0);
    group.add(ferrule);

    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.26, 2.6, 24), woodMat);
    handle.position.set(0, -0.6, 0);
    group.add(handle);

    const finial = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 20), brassMat);
    finial.position.set(0, -1.9, 0);
    group.add(finial);

    this.hotspots = [
      { id: "h-lens", name: "Lensa Bikonveks Optik Cembung", pos: new THREE.Vector3(0, 3.2, 0.6), desc: "Lensa cembung optik berkualitas tinggi untuk menghasilkan bayangan maya tegak diperbesar." }
    ];
  }

  // =========================================================================
  // 12. MODEL KAKI TIGA & KAWAT KASA 3D
  // =========================================================================
  buildTripodAndGauze(group) {
    this.buildBunsenAndTripod(group);
  }

  // =========================================================================
  // 13. MODEL BATANG PENGADUK & KACA ARLOJI 3D
  // =========================================================================
  buildStirringRod(group) {
    const glassMat = new THREE.MeshStandardMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.45, roughness: 0.04, side: THREE.DoubleSide });
    const whitePowderMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.9 });

    // Watch Glass (Kaca Arloji)
    const watchGeo = new THREE.SphereGeometry(2.4, 36, 16, 0, Math.PI * 2, 0, 0.6);
    const watchGlass = new THREE.Mesh(watchGeo, glassMat);
    watchGlass.rotation.x = Math.PI;
    watchGlass.position.set(0, 0.8, 0);
    group.add(watchGlass);

    // Chemical Powder Specimen
    const powder = new THREE.Mesh(new THREE.ConeGeometry(1.2, 0.4, 24), whitePowderMat);
    powder.position.set(0, 0.6, 0);
    group.add(powder);

    // Solid Glass Stirring Rod
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 6.4, 24), glassMat);
    rod.position.set(0, 2.2, 0);
    rod.rotation.z = 0.55;
    group.add(rod);
    this.animatedObjects.stirringRod = rod;

    this.hotspots = [
      { id: "h-rod", name: "Batang Pengaduk Kaca Borosilikat", pos: new THREE.Vector3(0, 2.2, 0.5), desc: "Kaca pejal silindris untuk mengaduk larutan secara homogen dan memandu dekantasi cairan." },
      { id: "h-watch", name: "Kaca Arloji (Watch Glass)", pos: new THREE.Vector3(0, 0.8, 1.2), desc: "Wadah berbentuk piring cekung dangkal untuk menimbang serbuk kimia atau menutup gelas beker." }
    ];
  }

  // =========================================================================
  // 14. MODEL CORONG KACA & KERTAS SARING FILTRASI 3D
  // =========================================================================
  buildFunnel(group) {
    const glassMat = new THREE.MeshStandardMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.45, roughness: 0.05, side: THREE.DoubleSide });
    const paperMat = new THREE.MeshStandardMaterial({ color: 0xfef9c3, roughness: 0.85, side: THREE.DoubleSide });
    const standMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.35 });

    // Retort Stand Ring
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.14, 16, 36), standMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, 3.4, 0);
    group.add(ring);

    // Glass Funnel Cone
    const cone = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 0.36, 2.6, 36, 1, true), glassMat);
    cone.position.set(0, 3.8, 0);
    group.add(cone);

    // Fluted Filter Paper Cone
    const paper = new THREE.Mesh(new THREE.CylinderGeometry(1.98, 0.34, 2.4, 36, 1, true), paperMat);
    paper.position.set(0, 3.8, 0);
    group.add(paper);

    // Long Beveled Delivery Stem
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 2.6, 24, 1, true), glassMat);
    stem.position.set(0, 1.4, 0);
    group.add(stem);

    // Receiving Beaker Below
    const beaker = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.35, 2.4, 36, 1, true), glassMat);
    beaker.position.set(0, 1.2, 0);
    group.add(beaker);

    this.hotspots = [
      { id: "h-funnel", name: "Corong Kaca & Kertas Saring Lipat", pos: new THREE.Vector3(0, 3.8, 1.6), desc: "Peralatan filtrasi untuk memisahkan endapan padatan dari campuran larutan heterogen." }
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
      'bunsen-spiritus': '<i class="fa-solid fa-fire"></i> Nyalakan Api Spiritus',
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

    if (this.currentModelType === 'bunsen' || this.currentModelType === 'bunsen-spiritus') {
      if (btn) btn.innerHTML = this.isActionActive ? '<i class="fa-solid fa-fire-extinguisher"></i> Padamkan Api' : '<i class="fa-solid fa-fire"></i> Nyalakan Api Spiritus';
      if (this.animatedObjects.flame) {
        this.animatedObjects.flame.visible = this.isActionActive;
      }
      if (this.flameLight) {
        this.flameLight.intensity = this.isActionActive ? 3.0 : 0;
      }
      if (this.animatedObjects.ceramicHot) {
        this.animatedObjects.ceramicHot.material.emissive.setHex(this.isActionActive ? 0xff4500 : 0x000000);
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
        this.animatedObjects.droplet.position.y = 3.4;
      }
    } else if (this.currentModelType === 'neraca' || this.currentModelType === 'neraca-ohaus') {
      if (btn) btn.innerHTML = '<i class="fa-solid fa-sliders"></i> Geser Anting Timbangan';
      if (this.animatedObjects.beam) {
        this.animatedObjects.beam.rotation.z = (Math.random() - 0.5) * 0.08;
      }
    } else if (this.currentModelType === 'jangka-sorong') {
      if (this.animatedObjects.vernierJaw) {
        this.animatedObjects.vernierJaw.position.x = this.isActionActive ? 0.3 : -1.2;
      }
    } else if (this.currentModelType === 'termometer-lab' || this.currentModelType === 'termometer') {
      if (this.animatedObjects.thermoColumn) {
        this.animatedObjects.thermoColumn.scale.y = this.isActionActive ? 1.4 : 0.8;
      }
    } else if (this.currentModelType === 'cawan-petri') {
      if (this.animatedObjects.petriLid) {
        this.animatedObjects.petriLid.position.x = this.isActionActive ? 1.9 : 0.5;
        this.animatedObjects.petriLid.rotation.z = this.isActionActive ? 0.45 : 0.16;
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

    // Dynamic Micro-Animations
    if ((this.currentModelType === 'bunsen' || this.currentModelType === 'bunsen-spiritus') && this.animatedObjects.flame && this.animatedObjects.flame.visible) {
      const flicker = Math.sin(elapsedTime * 18) * 0.08 + Math.cos(elapsedTime * 28) * 0.05;
      this.animatedObjects.flame.scale.set(1 + flicker, 1 + flicker * 1.6, 1 + flicker);
      if (this.animatedObjects.boilingBubbles) {
        this.animatedObjects.boilingBubbles.children.forEach((b, i) => {
          b.position.y += 0.02 + (i % 3) * 0.008;
          if (b.position.y > 1.8) b.position.y = 0.3;
        });
      }
    }

    if (this.currentModelType === 'gelas-kimia' && this.animatedObjects.droplet) {
      this.animatedObjects.droplet.position.y -= 0.035;
      if (this.animatedObjects.droplet.position.y < 1.4) {
        this.animatedObjects.droplet.position.y = 3.4;
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
