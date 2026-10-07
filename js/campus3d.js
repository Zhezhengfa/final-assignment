$(function () {
  initCampus3D();
});
function initCampus3D() {
  var wrap = document.getElementById('threeWrap');
  var state = document.getElementById('threeState');
  var tip = document.getElementById('threeTip');
  if (!wrap) {
    return;
  }
  try {
    if (!window.THREE) {
      throw new Error('Three.js 库加载失败，请检查网络后刷新页面');
    }
    var testCanvas = document.createElement('canvas');
    var gl = testCanvas.getContext('webgl') ||
             testCanvas.getContext('experimental-webgl');
    if (!gl) {
      throw new Error('当前浏览器不支持 WebGL，无法显示三维校园');
    }
    var width = wrap.clientWidth;
    var height = wrap.clientHeight;
    var scene = new THREE.Scene();
    scene.background = new THREE.Color(0xcfe8ff);
    scene.fog = new THREE.Fog(0xcfe8ff, 35, 70);
    var camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 200);
    camera.position.set(20, 16, 22);
    var renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    wrap.appendChild(renderer.domElement);
    var hemiLight = new THREE.HemisphereLight(0xffffff, 0x8fbf8f, 0.7);
    scene.add(hemiLight);
    var dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(14, 22, 10);
    dirLight.castShadow = true;
    dirLight. shadow . camera . left = - 30 ;
    dirLight.shadow.camera.right = 30;
    dirLight.shadow.camera.top = 30;
    dirLight.shadow.camera.bottom = -30;
    dirLight.shadow.mapSize.set(1024, 1024); // 阴影清晰度
    scene.add(dirLight);
    var groundGeo = new THREE.PlaneGeometry(50, 38);
    var groundMat = new THREE.MeshLambertMaterial({ color: 0x9ccc8a });
    var ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2; // 平面平铺
    ground.receiveShadow = true;
    scene.add(ground);
    var roadMat = new THREE.MeshLambertMaterial({ color: 0x9ca3af });
    var roadH = new THREE.Mesh(new THREE.BoxGeometry(50, 0.1, 3), roadMat);
    roadH.position.set(0, 0.05, 0);
    scene.add(roadH);
    var roadV = new THREE.Mesh(new THREE.BoxGeometry(3, 0.1, 38), roadMat);
    roadV.position.set(0, 0.05, 0);
    scene.add(roadV);
    var buildingData = [
      { name: '中心图书馆', x: -12, z: 9,  w: 6, h: 7, d: 5, color: 0x2563eb },
      { name: '第一教学楼', x: 8,   z: 10, w: 6, h: 4, d: 4, color: 0x8b5cf6 },
      { name: '第二教学楼', x: 14,  z: -8, w: 5, h: 4, d: 6, color: 0x8b5cf6 },
      { name: '文理楼',     x: -16, z: -8, w: 5, h: 3.5, d: 4, color: 0x8b5cf6 },
      { name: '第一食堂',   x: -6,  z: -12, w: 4, h: 3, d: 4, color: 0xf59e0b },
      { name: '第二食堂',   x: 6,   z: -12, w: 4, h: 3, d: 4, color: 0xf59e0b },
      { name: '教工食堂',   x: 12,  z: 6,   w: 3.5, h: 2.5, d: 3.5, color: 0xf59e0b }
    ];
    var buildingMeshes = [];
    buildingData.forEach(function (b) {
      var body = new THREE.Mesh(
        new THREE.BoxGeometry(b.w, b.h, b.d),
        new THREE.MeshLambertMaterial({ color: b.color })
      );
      body.position.set(b.x, b.h / 2 + 0.05, b.z);
      body.castShadow = true;
      body.userData.name = b.name;
      scene.add(body);
      buildingMeshes.push(body);
      var edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(body.geometry),
        new THREE.LineBasicMaterial({ color: 0xffffff })
      );
      body.add(edges);
      edges.position.y = 0; 
    });
    var trunkMat = new THREE.MeshLambertMaterial({ color: 0x92603a });
    var leafMat = new THREE.MeshLambertMaterial({ color: 0x3f9142 });
    var treePositions = [
      [-22, 14], [-20, -14], [22, 14], [20, -14], [-8, 16],
      [4, 16], [-22, 0], [22, 2], [0, 15], [-13, 2],
      [16, 13], [-5, 6], [10, -3], [-10, -15]
    ];
    treePositions.forEach(function (p) {
      var tree = new THREE.Group();
      var trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.22, 1.2, 8),
        trunkMat
      );
      trunk.position.y = 0.6;
      trunk.castShadow = true;
      tree.add(trunk);
      var leaves = new THREE.Mesh(
        new THREE.ConeGeometry(0.9, 2, 10),
        leafMat
      );
      leaves.position.y = 2.1;
      leaves.castShadow = true;
      tree.add(leaves);
      tree.position.set(p[0], 0, p[1]);
      scene.add(tree);
    });
    var controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1, 0);
    controls.enableDamping = true;     
    controls.dampingFactor = 0.08;
    controls.minDistance = 8;
    controls.maxDistance = 45;
    controls.maxPolarAngle = Math.PI / 2.1;
    controls.autoRotate = true;       
    controls.autoRotateSpeed = 0.6;
    controls.addEventListener('start', function () {
      controls.autoRotate = false;
    });
    var raycaster = new THREE.Raycaster();
    var mouse = new THREE.Vector2();
    function pickBuilding(event) {
      var rect = renderer.domElement.getBoundingClientRect();
      var clientX, clientY;
      if (event.originalEvent.touches && event.originalEvent.touches.length > 0) {
        clientX = event.originalEvent.touches[0].clientX;
        clientY = event.originalEvent.touches[0].clientY;
      } else {
        clientX = event.clientX;
        clientY = event.clientY;
      }
      mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      var hits = raycaster.intersectObjects(buildingMeshes);
      return hits.length > 0 ? hits[0].object : null;
    }
    $(renderer.domElement).on('pointermove', function (event) {
      var obj = pickBuilding(event);
      if (obj) {
        tip.textContent = obj.userData.name;
        tip.style.display = 'block';
        renderer.domElement.style.cursor = 'pointer';
      } else {
        tip.style.display = 'none';
        renderer.domElement.style.cursor = 'default';
      }
    });
    $(renderer.domElement).on('click', function (event) {
      var obj = pickBuilding(event);
      if (obj) {
        showMessage('你选中了：' + obj.userData.name, 'success');
      }
    });
    $(window).on('resize', function () {
      var w = wrap.clientWidth;
      var h = wrap.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    function animate() {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();
    state.style.display = 'none';
  } catch (err) {
    state.innerHTML =
      '<div class="state-box">' +
      '<div class="emoji">⚠️</div>' +
      '<p class="mt-2 mb-0"></p>' +
      '</div>';
    state.querySelector('p').textContent = '三维校园无法显示：' + err.message;
    showMessage('Three.js 初始化失败：' + err.message, 'warning');
  }
}