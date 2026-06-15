// ============================================================
// 打飞机小游戏 — 积分升级 + 敌兵种 + Boss + 敌弹
// ============================================================

// ---------- DOM ----------
const canvas = document.getElementById('gameCanvas')
const ctx = canvas.getContext('2d')

// ---------- 画布 ----------
const W = 480
const H = 700
canvas.width = W
canvas.height = H

function resize() {
  const scale = Math.min(window.innerWidth / W, window.innerHeight / H)
  canvas.style.width = W * scale + 'px'
  canvas.style.height = H * scale + 'px'
}
window.addEventListener('resize', resize)
resize()

// ============================================================
// 玩家升级配置（分数门槛拉大，慢慢升）
// ============================================================
const LEVEL_CONFIG = [
  { score: 0,    name: '初级',  bullets: 1, cooldown: 0.28, speed: 340, bulletColor: '#ffeb3b', playerColor: '#00e5ff', spread: 0 },
  { score: 150,  name: '进阶',  bullets: 2, cooldown: 0.24, speed: 400, bulletColor: '#ffeb3b', playerColor: '#00e5ff', spread: 10 },
  { score: 400,  name: '精英',  bullets: 3, cooldown: 0.19, speed: 460, bulletColor: '#ff9800', playerColor: '#40c4ff', spread: 14 },
  { score: 800,  name: '王牌',  bullets: 5, cooldown: 0.14, speed: 530, bulletColor: '#ff5722', playerColor: '#7c4dff', spread: 16 },
  { score: 1500, name: '传说',  bullets: 7, cooldown: 0.09, speed: 620, bulletColor: '#e040fb', playerColor: '#ff4081', spread: 18 },
]

// ============================================================
// 敌兵种定义
// ============================================================
// type: 'scout' | 'fighter' | 'tank' | 'boss'
// scouts/fighters/tanks are "小兵" that also get stronger with level

function enemyStats(type, level) {
  const tier = level  // 0-4
  switch (type) {
    case 'scout':
      return {
        name: '侦察机', w: 24, h: 24,
        speed: 180 + tier * 25 + Math.random() * 80,
        hp: 1, score: 10 + tier * 3,
        color: '#ff4444', cockpitColor: '#ffcccc',
        canShoot: false,
      }
    case 'fighter':
      return {
        name: '战斗机', w: 34, h: 34,
        speed: 120 + tier * 20 + Math.random() * 60,
        hp: 1, score: 20 + tier * 5,
        color: '#ff6d00', cockpitColor: '#ffe0b2',
        canShoot: tier >= 2,  // Lv.3+ 战斗机会射击
        shootInterval: 2.5 - tier * 0.3,
      }
    case 'tank':
      return {
        name: '重装机', w: 44, h: 44,
        speed: 80 + tier * 15 + Math.random() * 40,
        hp: 2 + Math.floor(tier / 2),  // 2-4 HP
        score: 40 + tier * 10,
        color: '#aa00ff', cockpitColor: '#e1bee7',
        canShoot: true,
        shootInterval: 2.0 - tier * 0.25,
      }
    case 'boss':
      return {
        name: 'BOSS', w: 72, h: 72,
        speed: 60 + tier * 10,
        hp: 18 + tier * 8,   // 18-50 HP
        score: 200 + tier * 60,
        color: '#ff1744', cockpitColor: '#ffffff',
        canShoot: true,
        shootInterval: 0.6 - tier * 0.06,  // 高等级 Boss 射击更密
      }
  }
}

// ============================================================
// 玩家
// ============================================================
const player = { w: 40, h: 48, x: W / 2 - 20, y: H - 80 }

// ============================================================
// 游戏状态
// ============================================================
let bullets = []         // 玩家子弹
let enemyBullets = []    // 敌弹
let enemies = []         // 敌机（含 Boss）
let particles = []
let levelUpTexts = []
let bulletTimer = 0
let spawnTimer = 0
let bossSpawnScore = 400 // 每 400 分出一个 Boss
let lastBossScore = 0
let score = 0
let totalKills = 0
let gameOver = false
let currentLevel = 0
let shieldActive = false
let shieldTimer = 0
let bombCount = 1
let bombCooldown = 0

