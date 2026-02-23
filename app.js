/* Pure frontend tarot draw (3 cards)
   - Shuffle fixes the mapping: each grid position -> a specific card
   - User clicks 3 cards from the shown pile
*/

'use strict';

const shuffleBtn = document.getElementById('shuffleBtn');
const resetBtn = document.getElementById('resetBtn');
const deckGrid = document.getElementById('deckGrid');
const statusText = document.getElementById('statusText');
const drawCount = document.getElementById('drawCount');
const resultPanel = document.getElementById('resultPanel');
const resultCards = document.getElementById('resultCards');
const promptBox = document.getElementById('promptBox');
const copyBtn = document.getElementById('copyBtn');
const copyStatus = document.getElementById('copyStatus');

/** @typedef {{ id: string, nameZh: string, nameEn: string }} TarotCard */
/** @typedef {{ card: TarotCard, isReversed: boolean, rotDeg: number }} DeckSlot */

/** @returns {TarotCard[]} */
function createRiderWaiteDeck() {
  const majors = [
    ['0', '愚者', 'The Fool'],
    ['1', '魔术师', 'The Magician'],
    ['2', '女祭司', 'The High Priestess'],
    ['3', '女皇', 'The Empress'],
    ['4', '皇帝', 'The Emperor'],
    ['5', '教皇', 'The Hierophant'],
    ['6', '恋人', 'The Lovers'],
    ['7', '战车', 'The Chariot'],
    ['8', '力量', 'Strength'],
    ['9', '隐者', 'The Hermit'],
    ['10', '命运之轮', 'Wheel of Fortune'],
    ['11', '正义', 'Justice'],
    ['12', '倒吊人', 'The Hanged Man'],
    ['13', '死神', 'Death'],
    ['14', '节制', 'Temperance'],
    ['15', '恶魔', 'The Devil'],
    ['16', '高塔', 'The Tower'],
    ['17', '星星', 'The Star'],
    ['18', '月亮', 'The Moon'],
    ['19', '太阳', 'The Sun'],
    ['20', '审判', 'Judgement'],
    ['21', '世界', 'The World'],
  ].map(([n, zh, en]) => ({ id: `MAJOR_${n}`, nameZh: zh, nameEn: en }));

  const suits = [
    { key: 'WANDS', zh: '权杖', en: 'Wands' },
    { key: 'CUPS', zh: '圣杯', en: 'Cups' },
    { key: 'SWORDS', zh: '宝剑', en: 'Swords' },
    { key: 'PENTACLES', zh: '钱币', en: 'Pentacles' },
  ];

  const ranks = [
    { key: 'ACE', zh: '王牌', en: 'Ace' },
    { key: 'TWO', zh: '二', en: 'Two' },
    { key: 'THREE', zh: '三', en: 'Three' },
    { key: 'FOUR', zh: '四', en: 'Four' },
    { key: 'FIVE', zh: '五', en: 'Five' },
    { key: 'SIX', zh: '六', en: 'Six' },
    { key: 'SEVEN', zh: '七', en: 'Seven' },
    { key: 'EIGHT', zh: '八', en: 'Eight' },
    { key: 'NINE', zh: '九', en: 'Nine' },
    { key: 'TEN', zh: '十', en: 'Ten' },
    { key: 'PAGE', zh: '侍从', en: 'Page' },
    { key: 'KNIGHT', zh: '骑士', en: 'Knight' },
    { key: 'QUEEN', zh: '王后', en: 'Queen' },
    { key: 'KING', zh: '国王', en: 'King' },
  ];

  /** @type {TarotCard[]} */
  const minors = [];
  for (const suit of suits) {
    for (const rank of ranks) {
      minors.push({
        id: `${suit.key}_${rank.key}`,
        nameZh: `${suit.zh}${rank.zh}`,
        nameEn: `${rank.en} of ${suit.en}`,
      });
    }
  }

  return [...majors, ...minors];
}

/** @template T
 * @param {T[]} arr
 * @returns {T[]}
 */
