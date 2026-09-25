// Data Lengkap Media Pembelajaran Laboratorium IPA Kelas VII SMP

const LAB_DATA = {
  // 1. DATA ALAT-ALAT LABORATORIUM
  alatLab: [
    // --- ALAT UKUR ---
    {
      id: "gelas-ukur",
      nama: "Gelas Ukur",
      kategori: "ukur",
      fungsi: "Mengukur volume zat cair secara presisi.",
      icon: "fa-ruler-vertical",
      gambar: "img/tools/gelas-ukur.svg",
      deskripsi: "Tabung silinder vertikal dengan skala mililiter (mL).",
      caraPakai: ["Letakkan gelas ukur pada permukaan datar.", "Tuangkan cairan perlahan.", "Baca angka tepat pada dasar meniskus cekung sejajar mata."],
      dos: ["Bilas dan keringkan sebelum mengganti zat cair.", "Selalu baca meniskus pada posisi mata sejajar."],
      donts: ["JANGAN memanaskan gelas ukur di atas api.", "Jangan gunakan untuk melarutkan zat padat."],
      material: "Kaca Borosilikat / Polipropilena",
      bahaya: "Rentan pecah",
      has3D: true,
      modelType: "gelas-ukur"
    },
    {
      id: "neraca-ohaus",
      nama: "Neraca / Timbangan (Ohaus)",
      kategori: "ukur",
      fungsi: "Mengukur massa benda atau zat padat dengan ketelitian tinggi.",
      icon: "fa-scale-balanced",
      gambar: "img/tools/neraca-ohaus.svg",
      deskripsi: "Alat penimbang mekanis dengan tiga lengan beban geser.",
      caraPakai: ["Kalibrasi jarum ke angka nol sebelum menimbang.", "Letakkan benda di atas piringan.", "Geser anting pemberat mulai dari lengan terbesar hingga seimbang."],
      dos: ["Selalu kalibrasi ke titik nol sebelum menimbang.", "Gunakan wadah kaca arloji saat menimbang serbuk kimia."],
      donts: ["Jangan menaruh bahan kimia basah langsung di piringan.", "Jangan menggeser anting secara kasar."],
      material: "Baja & Aluminium",
      bahaya: "Kerusakan kalibrasi",
      has3D: true,
      modelType: "neraca"
    },
    {
      id: "termometer-lab",
      nama: "Termometer Laboratorium",
      kategori: "ukur",
      fungsi: "Mengukur suhu larutan atau sistem reaksi kimia.",
      icon: "fa-temperature-half",
      gambar: "img/tools/termometer-lab.svg",
      deskripsi: "Pipa kapiler kaca berisi cairan pemuai (alkohol merah) dengan skala Celsius.",
      caraPakai: ["Celupkan tandon bawah ke dalam larutan tanpa menyentuh dasar wadah.", "Tunggu hingga cairan pemuai berhenti bergerak stabil.", "Baca skala tepat sejajar mata."],
      dos: ["Pegang bagian atas pipa kapiler termometer.", "Keringkan setelah digunakan."],
      donts: ["Jangan gunakan termometer sebagai batang pengaduk larutan!", "Jangan mendinginkan termometer panas langsung di bawah air dingin."],
      material: "Kaca Borosilikat & Alkohol Merah",
      bahaya: "Rentan patah",
      has3D: true,
      modelType: "termometer-lab"
    },
    {
      id: "jangka-sorong",
      nama: "Jangka Sorong (Vernier Caliper)",
      kategori: "ukur",
      fungsi: "Mengukur diameter dalam, diameter luar, dan kedalaman suatu benda secara presisi.",
      icon: "fa-ruler",
      gambar: "img/tools/jangka-sorong.svg",
      deskripsi: "Alat ukur presisi tinggi (ketelitian 0.05 mm - 0.1 mm) dengan rahang tetap, rahang geser, dan skala nonius.",
      caraPakai: ["Rapatkan rahang dan pastikan titik nol sejajar.", "Jepit benda di antara rahang ukur.", "Kencangkan baut pengunci dan baca skala utama serta skala nonius."],
      dos: ["Pastikan posisi skala di 0 sebelum mengukur.", "Bersihkan permukaan rahang dari debu/minyak."],
      donts: ["Jangan menjepit benda terlalu keras hingga merusak ulir/rahang.", "Jangan gunakan untuk memukul atau mencongkel."],
      material: "Baja Tahan Karat (Stainless Steel)",
      bahaya: "Tepi tajam",
      has3D: true,
      modelType: "jangka-sorong"
    },
    // --- ALAT PENAMPUNG DAN PENCAMPUR ---
    {
      id: "tabung-reaksi",
      nama: "Tabung Reaksi & Rak",
      kategori: "penampung",
      fungsi: "Wadah mereaksikan zat kimia dalam skala kecil / uji kualitatif.",
      icon: "fa-vial",
      gambar: "img/tools/tabung-reaksi.svg",
      deskripsi: "Tabung silinder tipis tahan panas terbuka dengan dasar melengkung hemispherical.",
      caraPakai: ["Isi tabung maksimal sepertiga volume.", "Jepit dengan penjepit kayu jika dipanaskan.", "Arahkan mulut tabung ke arah yang aman (kemiringan 45°)."],
      dos: ["Letakkan selalu pada rak tabung setelah digunakan.", "Gunakan sikat tabung saat mencuci."],
      donts: ["Jangan mengarahkan mulut tabung ke wajah diri sendiri atau orang lain saat dipanaskan."],
      material: "Kaca Borosilikat (Pyrex)",
      bahaya: "Cipratan cairan kimia",
      has3D: true,
      modelType: "tabung-reaksi"
    },
    {
      id: "gelas-kimia",
      nama: "Gelas Kimia (Beaker Glass)",
      kategori: "penampung",
      fungsi: "Menampung, melarutkan, mencampur, dan memanaskan larutan kimia.",
      icon: "fa-flask-vial",
      gambar: "img/tools/gelas-kimia.svg",
      deskripsi: "Gelas silinder bervolume lebar dengan bibir tuang (spout) dan skala perkiraan.",
      caraPakai: ["Tuang cairan perlahan melalui bibir tuang.", "Bisa dipanaskan di atas kawat kasa dan kaki tiga.", "Gunakan sarung tangan tahan panas saat mengangkat."],
      dos: ["Gunakan pengaduk kaca secara perlahan agar tidak membentur dasar gelas."],
      donts: ["Jangan digunakan untuk mengukur volume presisi (gunakan gelas ukur)."],
      material: "Kaca Pyrex Tahan Panas",
      bahaya: "Pecah belah & Panas",
      has3D: true,
      modelType: "gelas-kimia"
    },
    {
      id: "labu-erlenmeyer",
      nama: "Labu Erlenmeyer",
      kategori: "penampung",
      fungsi: "Mencampur larutan dengan cara dikocok memutar, titrasi, dan menampung filtrat.",
      icon: "fa-flask",
      gambar: "img/tools/labu-erlenmeyer.svg",
      deskripsi: "Labu berbentuk kerucut dengan leher sempit untuk mencegah tumpahan atau cipratan saat dikocok.",
      caraPakai: ["Pegang leher labu dan putar perlahan secara horizontal untuk mengocok larutan.", "Sangat ideal untuk proses titrasi asam-basa."],
      dos: ["Gunakan corong saat menuang cairan pekat atau serbuk.", "Bilas dengan aquades setelah selesai digunakan."],
      donts: ["Jangan menutup rapat sumbat labu bila reaksi menghasilkan tekanan gas tinggi."],
      material: "Kaca Borosilikat",
      bahaya: "Tekanan gas & Panas",
      has3D: true,
      modelType: "labu-erlenmeyer"
    },
    {
      id: "cawan-petri",
      nama: "Cawan Petri (Petri Dish)",
      kategori: "penampung",
      fungsi: "Menumbuhkan mikroorganisme (bakteri, jamur) di atas media agar padat serta mengamati spesimen kecil.",
      icon: "fa-circle",
      gambar: "img/tools/cawan-petri.svg",
      deskripsi: "Wadah bundar dangkal berbahan kaca/plastik bening dengan tutup pasangannya yang sedikit lebih lebar.",
      caraPakai: ["Tuang media agar-agar steril yang hangat ke dalam cawan.", "Biarkan memadat lalu inokulasi sampel mikroorganisme.", "Inkubasi dalam posisi terbalik."],
      dos: ["Sterilkan cawan sebelum dan sesudah digunakan (autoklaf).", "Beri label identitas sampel di bagian dasar cawan."],
      donts: ["Jangan membuka tutup cawan terlalu lama di udara terbuka agar tidak terkontaminasi."],
      material: "Kaca Borosilikat / Plastik Steril",
      bahaya: "Kontaminasi biologi",
      has3D: true,
      modelType: "cawan-petri"
    },
    // --- ALAT PENGAMATAN ---
    {
      id: "mikroskop",
      nama: "Mikroskop Cahaya",
      kategori: "pengamatan",
      fungsi: "Mengamati struktur benda-benda mikroskopis yang tidak kasat mata (sel, jaringan, mikroorganisme).",
      icon: "fa-microscope",
      gambar: "img/tools/mikroskop.svg",
      deskripsi: "Alat optik bertenaga lensa ganda (okuler & objektif) untuk perbesaran gambar hingga 1000x.",
      caraPakai: ["Letakkan preparat pada meja panggung.", "Mulai pengamatan dari perbesaran lensa objektif terendah (4x).", "Fokuskan bayangan dengan makrometer lalu mikrometer."],
      dos: ["Bersihkan lensa hanya dengan kertas lensa khusus.", "Pegang lengan mikroskop dengan satu tangan dan sangga alasnya dengan tangan lain."],
      donts: ["Jangan memutar makrometer kasar saat perbesaran objektif tinggi (40x/100x) karena dapat memecahkan kaca objek."],
      material: "Rangka Logam & Lensa Kaca Optik",
      bahaya: "Sangat Rentan Pecah",
      has3D: true,
      modelType: "mikroskop"
    },
    {
      id: "lup",
      nama: "Kaca Pembesar (Lup)",
      kategori: "pengamatan",
      fungsi: "Mengamati detail benda kecil (serangga, tulang daun, kristal batuan) dengan perbesaran sedang.",
      icon: "fa-magnifying-glass",
      gambar: "img/tools/lup.svg",
      deskripsi: "Lensa cembung tunggal (bikonveks) berkekuatan perbesaran 3x - 10x dengan bingkai dan pegangan.",
      caraPakai: ["Posisikan lup di antara mata dan objek yang diamati.", "Gerakkan maju-mundur perlahan hingga objek tampak paling jelas dan besar."],
      dos: ["Gunakan di ruangan dengan pencahayaan yang cukup terang.", "Lap lensa dengan kain mikrofiber lembut."],
      donts: ["Jangan pernah melihat matahari langsung melalui lup karena dapat merusak retina secara permanen."],
      material: "Lensa Kaca Optik & Gagang Logam/Kayu",
      bahaya: "Fokus panas cahaya",
      has3D: true,
      modelType: "lup"
    },
    // --- ALAT PEMANAS DAN PENDUKUNG ---
    {
      id: "bunsen-spiritus",
      nama: "Pembakar Spiritus (Bunsen)",
      kategori: "pemanas-pendukung",
      fungsi: "Sumber api untuk memanaskan zat kimia, membakar, dan mensterilkan alat laboratorium.",
      icon: "fa-fire",
      gambar: "img/tools/bunsen-spiritus.svg",
      deskripsi: "Lampu kaca dengan sumbu katun yang diisi bahan bakar spiritus / alkohol.",
      caraPakai: ["Buka penutup pembakar.", "Nyalakan sumbu menggunakan korek api.", "Gunakan zona api biru untuk pemanasan optimal.", "Matikan dengan menutupkan kap penutupnya."],
      dos: ["Matikan selalu dengan menutupnya, JANGAN ditiup.", "Jauhkan dari bahan kimia yang mudah meledak/terbakar."],
      donts: ["Jangan meniup nyala api pembakar spiritus!", "Jangan mengisi spiritus saat sumbu masih menyala."],
      material: "Kaca Borosilikat, Kuningan & Sumbu",
      bahaya: "Mudah terbakar (Flammable)",
      has3D: true,
      modelType: "bunsen"
    },
    {
      id: "kaki-tiga",
      nama: "Kaki Tiga (Tripod Stand)",
      kategori: "pemanas-pendukung",
      fungsi: "Menyangga kawat kasa dan wadah reaksi (gelas kimia/erlenmeyer) di atas pembakar saat dipanaskan.",
      icon: "fa-tent",
      gambar: "img/tools/kaki-tiga.svg",
      deskripsi: "Rangka besi kokoh berkaki tiga dengan cincin lingkaran penopang di bagian atas.",
      caraPakai: ["Letakkan kaki tiga di atas meja datar dan stabil.", "Posisikan pembakar spiritus tepat di tengah bawah lingkaran kaki tiga.", "Letakkan kawat kasa di atas cincin kaki tiga."],
      dos: ["Pastikan ketiga kaki berdiri seimbang di permukaan datar sebelum ditaruh beban cairan."],
      donts: ["Jangan langsung memegang kaki tiga dengan tangan telanjang setelah pemanasan (masih sangat panas)."],
      material: "Besi Baja Cor (Cast Iron)",
      bahaya: "Panas tinggi",
      has3D: true,
      modelType: "kaki-tiga"
    },
    {
      id: "kawat-kasa",
      nama: "Kawat Kasa (Wire Gauze)",
      kategori: "pemanas-pendukung",
      fungsi: "Meratakan persebaran panas nyala api ke dasar wadah kaca agar pemanasan merata dan tidak pecah.",
      icon: "fa-border-all",
      gambar: "img/tools/kawat-kasa.svg",
      deskripsi: "Anyaman kawat logam tahan panas dengan piringan keramik putih penyerap panas di bagian tengah.",
      caraPakai: ["Letakkan kawat kasa di atas lingkaran kaki tiga.", "Posisikan piringan keramik tepat di atas titik nyala api.", "Letakkan gelas kimia atau labu di atas keramik kawat kasa."],
      dos: ["Gunakan selalu saat memanaskan alat gelas di atas api terbuka."],
      donts: ["Jangan menyiram kawat kasa yang masih membara dengan air dingin secara mendadak."],
      material: "Anyaman Baja Tahan Karat & Piringan Keramik",
      bahaya: "Panas tinggi",
      has3D: true,
      modelType: "kawat-kasa"
    },
    {
      id: "batang-pengaduk",
      nama: "Batang Pengaduk Kaca",
      kategori: "pemanas-pendukung",
      fungsi: "Mengaduk larutan kimia agar homogen, mempercepat kelarutan padatan, dan membantu dekantasi cairan.",
      icon: "fa-wand-magic-sparkles",
      gambar: "img/tools/batang-pengaduk.svg",
      deskripsi: "Batang kaca silinder pejal panjang dan bening dengan ujung membulat halus.",
      caraPakai: ["Pegang batang pengaduk di antara jari-jari tangan.", "Aduk cairan dengan gerakan memutar perlahan tanpa membentur dinding atau dasar wadah."],
      dos: ["Bilas bersih dengan aquades dan lap kering sebelum digunakan pada larutan lain."],
      donts: ["Jangan menggunakan batang pengaduk untuk menekan/menghancurkan gumpalan padatan yang keras."],
      material: "Kaca Borosilikat Pejal",
      bahaya: "Rentan patah",
      has3D: true,
      modelType: "batang-pengaduk"
    },
    {
      id: "corong-kaca",
      nama: "Corong Kaca (Glass Funnel)",
      kategori: "pemanas-pendukung",
      fungsi: "Memudahkan menuangkan cairan ke wadah bermulut sempit serta menyangga kertas saring pada proses filtrasi.",
      icon: "fa-filter",
      gambar: "img/tools/corong-kaca.svg",
      deskripsi: "Kerucut kaca lebar dengan pipa tangkai panjang yang dipotong miring pada ujung bawahnya.",
      caraPakai: ["Masukkan tangkai corong ke dalam leher labu/botol.", "Jika untuk filtrasi, pasang lipatan kertas saring di dinding kerucut dan basahi sedikit dengan aquades.", "Tuang larutan perlahan."],
      dos: ["Gunakan batang pengaduk untuk mengarahkan aliran cairan saat menuang ke dalam corong."],
      donts: ["Jangan menuangkan cairan melebihi kapasitas kerucut corong sekaligus."],
      material: "Kaca Borosilikat",
      bahaya: "Rentan pecah",
      has3D: true,
      modelType: "corong-kaca"
    }
  ],

  // 2. DATA SIMBOL K3 / BAHAN BERBAHAYA (B3)
  simbolK3: [
    {
      id: "flammable",
      nama: "Mudah Terbakar (Flammable)",
      gambar: "img/k3/flammable.svg",
      simbolIcon: "fa-fire-flame-curved",
      warna: "#e74c3c",
      arti: "Zat yang mudah menyala dan terbakar jika terkena percikan api, panas, gesekan, atau udara.",
      contoh: "Alkohol / Etanol, Aseton, Eter, Gas Metana, Logam Natrium.",
      penanganan: "Jauhkan dari nyala api pembakar spiritus, sumber panas, dan percikan listrik. Simpan di wadah rapat tahan api."
    },
    {
      id: "explosive",
      nama: "Mudah Meledak (Explosive)",
      gambar: "img/k3/explosive.svg",
      simbolIcon: "fa-bomb",
      warna: "#d35400",
      arti: "Bahan yang dapat meledak dengan adanya benturan, gesekan, panas, atau reaksi kimia cepat.",
      contoh: "Amonium Nitrat, TNT, Kalium Klorat, Campuran Peroksida.",
      penanganan: "Hindari benturan, gesekan, pemanasan mendadak, dan loncatan api. Simpan dalam ruangan khusus bertemperatur stabil."
    },
    {
      id: "toxic",
      nama: "Beracun (Toxic / Poison)",
      gambar: "img/k3/toxic.svg",
      simbolIcon: "fa-skull-crossbones",
      warna: "#8e44ad",
      arti: "Dapat menyebabkan keracunan fatal, gangguan kesehatan kronis, hingga kematian bila terhirup, tertelan, atau terserap kulit.",
      contoh: "Kalium Sianida, Raksa/Merkuri, Kloroform, Gas Klorin, Metanol.",
      penanganan: "Gunakan masker respirator, sarung tangan nitril, dan lemari asam (fume hood). JANGAN PERNAH menghirup langsung atau mencicipi!"
    },
    {
      id: "corrosive",
      nama: "Korosif (Corrosive)",
      gambar: "img/k3/corrosive.svg",
      simbolIcon: "fa-hand-dots",
      warna: "#2980b9",
      arti: "Dapat merusak jaringan hidup (luka bakar kimiawi parah pada kulit/mata) dan menyebabkan karat logam.",
      contoh: "Asam Sulfat pekat (H2SO4), Asam Klorida (HCl), Natrium Hidroksida (NaOH), Asam Nitrat.",
      penanganan: "Wajib pakai kacamata pelindung (safety goggles), sarung tangan tahan asam, dan jas lab. Jika terkena kulit segera bilas dengan air mengalir selama 15 menit."
    },
    {
      id: "oxidizing",
      nama: "Pengoksidasi (Oxidizing)",
      gambar: "img/k3/oxidizing.svg",
      simbolIcon: "fa-circle-radiation",
      warna: "#f39c12",
      arti: "Bahan tidak selalu mudah terbakar sendiri, tetapi dapat melepaskan oksigen dan memicu/mempercepat kebakaran zat lain.",
      contoh: "Hidrogen Peroksida pekat (H2O2), Kalium Permanganat (KMnO4), Asam Perklorat.",
      penanganan: "Hindarkan kontak dengan bahan organik atau senyawa yang mudah terbakar."
    },
    {
      id: "irritant",
      nama: "Iritan / Bahaya Kesehatan (Harmful / Irritant)",
      gambar: "img/k3/irritant.svg",
      simbolIcon: "fa-triangle-exclamation",
      warna: "#e67e22",
      arti: "Menyebabkan iritasi ringan hingga sedang pada kulit, mata, saluran pernapasan, atau alergi.",
      contoh: "Amonia encer, Kalsium Klorida, Asam Asetat encer, Alkohol 70%.",
      penanganan: "Bekerja di ruang berventilasi baik, kenakan masker dan sarung tangan."
    }
  ],

  // 3. DATA VIDEO PEMBELAJARAN
  videos: [
    {
      id: "vid-1",
      judul: "Pengenalan dan Penggunaan Alat-Alat Laboratorium IPA",
      durasi: "05:33",
      youtubeId: "2g4QTiXrw98",
      embedUrl: "https://www.youtube-nocookie.com/embed/2g4QTiXrw98",
      thumbnail: "https://img.youtube.com/vi/2g4QTiXrw98/hqdefault.jpg",
      topik: "Alat Ukur, Wadah Reaksi, Mikroskop, Pemanas",
      ringkasan: "Video komprehensif cara memegang mikroskop, membaca meniskus gelas ukur dengan tepat, memanaskan tabung reaksi dengan aman, dan merakit rangkaian pemanas pembakar spiritus dan kaki tiga."
    },
    {
      id: "vid-2",
      judul: "Prosedur Keselamatan Kerja dan Simbol Bahaya Bahan Kimia",
      durasi: "06:15",
      youtubeId: "BbE__JY1BfE",
      embedUrl: "https://www.youtube-nocookie.com/embed/BbE__JY1BfE",
      thumbnail: "https://img.youtube.com/vi/BbE__JY1BfE/hqdefault.jpg",
      topik: "K3 Lab, Standar APD, Piktogram Simbol Bahaya B3",
      ringkasan: "Panduan lengkap prosedur keselamatan kerja di laboratorium IPA (K3), tata tertib praktikum, pemakaian Alat Pelindung Diri (APD), serta arti simbol bahaya piktogram bahan kimia (B3)."
    }
  ],

  // 4. DATA SOAL EVALUASI (15 Soal Kurikulum Merdeka Fase D Kelas VII)
  soalEvaluasi: [
    {
      id: 1,
      soal: "Saat melakukan pengamatan mikroskopis pada preparat sel epidermis bawang merah, bayangan terlihat buram dan kurang fokus. Bagian mikroskop yang harus diputar secara perlahan untuk memperjelas dan menajamkan fokus bayangan adalah...",
      pilihan: [
        { id: "A", teks: "Revolver" },
        { id: "B", teks: "Mikrometer (Pemutar Halus)" },
        { id: "C", teks: "Makrometer (Pemutar Kasar)" },
        { id: "D", teks: "Diafragma" }
      ],
      kunci: "B",
      pembahasan: "Mikrometer (pemutar halus) berfungsi untuk menggerakkan tabung mikroskop atau meja preparat naik-turun secara sangat lambat dan presisi guna memperjelas ketajaman fokus bayangan."
    },
    {
      id: 2,
      soal: "Andi ingin mengukur volume 25,0 mL larutan asam cuka secara akurat untuk eksperimen sains. Alat laboratorium yang paling tepat digunakan Andi adalah...",
      pilihan: [
        { id: "A", teks: "Gelas Kimia (Beaker)" },
        { id: "B", teks: "Gelas Ukur" },
        { id: "C", teks: "Labu Erlenmeyer" },
        { id: "D", teks: "Tabung Reaksi" }
      ],
      kunci: "B",
      pembahasan: "Gelas ukur adalah alat ukur volume cairan yang terkalibrasi secara presisi. Gelas kimia dan labu Erlenmeyer hanya memiliki skala perkiraan kasar dan bukan untuk pengukuran volume akurat."
    },
    {
      id: 3,
      soal: "Perhatikan gambar simbol keselamatan kerja berikut! Simbol berupa gambar tengkorak bersilang di dalam belah ketupat menandakan bahwa bahan kimia tersebut bersifat...",
      pilihan: [
        { id: "A", teks: "Mudah Terbakar" },
        { id: "B", teks: "Korosif" },
        { id: "C", teks: "Beracun (Toxic)" },
        { id: "D", teks: "Mudah Meledak" }
      ],
      kunci: "C",
      pembahasan: "Simbol tengkorak dan tulang bersilang (Skull and Crossbones) menandakan zat beracun (toxic) yang dapat menyebabkan keracunan serius hingga kematian bila tertelan, terhirup, atau terserap kulit."
    },
    {
      id: 4,
      soal: "Cara yang benar dan aman untuk mematikan api pada pembakar spiritus setelah selesai praktikum adalah...",
      pilihan: [
        { id: "A", teks: "Meniup apinya dengan kencang dari atas" },
        { id: "B", teks: "Menyiram sumbu dengan air dingin" },
        { id: "C", teks: "Menutupkan penutup pembakar spiritus dari arah samping secara cepat" },
        { id: "D", teks: "Memotong sumbu menggunakan gunting" }
      ],
      kunci: "C",
      pembahasan: "Api pembakar spiritus dimatikan dengan menutupkan tutupnya dari samping agar pasokan oksigen terputus seketika. Meniup api justru berbahaya karena dapat menyemburkan uap alkohol dan memicu kebakaran."
    },
    {
      id: 5,
      soal: "Ketika memanaskan larutan kimia di dalam tabung reaksi dengan pembakar spiritus, posisi mulut tabung reaksi yang benar adalah...",
      pilihan: [
        { id: "A", teks: "Diarahkan menghadap ke atas lurus ke arah mata pengamat" },
        { id: "B", teks: "Diarahkan ke arah yang kosong dan tidak menghadap diri sendiri maupun teman" },
        { id: "C", teks: "Diarahkan ke arah teman kelompok di depannya" },
        { id: "D", teks: "Ditutup rapat dengan ibu jari" }
      ],
      kunci: "B",
      pembahasan: "Mulut tabung reaksi harus selalu diarahkan ke area aman/kosong yang tidak menghadap siapa pun untuk menghindari bahaya cipratan atau semburan uap/cairan panas saat mendidih mendadak."
    },
    {
      id: 6,
      soal: "Rani ingin memindahkan 5 tetes larutan iodin ke atas kaca objek. Alat yang tepat digunakan adalah...",
      pilihan: [
        { id: "A", teks: "Pipet Tetes" },
        { id: "B", teks: "Gelas Ukur" },
        { id: "C", teks: "Batang Pengaduk" },
        { id: "D", teks: "Spatula Kaca" }
      ],
      kunci: "A",
      pembahasan: "Pipet tetes berfungsi untuk mengambil dan memindahkan cairan dalam jumlah sangat sedikit tetes demi tetes."
    },
    {
      id: 7,
      soal: "Alat pelindung diri (APD) utama yang wajib dipakai saat bekerja di laboratorium IPA untuk melindungi mata dari percikan bahan kimia berbahaya adalah...",
      pilihan: [
        { id: "A", teks: "Jas Laboratorium" },
        { id: "B", teks: "Safety Goggles (Kacamata Pelindung)" },
        { id: "C", teks: "Sarung Tangan Karet" },
        { id: "D", teks: "Masker Kain" }
      ],
      kunci: "B",
      pembahasan: "Safety Goggles dirancang khusus menutupi area mata secara rapat untuk mencegah percikan zat kimia korosif, partikel debu berbahaya, atau pecahan kaca mengenai mata."
    },
    {
      id: 8,
      soal: "Saat membaca skala volume cairan berwarna bening pada gelas ukur, posisi mata yang benar adalah tegak lurus dengan...",
      pilihan: [
        { id: "A", teks: "Bagian permukaan cairan paling atas" },
        { id: "B", teks: "Dasar meniskus cekung cairan" },
        { id: "C", teks: "Puncak meniskus cembung cairan" },
        { id: "D", teks: "Tepi samping gelas ukur" }
      ],
      kunci: "B",
      pembahasan: "Untuk zat cair bening seperti air, pembacaan skala volume yang benar dilakukan sejajar lurus dengan dasar lengkungan bawah (meniskus cekung) guna menghindari kesalahan paralaks."
    },
    {
      id: 9,
      soal: "Sebuah botol zat kimia memiliki simbol cairan yang dituangkan dan melubangi permukaan tangan serta logam. Sifat bahan kimia tersebut adalah...",
      pilihan: [
        { id: "A", teks: "Mudah Terbakar" },
        { id: "B", teks: "Radioaktif" },
        { id: "C", teks: "Korosif" },
        { id: "D", teks: "Pengoksidasi" }
      ],
      kunci: "C",
      pembahasan: "Simbol cairan yang menetes dan merusak tangan serta pelat logam adalah simbol 'Korosif' (Corrosive), menandakan zat dapat merusak jaringan kulit dan mengikis logam (misal asam sulfat, asam klorida)."
    },
    {
      id: 10,
      soal: "Alat laboratorium yang digunakan untuk menimbang massa suatu zat padat dengan menggunakan tiga lengan geser berskala adalah...",
      pilihan: [
        { id: "A", teks: "Neraca Ohaus" },
        { id: "B", teks: "Dinamometer" },
        { id: "C", teks: "Jangka Sorong" },
        { id: "D", teks: "Mikrometer Sekrup" }
      ],
      kunci: "A",
      pembahasan: "Neraca Ohaus (Triple Beam Balance) adalah neraca tiga lengan yang digunakan untuk mengukur massa benda padat di laboratorium sains dengan ketelitian hingga 0,01 - 0,1 gram."
    },
    {
      id: 11,
      soal: "Alat yang berfungsi untuk menghaluskan bahan padat seperti daun pacar air atau kristal garam sebelum dilarutkan adalah...",
      pilihan: [
        { id: "A", teks: "Cawan Penguap" },
        { id: "B", teks: "Lumping dan Alu (Mortar & Pestle)" },
        { id: "C", teks: "Kaca Arloji" },
        { id: "D", teks: "Spatula Logam" }
      ],
      kunci: "B",
      pembahasan: "Lumping dan alu (mortar & pestle) terbuat dari porselen atau keramik tebal yang berfungsi untuk menumbuk dan menghaluskan sampel padatan atau jaringan biologi."
    },
    {
      id: 12,
      soal: "Jika tanganmu terkena tumpahan larutan asam klorida pekat saat praktikum, tindakan pertolongan pertama yang paling tepat dilakukan adalah...",
      pilihan: [
        { id: "A", teks: "Mengelapnya dengan tisu kering lalu membiarkannya" },
        { id: "B", teks: "Segera membilas tangan dengan air mengalir sebanyak-banyaknya selama minimal 15 menit dan lapor guru" },
        { id: "C", teks: "Menyiramnya dengan larutan basa pekat agar langsung netral" },
        { id: "D", teks: "Menutup luka dengan plester tanpa dibilas" }
      ],
      kunci: "B",
      pembahasan: "Pertolongan pertama pada paparan zat asam atau basa korosif pada kulit adalah membilas segera dengan air mengalir yang bersih dalam jumlah banyak (minimal 15 menit) untuk mengencerkan dan membuang zat kimia, lalu segera melapor kepada guru/petugas lab."
    },
    {
      id: 13,
      soal: "Benda tipis dan transparan yang diletakkan di atas spesimen pada kaca objek mikroskop untuk melindungi lensa objektif dari cairan preparat disebut...",
      pilihan: [
        { id: "A", teks: "Kaca Penutup (Cover Glass)" },
        { id: "B", teks: "Kaca Arloji" },
        { id: "C", teks: "Kertas Lensa" },
        { id: "D", teks: "Cawan Petri" }
      ],
      kunci: "A",
      pembahasan: "Kaca penutup (cover glass) berukuran tipis persegi/lingkaran yang ditaruh di atas spesimen untuk meratakan cairan dan mencegah spesimen bersentuhan langsung dengan lensa objektif mikroskop."
    },
    {
      id: 14,
      soal: "Di antara tindakan berikut, yang merupakan pelanggaran aturan keselamatan kerja (K3) di laboratorium IPA adalah...",
      pilihan: [
        { id: "A", teks: "Mengikat rambut panjang ke belakang saat praktikum dengan api" },
        { id: "B", teks: "Mencicipi rasa larutan kimia yang tidak berbau untuk mengetahui jenisnya" },
        { id: "C", teks: "Menggunakan kawat kasa saat memanaskan gelas beker di atas pembakar" },
        { id: "D", teks: "Membaca label pada botol reagen sebelum menuang isinya" }
      ],
      kunci: "B",
      pembahasan: "DILARANG KERAS mencicipi atau memasukkan bahan kimia apa pun ke dalam mulut di laboratorium, karena sebagian besar zat kimia bersifat toksik, beracun, atau berbahaya bagi tubuh."
    },
    {
      id: 15,
      soal: "Fungsi kawat kasa asbes yang diletakkan di atas kaki tiga saat memanaskan gelas kimia berisi air adalah...",
      pilihan: [
        { id: "A", teks: "Mencegah pembakar spiritus padam tertiup angin" },
        { id: "B", teks: "Meratakan persebaran panas api agar gelas kaca tidak pecah akibat pemanasan terpusat" },
        { id: "C", teks: "Mempercepat perubahan warna zat kimia" },
        { id: "D", teks: "Menampung uap air yang menetes" }
      ],
      kunci: "B",
      pembahasan: "Kawat kasa berfungsi sebagai alas penyangga sekaligus perata distribusi panas api spiritus ke seluruh permukaan dasar gelas beker agar tidak terjadi tegangan termal mendadak yang dapat memecahkan kaca."
    }
  ],

  // 5. DATA GAMES EDUKASI
  gameMatch: [
    { id: 1, alat: "Mikroskop Cahaya", icon: "fa-microscope", gambar: "img/tools/mikroskop.svg", fungsi: "Mengamati sel & jaringan mikroorganisme" },
    { id: 2, alat: "Gelas Ukur", icon: "fa-ruler-vertical", gambar: "img/tools/gelas-ukur.svg", fungsi: "Mengukur volume zat cair secara presisi" },
    { id: 3, alat: "Gelas Kimia", icon: "fa-flask-vial", gambar: "img/tools/gelas-kimia.svg", fungsi: "Menampung & melarutkan bahan kimia" },
    { id: 4, alat: "Neraca Ohaus", icon: "fa-scale-balanced", gambar: "img/tools/neraca-ohaus.svg", fungsi: "Menimbang massa zat padat dengan teliti" },
    { id: 5, alat: "Pembakar Spiritus", icon: "fa-fire", gambar: "img/tools/bunsen-spiritus.svg", fungsi: "Sumber nyala api untuk pemanasan zat" },
    { id: 6, alat: "Tabung Reaksi", icon: "fa-vial", gambar: "img/tools/tabung-reaksi.svg", fungsi: "Mereaksikan sedikit zat kimia dalam skala kecil" }
  ],

  gameSymbols: [
    { 
      id: 1, 
      nama: "Mudah Terbakar", 
      clue: "Menyala hebat bila ada percikan api, panas, atau loncatan listrik (contoh: alkohol & aseton)", 
      icon: "fa-fire-flame-curved", 
      color: "#e74c3c", 
      gambar: "img/k3/flammable.svg" 
    },
    { 
      id: 2, 
      nama: "Beracun (Toxic)", 
      clue: "Menyebabkan kematian fatal atau keracunan kronis bila tertelan, terhirup, atau terserap kulit", 
      icon: "fa-skull-crossbones", 
      color: "#8e44ad", 
      gambar: "img/k3/toxic.svg" 
    },
    { 
      id: 3, 
      nama: "Korosif", 
      clue: "Merusak jaringan kulit dan melubangi/mengikis permukaan logam (contoh: H2SO4 pekat)", 
      icon: "fa-hand-dots", 
      color: "#2980b9", 
      gambar: "img/k3/corrosive.svg" 
    },
    { 
      id: 4, 
      nama: "Mudah Meledak", 
      clue: "Bereaksi meledak hebat saat terkena benturan, gesekan, atau kenaikan suhu mendadak", 
      icon: "fa-bomb", 
      color: "#d35400", 
      gambar: "img/k3/explosive.svg" 
    },
    { 
      id: 5, 
      nama: "Pengoksidasi", 
      clue: "Melepaskan oksigen dan dapat memicu atau mempercepat kebakaran bahan lain", 
      icon: "fa-circle-radiation", 
      color: "#f39c12", 
      gambar: "img/k3/oxidizing.svg" 
    },
    { 
      id: 6, 
      nama: "Iritan / Bahaya Kesehatan", 
      clue: "Menyebabkan rasa gatal, perih, kemerahan, atau iritasi saluran pernapasan", 
      icon: "fa-triangle-exclamation", 
      color: "#e67e22", 
      gambar: "img/k3/irritant.svg" 
    }
  ]
};

window.LAB_DATA = LAB_DATA;