// ============================================================
// 辅助
// ============================================================
function getLevel() {
  let lv = 0
  for (let i = LEVEL_CONFIG.length - 1; i >= 0; i--) {
    if (score >= LEVEL_CONFIG[i].score) { lv = i; break }
  }
  return lv
}
function getCfg() { return LEVEL_CONFIG[currentLevel] }

const keys = {}
window.addEventListener('keydown', e => { keys[e.code] = true; e.preventDefault() })
window.addEventListener('keyup',   e => { keys[e.code] = false; e.preventDefault() })

function rectsCollide(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}

// ============================================================
// 粒子 & 飘字
// ============================================================
function spawnParticles(x, y, color, count = 12) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2
    const s = 60 + Math.random() * 200
    particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
      life: 0.35 + Math.random() * 0.5, maxLife: 0.35 + Math.random() * 0.5,
      color, r: 1.5 + Math.random() * 2.5 })
  }
}
function spawnFloatText(text, color, life = 2.0) {
  levelUpTexts.push({ text, x: W / 2, y: H / 2, life, maxLife: life, color })
}

// ============================================================
// 重置
// ============================================================
function reset() {
  player.x = W / 2 - player.w / 2
  player.y = H - 80
  bullets = []
  enemyBullets = []
  enemies = []
  particles = []
  levelUpTexts = []
  bulletTimer = 0
  spawnTimer = 0
  lastBossScore = 0
  score = 0
  totalKills = 0
  currentLevel = 0
  shieldActive = false
  shieldTimer = 0
  bombCount = 1
  bombCooldown = 0
  gameOver = false
}

// ============================================================
// 玩家射击
// ============================================================
function shoot() {
  const cfg = getCfg()
  const cx = player.x + player.w / 2
  const ty = player.y
  const n = cfg.bullets
  const s = cfg.spread
  const step = n > 1 ? (s * 2) / (n - 1) : 0
  for (let i = 0; i < n; i++) {
    const ox = n === 1 ? 0 : -s + i * step
    bullets.push({ x: cx - 2 + ox, y: ty, w: 4, h: 14, vx: ox * 1.2 })
  }
}

// ============================================================
// 敌机射击
// ============================================================
function enemyShoot(e) {
  if (!e._shootTimer) e._shootTimer = 0
  e._shootTimer += 1 / 60  // 近似 dt，collision loop 里精确更新
}

function enemyShootBurst(e, stats) {
  if (e.type === 'boss') {
    // Boss: 扇形弹幕
    const cx = e.x + e.w / 2
    const cy = e.y + e.h
    const spread = currentLevel >= 3 ? 7 : 5
    const step = 0.35
    for (let i = 0; i < spread; i++) {
      const angle = Math.PI / 2 + (-(spread - 1) / 2 + i) * step
      const spd = 200 + currentLevel * 30
      enemyBullets.push({
        x: cx - 3, y: cy, w: 6, h: 6,
        vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd,
      })
    }
  } else {
    // 普通敌机：向下直射
    enemyBullets.push({
      x: e.x + e.w / 2 - 3, y: e.y + e.h,
      w: 6, h: 6, vx: 0, vy: 220 + currentLevel * 30,
    })
  }
}

// ============================================================
// 炸弹
// ============================================================
function useBomb() {
  if (bombCount <= 0 || bombCooldown > 0) return
  bombCount--
  bombCooldown = 15
  for (const e of enemies) spawnParticles(e.x + e.w / 2, e.y + e.h / 2, '#ffffff', 8)
  enemies = []
  enemyBullets = []
  spawnFloatText('💣 全屏清除!', '#ffffff', 1.2)
}

// ============================================================
// 生成小兵
// ============================================================
function spawnEnemy() {
  // 随机兵种，随等级提高出高级兵概率变大
  const roll = Math.random()
  let type
  if (currentLevel <= 1) {
    type = roll < 0.65 ? 'scout' : roll < 0.95 ? 'fighter' : 'tank'
  } else if (currentLevel <= 3) {
    type = roll < 0.35 ? 'scout' : roll < 0.75 ? 'fighter' : 'tank'
  } else {
    type = roll < 0.2 ? 'scout' : roll < 0.55 ? 'fighter' : 'tank'
  }
  const stats = enemyStats(type, currentLevel)
  enemies.push({
    type,
    x: Math.random() * (W - stats.w),
    y: -stats.h,
    w: stats.w,
    h: stats.h,
    speed: stats.speed,
    hp: stats.hp,
    maxHp: stats.hp,
    score: stats.score,
    color: stats.color,
    cockpitColor: stats.cockpitColor,
    canShoot: stats.canShoot,
    shootInterval: stats.shootInterval || 99,
    _shootTimer: Math.random() * (stats.shootInterval || 2),
  })
}