function fisherYatesShuffle(arr) {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** @param {TarotCard[]} picked */
/** @param {DeckSlot[]} pickedSlots */
function buildPrompt(pickedSlots) {
  const lines = pickedSlots.map((s, i) => {
    const orient = s.isReversed ? '逆位' : '正位';
    return `${i + 1}. ${s.card.nameZh}（${s.card.nameEn}）- ${orient}`;
  });

  return [
    '你是一位专业塔罗占卜师。请你根据我抽到的三张塔罗牌（包含正位/逆位），为我做一次清晰、结构化、可执行建议导向的解读。',
    '',
    '抽到的三张牌（按抽牌顺序）：',
    ...lines,
    '',
    '请输出：',
    '1) 三张牌的综合主题',
    '2) 每张牌在此问题中的含义（分别说明）',
    '3) 可能的盲点/需要注意的地方',
    '4) 未来 7-30 天可执行的行动建议（尽量具体）',
  ].join('\n');
}

/** State */
let deckSlots = /** @type {DeckSlot[] | null} */ (null);
let pickedIndexes = /** @type {number[]} */ ([]);

function setStatus(text) {
  statusText.textContent = text;
}

function updateCounts() {
  drawCount.textContent = String(pickedIndexes.length);
}

function clearCopyStatus() {
  copyStatus.textContent = '';
}

function renderDeckGrid() {
  deckGrid.innerHTML = '';

  if (!deckSlots) {
    deckGrid.setAttribute('aria-disabled', 'true');
    return;
  }

  deckGrid.setAttribute('aria-disabled', 'false');

  for (let i = 0; i < deckSlots.length; i++) {
    const slot = deckSlots[i];
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'card';
    btn.setAttribute('role', 'listitem');
    btn.setAttribute('aria-label', `牌堆位置 ${i + 1}`);
    btn.dataset.index = String(i);
    btn.style.setProperty('--rot', `${slot.rotDeg}deg`);

    if (pickedIndexes.includes(i)) {
      btn.classList.add('selected');
    }

    if (pickedIndexes.length >= 3 && !pickedIndexes.includes(i)) {
      btn.classList.add('disabled');
      btn.disabled = true;
    }

    btn.addEventListener('click', onPickCard);
    deckGrid.appendChild(btn);
  }
}

function renderResults() {
  resultCards.innerHTML = '';

  if (!deckSlots || pickedIndexes.length !== 3) {
    resultPanel.hidden = true;
    copyBtn.disabled = true;
    promptBox.value = '';
    return;
  }

  resultPanel.hidden = false;

  const picked = pickedIndexes.map((i) => deckSlots[i]);
  picked.forEach((slot, idx) => {
    const el = document.createElement('div');
    el.className = 'resultCard';

    const n = document.createElement('div');
    n.className = 'n';
    n.textContent = `第 ${idx + 1} 张`;

    const t = document.createElement('div');
    t.className = 't';
    t.textContent = `${slot.card.nameZh}（${slot.card.nameEn}）`;

    const badge = document.createElement('div');
    badge.className = 'badge';
    badge.textContent = slot.isReversed ? '逆位' : '正位';

    el.appendChild(n);
    el.appendChild(t);
    el.appendChild(badge);
    resultCards.appendChild(el);
  });

  promptBox.value = buildPrompt(picked);
  copyBtn.disabled = false;
}

function setStartedState() {
  shuffleBtn.disabled = true;
  resetBtn.disabled = false;
}

function setIdleState() {
  shuffleBtn.disabled = false;
  resetBtn.disabled = true;
}

function resetAll() {
  deckSlots = null;
  pickedIndexes = [];
  setIdleState();
  setStatus('尚未洗牌');
  updateCounts();
  renderDeckGrid();
  renderResults();
  clearCopyStatus();
}

function shuffleAndStart() {
  const deck = createRiderWaiteDeck();
  deckSlots = fisherYatesShuffle(deck).map((card) => ({
    card,
    isReversed: Math.random() < 0.5,
    rotDeg: (Math.random() * 6) - 3,
  }));
  pickedIndexes = [];

  setStartedState();
  setStatus('已洗牌：抽三张（含正/逆位）');
  updateCounts();
  renderDeckGrid();
  renderResults();
  clearCopyStatus();
}

/** @param {MouseEvent} e */
function onPickCard(e) {
  if (!deckSlots) return;

  const target = /** @type {HTMLElement} */ (e.currentTarget);
  const indexStr = target.dataset.index;
  const index = Number(indexStr);
  if (!Number.isFinite(index)) return;

  if (pickedIndexes.includes(index)) return;
  if (pickedIndexes.length >= 3) return;

  pickedIndexes = [...pickedIndexes, index];

  updateCounts();
  renderDeckGrid();

  if (pickedIndexes.length === 3) {
    setStatus('已抽满三张：请查看出牌结果');
  } else {
    setStatus('继续抽牌');
  }

  renderResults();
  clearCopyStatus();
}

async function copyPromptToClipboard() {
  clearCopyStatus();
  const text = promptBox.value;
  if (!text) return;

  try {
    await navigator.clipboard.writeText(text);
    copyStatus.textContent = '已复制到剪贴板。';
  } catch {
    // Fallback for some browsers when opened as file://
    promptBox.focus();
    promptBox.select();
    const ok = document.execCommand('copy');
    copyStatus.textContent = ok ? '已复制到剪贴板。' : '复制失败：请手动全选并复制。';
  }
}

shuffleBtn.addEventListener('click', shuffleAndStart);
resetBtn.addEventListener('click', resetAll);
copyBtn.addEventListener('click', copyPromptToClipboard);

resetAll();
