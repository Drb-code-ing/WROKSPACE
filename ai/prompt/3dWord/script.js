(function() {
    'use strict';

    // ==================== 配置常量 ====================
    const CONFIG = {
        WORLD_SIZE: 8,
        CELL_SIZE: 1,
        GRID_HEIGHT: 0.1,
        CAMERA_DISTANCE: 12,
        CAMERA_MIN_DISTANCE: 6,
        CAMERA_MAX_DISTANCE: 20,
        CAMERA_ANGLE: Math.PI / 4, // 45度俯视角
        COLORS: {
            grass: 0x7cb342,
            dirt: 0x8d6e63,
            water: 0x42a5f5,
            stone: 0x9e9e9e,
            treeTrunk: 0x795548,
            treeLeaves: 0x43a047,
            houseWall: 0xffcc80,
            houseRoof: 0xe57373,
            highlight: 0xffffff
        }
    };

    // ==================== 全局状态 ====================
    const state = {
        world: [],
        currentTool: 'grass',
        currentSaveSlot: 0,
        cameraAngle: 0,
        cameraDistance: CONFIG.CAMERA_DISTANCE,
        isDragging: false,
        lastMouseX: 0,
        lastMouseY: 0,
        hoveredCell: null
    };

    // ==================== Three.js 核心对象 ====================
    let scene, camera, renderer;
    let gridGroup, objectsGroup, highlightMesh;
    let raycaster, mouse;

    // ==================== DOM 元素 ====================
    const container = document.getElementById('world-container');
    const minimapCanvas = document.getElementById('minimap');
    const minimapCtx = minimapCanvas.getContext('2d');
    const tutorial = document.getElementById('tutorial');
    const saveSlotSelect = document.getElementById('saveSlot');
    const resetBtn = document.getElementById('resetBtn');
    const clearBtn = document.getElementById('clearBtn');
    const toolItems = document.querySelectorAll('.tool-item');

    // ==================== 场景初始化 ====================
    function initScene() {
        // 创建场景
        scene = new THREE.Scene();

        // 创建相机
        camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        updateCameraPosition();

        // 创建渲染器
        renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(renderer.domElement);

        // 创建射线投射器和鼠标向量
        raycaster = new THREE.Raycaster();
        mouse = new THREE.Vector2();

        // 创建组
        gridGroup = new THREE.Group();
        objectsGroup = new THREE.Group();
        scene.add(gridGroup);
        scene.add(objectsGroup);

        // 创建高亮网格
        const highlightGeometry = new THREE.BoxGeometry(
            CONFIG.CELL_SIZE,
            CONFIG.GRID_HEIGHT * 2,
            CONFIG.CELL_SIZE
        );
        const highlightMaterial = new THREE.MeshBasicMaterial({
            color: CONFIG.COLORS.highlight,
            transparent: true,
            opacity: 0.3
        });
        highlightMesh = new THREE.Mesh(highlightGeometry, highlightMaterial);
        highlightMesh.visible = false;
        scene.add(highlightMesh);
    }

    // ==================== 光照系统 ====================
    function initLighting() {
        // 环境光 - 柔和的自然光
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        // 方向光 - 模拟日光
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 7);
        directionalLight.castShadow = true;

        // 配置阴影
        directionalLight.shadow.mapSize.width = 1024;
        directionalLight.shadow.mapSize.height = 1024;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.camera.left = -10;
        directionalLight.shadow.camera.right = 10;
        directionalLight.shadow.camera.top = 10;
        directionalLight.shadow.camera.bottom = -10;
        directionalLight.shadow.bias = -0.0001;

        scene.add(directionalLight);
    }

    // ==================== 相机控制 ====================
    function updateCameraPosition() {
        const x = state.cameraDistance * Math.sin(state.cameraAngle) * Math.cos(CONFIG.CAMERA_ANGLE);
        const y = state.cameraDistance * Math.sin(CONFIG.CAMERA_ANGLE);
        const z = state.cameraDistance * Math.cos(state.cameraAngle) * Math.cos(CONFIG.CAMERA_ANGLE);
        
        camera.position.set(x, y, z);
        camera.lookAt(0, 0, 0);
    }

    // ==================== 世界数据管理 ====================
    function initWorldData() {
        state.world = [];
        for (let x = 0; x < CONFIG.WORLD_SIZE; x++) {
            state.world[x] = [];
            for (let z = 0; z < CONFIG.WORLD_SIZE; z++) {
                state.world[x][z] = {
                    terrain: 'grass',
                    kind: null
                };
            }
        }
    }

    function setCell(x, z, terrain, kind) {
        if (x < 0 || x >= CONFIG.WORLD_SIZE || z < 0 || z >= CONFIG.WORLD_SIZE) {
            return;
        }

        state.world[x][z].terrain = terrain;
        state.world[x][z].kind = kind;

        // 更新3D显示
        renderCell(x, z);
        // 更新小地图
        renderMinimap();
        // 保存到本地存储
        saveWorld();
    }

    // ==================== 3D物体工厂 ====================
    function createTerrainMesh(type) {
        const geometry = new THREE.BoxGeometry(
            CONFIG.CELL_SIZE,
            CONFIG.GRID_HEIGHT,
            CONFIG.CELL_SIZE
        );
        
        let color;
        switch (type) {
            case 'grass':
                color = CONFIG.COLORS.grass;
                break;
            case 'dirt':
                color = CONFIG.COLORS.dirt;
                break;
            case 'water':
                color = CONFIG.COLORS.water;
                break;
            default:
                color = CONFIG.COLORS.grass;
        }

        const material = new THREE.MeshStandardMaterial({
            color: color,
            transparent: type === 'water',
            opacity: type === 'water' ? 0.8 : 1
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.receiveShadow = true;
        mesh.castShadow = true;

        return mesh;
    }

    function createObjectMesh(kind) {
        const group = new THREE.Group();

        switch (kind) {
            case 'stone':
                const stoneGeometry = new THREE.IcosahedronGeometry(0.3, 0);
                const stoneMaterial = new THREE.MeshStandardMaterial({
                    color: CONFIG.COLORS.stone
                });
                const stone = new THREE.Mesh(stoneGeometry, stoneMaterial);
                stone.position.y = 0.2;
                stone.rotation.set(
                    Math.random() * Math.PI,
                    Math.random() * Math.PI,
                    Math.random() * Math.PI
                );
                stone.castShadow = true;
                stone.receiveShadow = true;
                group.add(stone);
                break;

            case 'tree':
                // 树干
                const trunkGeometry = new THREE.CylinderGeometry(0.1, 0.15, 0.6, 6);
                const trunkMaterial = new THREE.MeshStandardMaterial({
                    color: CONFIG.COLORS.treeTrunk
                });
                const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
                trunk.position.y = 0.4;
                trunk.castShadow = true;
                trunk.receiveShadow = true;
                group.add(trunk);

                // 树叶
                const leavesGeometry = new THREE.ConeGeometry(0.5, 0.8, 6);
                const leavesMaterial = new THREE.MeshStandardMaterial({
                    color: CONFIG.COLORS.treeLeaves
                });
                const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
                leaves.position.y = 1.0;
                leaves.castShadow = true;
                leaves.receiveShadow = true;
                group.add(leaves);
                break;

            case 'house':
                // 墙壁
                const wallGeometry = new THREE.BoxGeometry(0.7, 0.5, 0.7);
                const wallMaterial = new THREE.MeshStandardMaterial({
                    color: CONFIG.COLORS.houseWall
                });
                const walls = new THREE.Mesh(wallGeometry, wallMaterial);
                walls.position.y = 0.35;
                walls.castShadow = true;
                walls.receiveShadow = true;
                group.add(walls);

                // 屋顶
                const roofGeometry = new THREE.ConeGeometry(0.5, 0.4, 4);
                const roofMaterial = new THREE.MeshStandardMaterial({
                    color: CONFIG.COLORS.houseRoof
                });
                const roof = new THREE.Mesh(roofGeometry, roofMaterial);
                roof.position.y = 0.8;
                roof.rotation.y = Math.PI / 4;
                roof.castShadow = true;
                roof.receiveShadow = true;
                group.add(roof);
                break;
        }

        return group;
    }

    function renderCell(x, z) {
        // 计算世界坐标（中心在原点）
        const worldX = (x - CONFIG.WORLD_SIZE / 2 + 0.5) * CONFIG.CELL_SIZE;
        const worldZ = (z - CONFIG.WORLD_SIZE / 2 + 0.5) * CONFIG.CELL_SIZE;

        // 移除旧的地形和物体
        const oldChildren = gridGroup.children.filter(child => {
            return child.userData.x === x && child.userData.z === z;
        });
        oldChildren.forEach(child => gridGroup.remove(child));

        const oldObjects = objectsGroup.children.filter(child => {
            return child.userData.x === x && child.userData.z === z;
        });
        oldObjects.forEach(child => objectsGroup.remove(child));

        // 创建新地形
        const cellData = state.world[x][z];
        const terrainMesh = createTerrainMesh(cellData.terrain);
        terrainMesh.position.set(worldX, CONFIG.GRID_HEIGHT / 2, worldZ);
        terrainMesh.userData = { x, z, type: 'terrain' };
        gridGroup.add(terrainMesh);

        // 创建物体
        if (cellData.kind) {
            const objectMesh = createObjectMesh(cellData.kind);
            objectMesh.position.set(worldX, CONFIG.GRID_HEIGHT, worldZ);
            objectMesh.userData = { x, z, type: 'object' };
            objectsGroup.add(objectMesh);
        }
    }

    function renderAllCells() {
        gridGroup.clear();
        objectsGroup.clear();

        for (let x = 0; x < CONFIG.WORLD_SIZE; x++) {
            for (let z = 0; z < CONFIG.WORLD_SIZE; z++) {
                renderCell(x, z);
            }
        }
    }

    // ==================== 交互系统 ====================
    function initInteractions() {
        // 鼠标移动 - 悬停检测
        container.addEventListener('mousemove', onMouseMove);
        
        // 鼠标按下 - 开始拖拽或放置
        container.addEventListener('mousedown', onMouseDown);
        
        // 鼠标释放 - 结束拖拽
        window.addEventListener('mouseup', onMouseUp);
        
        // 鼠标滚轮 - 缩放
        container.addEventListener('wheel', onMouseWheel);
        
        // 窗口大小改变
        window.addEventListener('resize', onWindowResize);

        // 工具选择
        toolItems.forEach(item => {
            item.addEventListener('click', () => {
                toolItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                state.currentTool = item.dataset.tool;
            });
        });

        // 存档选择
        saveSlotSelect.addEventListener('change', () => {
            state.currentSaveSlot = parseInt(saveSlotSelect.value);
            loadWorld();
            renderAllCells();
            renderMinimap();
        });

        // 重置按钮
        resetBtn.addEventListener('click', () => {
            generateRandomWorld();
            renderAllCells();
            renderMinimap();
            saveWorld();
        });

        // 清空按钮
        clearBtn.addEventListener('click', () => {
            initWorldData();
            renderAllCells();
            renderMinimap();
            saveWorld();
        });
    }

    function onMouseMove(event) {
        // 更新鼠标坐标
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // 处理拖拽旋转
        if (state.isDragging) {
            const deltaX = event.clientX - state.lastMouseX;
            state.cameraAngle += deltaX * 0.005;
            updateCameraPosition();
            
            state.lastMouseX = event.clientX;
            state.lastMouseY = event.clientY;
        }

        // 射线检测悬停
        updateHover();
    }

    function onMouseDown(event) {
        if (event.button === 0) { // 左键
            // 检查是否点击在UI上
            if (event.target.closest('.glass')) {
                return;
            }

            state.isDragging = true;
            state.lastMouseX = event.clientX;
            state.lastMouseY = event.clientY;

            // 尝试放置物体
            placeObject();
        }
    }

    function onMouseUp(event) {
        if (event.button === 0) {
            state.isDragging = false;
        }
    }

    function onMouseWheel(event) {
        event.preventDefault();
        
        // 缩放相机
        state.cameraDistance += event.deltaY * 0.01;
        state.cameraDistance = Math.max(
            CONFIG.CAMERA_MIN_DISTANCE,
            Math.min(CONFIG.CAMERA_MAX_DISTANCE, state.cameraDistance)
        );
        updateCameraPosition();
    }

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function updateHover() {
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(gridGroup.children);

        if (intersects.length > 0) {
            const hit = intersects[0];
            const x = hit.object.userData.x;
            const z = hit.object.userData.z;

            if (state.hoveredCell !== `${x},${z}`) {
                state.hoveredCell = `${x},${z}`;
                
                // 更新高亮位置
                const worldX = (x - CONFIG.WORLD_SIZE / 2 + 0.5) * CONFIG.CELL_SIZE;
                const worldZ = (z - CONFIG.WORLD_SIZE / 2 + 0.5) * CONFIG.CELL_SIZE;
                highlightMesh.position.set(worldX, CONFIG.GRID_HEIGHT, worldZ);
                highlightMesh.visible = true;
            }
        } else {
            state.hoveredCell = null;
            highlightMesh.visible = false;
        }
    }

    function placeObject() {
        if (!state.hoveredCell) return;

        const [x, z] = state.hoveredCell.split(',').map(Number);
        
        switch (state.currentTool) {
            case 'grass':
                setCell(x, z, 'grass', null);
                break;
            case 'dirt':
                setCell(x, z, 'dirt', null);
                break;
            case 'water':
                setCell(x, z, 'water', null);
                break;
            case 'stone':
                if (state.world[x][z].terrain !== 'water') {
                    setCell(x, z, state.world[x][z].terrain, 'stone');
                }
                break;
            case 'tree':
                if (state.world[x][z].terrain !== 'water') {
                    setCell(x, z, state.world[x][z].terrain, 'tree');
                }
                break;
            case 'house':
                if (state.world[x][z].terrain !== 'water') {
                    setCell(x, z, state.world[x][z].terrain, 'house');
                }
                break;
            case 'erase':
                setCell(x, z, 'grass', null);
                break;
        }
    }

    // ==================== 持久化存储 ====================
    function saveWorld() {
        const saveData = JSON.stringify(state.world);
        localStorage.setItem(`tinyWorld_${state.currentSaveSlot}`, saveData);
    }

    function loadWorld() {
        const saveData = localStorage.getItem(`tinyWorld_${state.currentSaveSlot}`);
        if (saveData) {
            try {
                state.world = JSON.parse(saveData);
            } catch (e) {
                console.error('加载存档失败，使用默认世界', e);
                initWorldData();
            }
        } else {
            // 首次加载生成随机世界
            generateRandomWorld();
        }
    }

    // ==================== 小地图渲染 ====================
    function renderMinimap() {
        const cellSize = minimapCanvas.width / CONFIG.WORLD_SIZE;
        
        minimapCtx.clearRect(0, 0, minimapCanvas.width, minimapCanvas.height);

        // 绘制地形
        for (let x = 0; x < CONFIG.WORLD_SIZE; x++) {
            for (let z = 0; z < CONFIG.WORLD_SIZE; z++) {
                const cell = state.world[x][z];
                
                // 地形颜色
                switch (cell.terrain) {
                    case 'grass':
                        minimapCtx.fillStyle = '#7cb342';
                        break;
                    case 'dirt':
                        minimapCtx.fillStyle = '#8d6e63';
                        break;
                    case 'water':
                        minimapCtx.fillStyle = '#42a5f5';
                        break;
                }
                
                minimapCtx.fillRect(x * cellSize, z * cellSize, cellSize, cellSize);

                // 物体剪影
                if (cell.kind) {
                    switch (cell.kind) {
                        case 'stone':
                            minimapCtx.fillStyle = '#616161';
                            minimapCtx.beginPath();
                            minimapCtx.arc(
                                x * cellSize + cellSize / 2,
                                z * cellSize + cellSize / 2,
                                cellSize / 4,
                                0,
                                Math.PI * 2
                            );
                            minimapCtx.fill();
                            break;
                        case 'tree':
                            minimapCtx.fillStyle = '#2e7d32';
                            minimapCtx.beginPath();
                            minimapCtx.arc(
                                x * cellSize + cellSize / 2,
                                z * cellSize + cellSize / 2,
                                cellSize / 3,
                                0,
                                Math.PI * 2
                            );
                            minimapCtx.fill();
                            break;
                        case 'house':
                            minimapCtx.fillStyle = '#e57373';
                            minimapCtx.fillRect(
                                x * cellSize + cellSize / 4,
                                z * cellSize + cellSize / 4,
                                cellSize / 2,
                                cellSize / 2
                            );
                            break;
                    }
                }
            }
        }

        // 绘制网格线
        minimapCtx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        minimapCtx.lineWidth = 1;
        
        for (let i = 0; i <= CONFIG.WORLD_SIZE; i++) {
            minimapCtx.beginPath();
            minimapCtx.moveTo(i * cellSize, 0);
            minimapCtx.lineTo(i * cellSize, minimapCanvas.height);
            minimapCtx.stroke();
            
            minimapCtx.beginPath();
            minimapCtx.moveTo(0, i * cellSize);
            minimapCtx.lineTo(minimapCanvas.width, i * cellSize);
            minimapCtx.stroke();
        }
    }

    // ==================== 程序化生成 ====================
    function generateRandomWorld() {
        initWorldData();

        // 1. 生成水塘（1-2个）
        const pondCount = Math.floor(Math.random() * 2) + 1;
        for (let i = 0; i < pondCount; i++) {
            const pondX = Math.floor(Math.random() * (CONFIG.WORLD_SIZE - 2)) + 1;
            const pondZ = Math.floor(Math.random() * (CONFIG.WORLD_SIZE - 2)) + 1;
            const pondSize = Math.floor(Math.random() * 2) + 1;
            
            for (let dx = -pondSize; dx <= pondSize; dx++) {
                for (let dz = -pondSize; dz <= pondSize; dz++) {
                    if (Math.random() > 0.3) {
                        const x = pondX + dx;
                        const z = pondZ + dz;
                        if (x >= 0 && x < CONFIG.WORLD_SIZE && z >= 0 && z < CONFIG.WORLD_SIZE) {
                            state.world[x][z].terrain = 'water';
                        }
                    }
                }
            }
        }

        // 2. 生成连通的小路
        // 先确定几个关键点
        const pathPoints = [];
        const houseCount = Math.floor(Math.random() * 3) + 2;
        
        for (let i = 0; i < houseCount; i++) {
            let x, z;
            do {
                x = Math.floor(Math.random() * CONFIG.WORLD_SIZE);
                z = Math.floor(Math.random() * CONFIG.WORLD_SIZE);
            } while (state.world[x][z].terrain === 'water');
            
            pathPoints.push({ x, z });
        }

        // 连接所有点
        for (let i = 0; i < pathPoints.length - 1; i++) {
            const start = pathPoints[i];
            const end = pathPoints[i + 1];
            
            let x = start.x;
            let z = start.z;
            
            while (x !== end.x || z !== end.z) {
                if (state.world[x][z].terrain !== 'water') {
                    state.world[x][z].terrain = 'dirt';
                }
                
                if (x < end.x) x++;
                else if (x > end.x) x--;
                else if (z < end.z) z++;
                else if (z > end.z) z--;
            }
        }

        // 3. 放置房子
        pathPoints.forEach(point => {
            if (state.world[point.x][point.z].terrain !== 'water') {
                // 房子放在路旁边
                const offsets = [[0, 1], [0, -1], [1, 0], [-1, 0]];
                for (const [dx, dz] of offsets) {
                    const nx = point.x + dx;
                    const nz = point.z + dz;
                    if (nx >= 0 && nx < CONFIG.WORLD_SIZE && 
                        nz >= 0 && nz < CONFIG.WORLD_SIZE &&
                        state.world[nx][nz].terrain === 'grass' &&
                        state.world[nx][nz].kind === null) {
                        state.world[nx][nz].kind = 'house';
                        break;
                    }
                }
            }
        });

        // 4. 随机放置石头
        const stoneCount = Math.floor(Math.random() * 5) + 3;
        for (let i = 0; i < stoneCount; i++) {
            let x, z;
            do {
                x = Math.floor(Math.random() * CONFIG.WORLD_SIZE);
                z = Math.floor(Math.random() * CONFIG.WORLD_SIZE);
            } while (
                state.world[x][z].terrain === 'water' || 
                state.world[x][z].kind !== null
            );
            state.world[x][z].kind = 'stone';
        }

        // 5. 随机放置树
        const treeCount = Math.floor(Math.random() * 8) + 5;
        for (let i = 0; i < treeCount; i++) {
            let x, z;
            do {
                x = Math.floor(Math.random() * CONFIG.WORLD_SIZE);
                z = Math.floor(Math.random() * CONFIG.WORLD_SIZE);
            } while (
                state.world[x][z].terrain === 'water' || 
                state.world[x][z].kind !== null
            );
            state.world[x][z].kind = 'tree';
        }
    }

    // ==================== 动画循环 ====================
    function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
    }

    // ==================== 启动流程 ====================
    function init() {
        initScene();
        initLighting();
        initWorldData();
        loadWorld();
        renderAllCells();
        renderMinimap();
        initInteractions();
        animate();

        // 显示操作提示，3秒后淡出
        if (!localStorage.getItem('tinyWorld_tutorialShown')) {
            setTimeout(() => {
                tutorial.classList.add('fade-out');
                localStorage.setItem('tinyWorld_tutorialShown', 'true');
            }, 3000);
        } else {
            tutorial.style.display = 'none';
        }
    }

    // 启动应用
    init();
})();