// ============================================================
// 生成 Boss
// ============================================================
function spawnBoss() {
  // 如果已有 Boss 则不出
  if (enemies.some(e => e.type === 'boss')) return
  const stats = enemyStats('boss', currentLevel)
  enemies.push({
    type: 'boss',
    x: W / 2 - stats.w / 2,
    y: -stats.h,
    w: stats.w,
    h: stats.h,
    speed: stats.speed,
    hp: stats.hp,
    maxHp: stats.hp,
    score: stats.score,
    color: stats.color,
    cockpitColor: stats.cockpitColor,
    canShoot: true,
    shootInterval: stats.shootInterval,
    _shootTimer: 0,
    _phase: 0,         // 0=进场, 1=战斗
    _phaseTime: 0,
    _moveDir: 1,
    _moveSpeed: 100,
  })
  spawnFloatText('⚠ BOSS 来袭!', '#ff1744', 2.5)
}

// ============================================================
// 更新
// ============================================================
function update(dt) {
  if (gameOver) {
    if (keys['Space']) { keys['Space'] = false; reset() }
    return
  }

  const cfg = getCfg()

  // --- 玩家移动 ---
  const spd = cfg.speed
  if (keys['ArrowLeft'] || keys['KeyA'])  player.x -= spd * dt
  if (keys['ArrowRight'] || keys['KeyD']) player.x += spd * dt
  if (keys['ArrowUp'] || keys['KeyW'])    player.y -= spd * dt
  if (keys['ArrowDown'] || keys['KeyS'])  player.y += spd * dt
  player.x = Math.max(0, Math.min(W - player.w, player.x))
  player.y = Math.max(0, Math.min(H - player.h, player.y))

  // --- 射击 ---
  bulletTimer += dt
  if (keys['Space'] && bulletTimer >= cfg.cooldown) {
    bulletTimer = 0
    shoot()
  }

  // --- 炸弹 ---
  if (bombCooldown > 0) bombCooldown -= dt
  if (keys['KeyB']) { keys['KeyB'] = false; useBomb() }

  // --- 护盾 ---
  if (shieldActive) {
    shieldTimer -= dt
    if (shieldTimer <= 0) shieldActive = false
  }

  // --- 玩家子弹移动 ---
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i]
    b.y -= 550 * dt
    b.x += (b.vx || 0) * dt
    if (b.y + b.h < 0 || b.x < -20 || b.x > W + 20) bullets.splice(i, 1)
  }

  // --- 敌弹移动 ---
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    const b = enemyBullets[i]
    b.x += b.vx * dt
    b.y += b.vy * dt
    if (b.y > H + 10 || b.y < -10 || b.x < -10 || b.x > W + 10) enemyBullets.splice(i, 1)
  }

  // --- 生成小兵 ---
  const spawnRate = Math.max(0.3, 0.85 - currentLevel * 0.1)
  spawnTimer += dt
  if (spawnTimer >= spawnRate) {
    spawnTimer = 0
    spawnEnemy()
    if (currentLevel >= 3 && Math.random() < 0.4) spawnEnemy()
    if (currentLevel >= 4 && Math.random() < 0.3) spawnEnemy()
  }

  // --- 生成 Boss ---
  if (score - lastBossScore >= bossSpawnScore) {
    lastBossScore = score
    spawnBoss()
    bossSpawnScore = 350 + currentLevel * 50  // 随等级加宽 Boss 间隔
  }

  // --- 敌机更新：移动 + 射击 ---
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i]

    // Boss 进场/战斗阶段
    if (e.type === 'boss') {
      e._phaseTime += dt
      if (e._phase === 0) {
        // 进场：慢慢飞到 y=60
        e.y += e.speed * dt
        if (e.y >= 60) { e._phase = 1; e.y = 60; e._phaseTime = 0 }
      } else {
        // 战斗：左右横移
        e.x += e._moveDir * e._moveSpeed * dt
        if (e.x <= 0) { e.x = 0; e._moveDir = 1 }
        if (e.x >= W - e.w) { e.x = W - e.w; e._moveDir = -1 }
        // 随机换向
        if (Math.random() < 0.005) e._moveDir *= -1
      }

      // Boss 射击
      if (e._phase === 1) {
        e._shootTimer += dt
        if (e._shootTimer >= e.shootInterval) {
          e._shootTimer = 0
          enemyShootBurst(e, enemyStats('boss', currentLevel))
        }
      }
    } else {
      // 普通敌机
      e.y += e.speed * dt
      // 战斗机轻微蛇形
      if (e.type === 'fighter') e.x += Math.sin(e.y * 0.05 + (e._seed || 0)) * 60 * dt

      // 射击
      if (e.canShoot) {
        e._shootTimer += dt
        if (e._shootTimer >= e.shootInterval) {
          e._shootTimer = 0
          enemyShootBurst(e)
        }
      }
    }

    if (e.y > H + 60) enemies.splice(i, 1)
  }

  // --- 碰撞：玩家子弹 vs 敌机 ---
  for (let i = bullets.length - 1; i >= 0; i--) {
    let hit = false
    for (let j = enemies.length - 1; j >= 0; j--) {
      if (rectsCollide(bullets[i], enemies[j])) {
        bullets.splice(i, 1)
        enemies[j].hp--

        if (enemies[j].hp <= 0) {
          const ex = enemies[j].x + enemies[j].w / 2
          const ey = enemies[j].y + enemies[j].h / 2
          const count = enemies[j].type === 'boss' ? 40 : 12
          spawnParticles(ex, ey, enemies[j].color, count)
          score += enemies[j].score * (currentLevel + 1)
          totalKills++

          // Boss 击杀奖励
          if (enemies[j].type === 'boss') {
            bombCount++
            shieldActive = true
            shieldTimer = 5
            spawnFloatText('🏆 Boss 击杀!  +💣 +🛡', '#ffeb3b', 2.5)
          }
          enemies.splice(j, 1)
        } else {
          // 受伤闪烁粒子
          spawnParticles(enemies[j].x + enemies[j].w / 2, enemies[j].y + enemies[j].h / 2, '#ffffff', 3)
        }
        hit = true
        break
      }
    }
  }

  // --- 碰撞：敌弹 vs 玩家 ---
  if (!shieldActive) {
    for (let j = enemyBullets.length - 1; j >= 0; j--) {
      if (rectsCollide(player, enemyBullets[j])) {
        enemyBullets.splice(j, 1)
        gameOver = true
        spawnParticles(player.x + player.w / 2, player.y + player.h / 2, '#ffffff', 30)
        break
      }
    }
  } else {
    // 护盾挡弹
    for (let j = enemyBullets.length - 1; j >= 0; j--) {
      if (rectsCollide(player, enemyBullets[j])) {
        enemyBullets.splice(j, 1)
        spawnParticles(player.x + player.w / 2, player.y + player.h / 2, '#00e5ff', 6)
      }
    }
  }

  // --- 碰撞：敌机 vs 玩家 ---
  for (let j = enemies.length - 1; j >= 0; j--) {
    if (rectsCollide(player, enemies[j])) {
      if (shieldActive) {
        spawnParticles(enemies[j].x + enemies[j].w / 2, enemies[j].y + enemies[j].h / 2, '#00e5ff', 14)
        enemies[j].hp--
        if (enemies[j].hp <= 0) {
          score += enemies[j].score * (currentLevel + 1)
          totalKills++
          if (enemies[j].type === 'boss') { bombCount++; shieldActive = true; shieldTimer = 5 }
        }
        enemies.splice(j, 1)
        shieldActive = false
        shieldTimer = 0
      } else {
        gameOver = true
        spawnParticles(player.x + player.w / 2, player.y + player.h / 2, '#ffffff', 30)
        break
      }
    }
  }

  // --- 粒子 ---
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]
    p.life -= dt
    if (p.life <= 0) { particles.splice(i, 1); continue }
    p.x += p.vx * dt
    p.y += p.vy * dt
  }

  // --- 飘字 ---
  for (let i = levelUpTexts.length - 1; i >= 0; i--) {
    const t = levelUpTexts[i]
    t.life -= dt
    t.y -= 40 * dt
    if (t.life <= 0) levelUpTexts.splice(i, 1)
  }

  // --- 检查升级 ---
  const newLv = getLevel()
  if (newLv > currentLevel) {
    currentLevel = newLv
    spawnFloatText(`⬆ ${LEVEL_CONFIG[currentLevel].name} 升级!`, LEVEL_CONFIG[currentLevel].playerColor, 2.0)
    bombCount++
    if (currentLevel >= 2) { shieldActive = true; shieldTimer = 4 }
  }
}

// ============================================================
// 绘制
// ============================================================

function drawPlayer() {
  const { x, y, w, h } = player
  const cfg = getCfg()

  // 护盾
  if (shieldActive) {
    const a = 0.3 + Math.sin(Date.now() * 0.01) * 0.2
    ctx.strokeStyle = `rgba(0, 229, 255, ${a})`
    ctx.lineWidth = 3
    ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, w * 0.9, 0, Math.PI * 2); ctx.stroke()
    ctx.lineWidth = 1
  }

  // 机身
  ctx.fillStyle = cfg.playerColor
  ctx.beginPath()
  ctx.moveTo(x + w / 2, y)
  ctx.lineTo(x + w, y + h)
  ctx.lineTo(x + w / 2, y + h * 0.7)
  ctx.lineTo(x, y + h)
  ctx.closePath(); ctx.fill()

  // 机翼
  if (currentLevel >= 1) {
    ctx.fillStyle = cfg.playerColor
    ctx.globalAlpha = 0.7
    ctx.fillRect(x - 6, y + h * 0.5, 8, 14)
    ctx.fillRect(x + w - 2, y + h * 0.5, 8, 14)
    ctx.globalAlpha = 1
  }

  // 引擎火焰
  const flameH = 8 + Math.random() * 6 + currentLevel * 2
  ctx.fillStyle = currentLevel >= 3 ? '#e040fb' : '#ff9800'
  ctx.beginPath()
  ctx.moveTo(x + w * 0.3, y + h * 0.7)
  ctx.lineTo(x + w / 2, y + h + flameH)
  ctx.lineTo(x + w * 0.7, y + h * 0.7)
  ctx.closePath(); ctx.fill()

  if (currentLevel >= 2) {
    for (const side of [1, -1]) {
      const bx = x + w / 2 + side * 14
      ctx.beginPath()
      ctx.moveTo(bx - 6, y + h * 0.75)
      ctx.lineTo(bx, y + h + flameH * 0.65)
      ctx.lineTo(bx + 6, y + h * 0.75)
      ctx.closePath(); ctx.fill()
    }
  }

  // 驾驶舱
  ctx.fillStyle = '#fff'
  ctx.beginPath(); ctx.ellipse(x + w / 2, y + h * 0.35, 5, 8, 0, 0, Math.PI * 2); ctx.fill()
}

function drawBullet(b) {
  const cfg = getCfg()
  ctx.fillStyle = cfg.bulletColor
  ctx.shadowColor = cfg.bulletColor; ctx.shadowBlur = 8
  ctx.fillRect(b.x, b.y, b.w, b.h)
  ctx.shadowBlur = 0
}

function drawEnemyBullet(b) {
  // 敌弹红色圆形
  ctx.fillStyle = '#ff5252'
  ctx.shadowColor = '#ff5252'; ctx.shadowBlur = 6
  ctx.beginPath(); ctx.arc(b.x + b.w / 2, b.y + b.h / 2, b.w / 2, 0, Math.PI * 2); ctx.fill()
  ctx.shadowBlur = 0
}

function drawEnemy(e) {
  const { x, y, w, h } = e

  if (e.type === 'boss') {
    // === Boss 绘制 ===
    // 主体：六边形
    ctx.fillStyle = e.color
    ctx.beginPath()
    const cx = x + w / 2, cy = y + h / 2
    const sides = 6, R = w / 2
    for (let i = 0; i < sides; i++) {
      const a = (Math.PI * 2 / sides) * i - Math.PI / 2
      const sx = cx + R * Math.cos(a), sy = cy + R * Math.sin(a)
      i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy)
    }
    ctx.closePath(); ctx.fill()

    // Boss 眼睛
    ctx.fillStyle = '#fff'
    ctx.beginPath(); ctx.arc(cx - 12, cy - 5, 10, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.arc(cx + 12, cy - 5, 10, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#000'
    ctx.beginPath(); ctx.arc(cx - 10, cy - 4, 5, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.arc(cx + 14, cy - 4, 5, 0, Math.PI * 2); ctx.fill()

    // 炮管
    ctx.fillStyle = '#b71c1c'
    ctx.fillRect(cx - 4, y + h, 8, 14)

    // HP 条
    const barW = w + 20, barH = 8, barX = x - 10, barY = y - 16
    const hpRatio = e.hp / e.maxHp
    ctx.fillStyle = '#333'
    ctx.fillRect(barX, barY, barW, barH)
    ctx.fillStyle = hpRatio > 0.5 ? '#4caf50' : hpRatio > 0.25 ? '#ff9800' : '#f44336'
    ctx.fillRect(barX, barY, barW * hpRatio, barH)
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1
    ctx.strokeRect(barX, barY, barW, barH); ctx.lineWidth = 1

    // Boss 名字
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 10px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(`BOSS  HP:${e.hp}/${e.maxHp}`, cx, barY - 4)
  } else {
    // === 小兵绘制（倒三角） ===
    ctx.fillStyle = e.color
    ctx.beginPath()
    ctx.moveTo(x + w / 2, y + h)
    ctx.lineTo(x + w, y)
    ctx.lineTo(x + w / 2, y + h * 0.3)
    ctx.lineTo(x, y)
    ctx.closePath(); ctx.fill()

    ctx.fillStyle = e.cockpitColor
    ctx.beginPath()
    ctx.ellipse(x + w / 2, y + h * 0.55, w * 0.11, h * 0.15, 0, 0, Math.PI * 2)
    ctx.fill()

    // HP > 1 显示血量
    if (e.maxHp > 1) {
      const barY = y - 8, barX = x, barW = w, barH = 4
      ctx.fillStyle = '#333'
      ctx.fillRect(barX, barY, barW, barH)
      ctx.fillStyle = '#ff9800'
      ctx.fillRect(barX, barY, barW * (e.hp / e.maxHp), barH)
    }
    ctx.textAlign = 'left'
  }
}

function drawHUD() {
  const cfg = getCfg()

  // 左上：分数 + 等级
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 22px monospace'
  ctx.textAlign = 'left'
  ctx.fillText(`分数: ${score}`, 16, 34)

  ctx.fillStyle = cfg.playerColor
  ctx.font = 'bold 14px monospace'
  ctx.fillText(`Lv.${currentLevel + 1} ${cfg.name}  |  击杀: ${totalKills}`, 16, 56)

  // 进度条
  if (currentLevel < LEVEL_CONFIG.length - 1) {
    const next = LEVEL_CONFIG[currentLevel + 1]
    const cur = LEVEL_CONFIG[currentLevel]
    const progress = (score - cur.score) / (next.score - cur.score)
    const barX = 16, barY = 64, barW = 160, barH = 5
    ctx.fillStyle = '#222'
    ctx.fillRect(barX, barY, barW, barH)
    ctx.fillStyle = cfg.playerColor
    ctx.fillRect(barX, barY, barW * Math.min(1, progress), barH)
    ctx.fillStyle = '#555'
    ctx.font = '10px monospace'
    ctx.fillText(`${Math.floor(progress * 100)}% → ${next.name}`, barX, barY + 14)
  } else {
    ctx.fillStyle = '#e040fb'
    ctx.font = '11px monospace'
    ctx.fillText('⭐ 已达最高等级!', 16, 72)
  }

  // 右上：技能状态
  ctx.textAlign = 'right'
  if (shieldActive) {
    ctx.fillStyle = '#00e5ff'
    ctx.font = '13px monospace'
    ctx.fillText(`🛡 ${shieldTimer.toFixed(1)}s`, W - 16, 34)
  }
  const ready = bombCooldown <= 0 && bombCount > 0
  ctx.fillStyle = ready ? '#ffeb3b' : '#555'
  ctx.font = '13px monospace'
  ctx.fillText(bombCooldown > 0 ? `💣 CD ${Math.ceil(bombCooldown)}s` : `💣 ×${bombCount} [B]`, W - 16, 50)

  ctx.fillStyle = '#888'
  ctx.font = '11px monospace'
  ctx.fillText(`${cfg.bullets}发 | ${(1/cfg.cooldown).toFixed(0)}发/s | 速度${cfg.speed}`, W - 16, 66)

  ctx.textAlign = 'left'

  // 底部操作提示
  ctx.fillStyle = '#333'
  ctx.font = '11px monospace'
  ctx.fillText('方向键移动 | 空格射击 | B 炸弹', 16, H - 10)

  // Boss 来袭提示
  if (score - lastBossScore > bossSpawnScore * 0.7 && enemies.every(e => e.type !== 'boss')) {
    const need = bossSpawnScore - (score - lastBossScore)
    ctx.fillStyle = '#ff5252'
    ctx.font = '11px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(`⚠ Boss 还有 ${need} 分到达`, W / 2, 24)
    ctx.textAlign = 'left'
  }
}

function drawGameOver() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.78)'
  ctx.fillRect(0, 0, W, H)

  ctx.fillStyle = '#ff4444'
  ctx.font = 'bold 48px monospace'
  ctx.textAlign = 'center'
  ctx.fillText('游戏结束', W / 2, H / 2 - 55)

  const cfg = getCfg()
  ctx.fillStyle = cfg.playerColor
  ctx.font = '18px monospace'
  ctx.fillText(`最终等级: ${cfg.name} (Lv.${currentLevel + 1})`, W / 2, H / 2 - 15)

  ctx.fillStyle = '#fff'
  ctx.font = 'bold 28px monospace'
  ctx.fillText(`得分: ${score}`, W / 2, H / 2 + 25)

  ctx.fillStyle = '#aaa'
  ctx.font = '14px monospace'
  ctx.fillText(`击杀: ${totalKills} 敌机`, W / 2, H / 2 + 52)

  ctx.fillStyle = '#999'
  ctx.font = '15px monospace'
  ctx.fillText('按空格键重新开始', W / 2, H / 2 + 85)
}

// ============================================================
// 星空
// ============================================================
const stars = Array.from({ length: 80 }, () => ({
  x: Math.random() * W, y: Math.random() * H,
  r: Math.random() < 0.25 ? 1.5 : 0.7,
  speed: 20 + Math.random() * 80,
  alpha: 0.15 + Math.random() * 0.35,
}))

function drawBackground(dt) {
  ctx.fillStyle = '#0a0a1a'
  ctx.fillRect(0, 0, W, H)
  for (const s of stars) {
    s.y += s.speed * dt
    if (s.y > H) { s.y = 0; s.x = Math.random() * W }
    ctx.fillStyle = '#fff'
    ctx.globalAlpha = s.alpha
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill()
  }
  ctx.globalAlpha = 1
}

// ============================================================
// 游戏循环
// ============================================================
let lastTime = 0

function loop(ts) {
  let dt = (ts - lastTime) / 1000
  if (dt > 0.1) dt = 0.016
  lastTime = ts
  update(dt)
  render(dt)
  requestAnimationFrame(loop)
}

function render(dt) {
  drawBackground(dt)

  // 粒子
  for (const p of particles) {
    const a = p.life / p.maxLife
    ctx.fillStyle = p.color
    ctx.globalAlpha = a
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r * a, 0, Math.PI * 2); ctx.fill()
  }
  ctx.globalAlpha = 1

  // 实体
  for (const b of enemyBullets) drawEnemyBullet(b)
  for (const b of bullets) drawBullet(b)
  for (const e of enemies) drawEnemy(e)
  drawPlayer()

  // 飘字
  for (const t of levelUpTexts) {
    const a = t.life / t.maxLife
    ctx.fillStyle = t.color
    ctx.globalAlpha = a
    ctx.font = `bold ${Math.floor(22 * (1 + (1 - a) * 0.5))}px monospace`
    ctx.textAlign = 'center'
    ctx.fillText(t.text, t.x, t.y)
  }
  ctx.globalAlpha = 1

  drawHUD()
  if (gameOver) drawGameOver()
}

requestAnimationFrame(loop)
