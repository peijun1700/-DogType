const DEMO_TEXT = `2026/04/10（五）
09:10\t阿晨\t早安 你今天比較早起？
09:14\t小璃\t嗯 今天要開會
09:16\t阿晨\t加油 你昨天不是說會很累
12:42\t阿晨\t午餐記得吃
14:08\t小璃\t剛忙完哈哈
14:10\t小璃\t你咧
14:12\t阿晨\t我剛開完會 看到你有回就安心了
14:30\t阿晨\t你晚上還有空嗎
20:55\t小璃\t今天可能不行欸
20:56\t阿晨\t好 那你忙完再跟我說
2026/04/11（六）
00:20\t阿晨\t到家了嗎
08:35\t阿晨\t早安
13:50\t小璃\t昨天睡著了
13:51\t小璃\t抱歉
13:56\t阿晨\t沒事啦 你有休息到就好
22:04\t阿晨\t晚安
2026/04/12（日）
11:02\t阿晨\t你昨天那個專案還好嗎
11:07\t小璃\t還行
11:08\t阿晨\t那就好
18:40\t阿晨\t你晚點想不想吃飯
23:55\t阿晨\t如果太忙也沒關係`;

// --- 分析引擎核心常數 ---
const BLOCK_MERGE_WINDOW_MINUTES = 30; // 合併同一發言者的視窗長度（原 60，調至 30 以更精準捕捉反應）
const MAX_RESPONSE_GAP_MINUTES = 14 * 24 * 60; // 最大追蹤反應時間（14天）

// 離峰時間 (Quiet Hours) 加權
const QUIET_HOUR_START = 2; // 凌晨 2 點
const QUIET_HOUR_END = 8; // 早上 8 點
const QUIET_HOUR_BASELINE_MULTIPLIER = 1.3; // 離峰時間的基礎延遲容忍加成

// 異常死寂 (Abnormal Silence) 判定
const ABNORMAL_SILENCE_CHAT_RATIO = 0.2; // 結尾死寂佔總時長比例
const ABNORMAL_SILENCE_BASELINE_MULTIPLIER = 8; // 結尾死寂為平均延遲的倍率
const ABNORMAL_SILENCE_MIN_MINUTES = 120; // 結尾死寂最少須達到的分鐘數

// 延遲計分閥值
const LATENCY_DECAY_THRESHOLD = 3.0; // 相對延遲超過此倍率後分數開始顯著衰減

// 懲罰權重：Ghosting (尾段未回)
const GHOSTING_LIGHT_MULTIPLIER = 3;
const GHOSTING_HEAVY_MULTIPLIER = 12;
const GHOSTING_SEVERE_MULTIPLIER = 18; // 保持語義上的 Raw 極大值，最終由 Math.min(..., 14) 進行封蓋裁切

const GHOSTING_LIGHT_MINUTES = 12 * 60; // 12 小時
const GHOSTING_HEAVY_MINUTES = 24 * 60; // 24 小時

// 懲罰權重：Double Ping (追訊)
const DOUBLE_PING_SHORT_GAP = 30; // 短時間追訊 (30 min)
const DOUBLE_PING_MEDIUM_GAP = 120; // 中等時間追訊 (120 min)




const DOG_CHARACTER_META = {
  邊境牧羊犬型: {
    code: "SYNC",
    title: "雙向同步的訊號犬",
    accent: "#7bbf9e",
    ear: "#f7f4ee",
    body: "#f6f2eb",
    patch: "#2f3538",
    accessory: "sync-ring",
    tagline: "你不是舔狗，你是穩定雙向連線。",
  },
  黃金獵犬型: {
    code: "MELLOW",
    title: "溫柔偏心的陪伴犬",
    accent: "#d3a85d",
    ear: "#f0d5a7",
    body: "#f5e6ca",
    patch: "#d7b57d",
    accessory: "heart-lamp",
    tagline: "你給的關心太滿，常常先把對方照顧好。",
  },
  貴賓狗型: {
    code: "POLI",
    title: "精心打理的門面犬",
    accent: "#c89f83",
    ear: "#f1e5dc",
    body: "#f4ece6",
    patch: "#d6c0ae",
    accessory: "badge",
    tagline: "你連喜歡都整理過，看起來體面又用心。",
  },
  柴犬型: {
    code: "LAGI",
    title: "延遲回應的傲嬌犬",
    accent: "#c98052",
    ear: "#f1d0b6",
    body: "#f3dfcf",
    patch: "#d28c63",
    accessory: "delay-bar",
    tagline: "你有回，但永遠不是第一時間。",
  },
  流浪狗型: {
    code: "STRAY",
    title: "高頻重試的追訊犬",
    accent: "#d47a69",
    ear: "#9a8b78",
    body: "#c4b5a3",
    patch: "#8c7b64",
    accessory: "notif-ring",
    tagline: "你還在等回覆，系統已經提示重試過多。",
  },
  警犬型: {
    code: "WATCH",
    title: "即時監控的高警覺犬",
    accent: "#d2a64e",
    ear: "#efe3ca",
    body: "#f3eee3",
    patch: "#7f6d54",
    accessory: "shield-tag",
    tagline: "你不是秒回，你是全天候待命。",
  },
  殭屍狗型: {
    code: "NULL",
    title: "離線待命的斷線犬",
    accent: "#a9adb5",
    ear: "#ebe8e4",
    body: "#f3f1ee",
    patch: "#c9c4bf",
    accessory: "dead-signal",
    tagline: "連線已終止，但你的心跳包還在送。",
  },
  哈士奇型: {
    code: "CHAOS",
    title: "精力過剩的混亂犬",
    accent: "#5eb5e0",
    ear: "#f1f6f9",
    body: "#f7fafc",
    patch: "#4a5568",
    accessory: "chaos-spark",
    tagline: "你的回覆快到燒焦，卻也混亂到讓系統當機。",
  },
  吉娃娃型: {
    code: "YAPPI",
    title: "高頻震動的極焦慮犬",
    accent: "#e5a16d",
    ear: "#fff5eb",
    body: "#fff9f2",
    patch: "#8c6239",
    accessory: "anxiety-wave",
    tagline: "你不斷發出的短促訊號，其實都是在尖叫。",
  },
  高冷黑貓型: {
    code: "NEKO",
    title: "優雅高冷的黑貓",
    accent: "#1a1c1e",
    ear: "#2d3436",
    body: "#3d3d3d",
    patch: "#121212",
    accessory: "cat-ears",
    tagline: "你優雅地維持著距離，對方的熱情只是背景音。",
  },
  佛系和尚狗型: {
    code: "ZEN",
    title: "心如止水的修行犬",
    accent: "#8e735b",
    ear: "#e8d1a4",
    body: "#fcfaf2",
    patch: "#d1a25c",
    accessory: "lotus",
    tagline: "你情緒穩定如磐石，對方的起伏完全無法動搖你。",
  },
  狼系主宰型: {
    code: "ALPHA",
    title: "引領群落的阿爾法狼",
    accent: "#2d3436",
    ear: "#636e72",
    body: "#dfe6e9",
    patch: "#2d3436",
    accessory: "moon-crescent",
    tagline: "你掌握著絕對話語權，對方的節奏由你引導。",
  },

  哈比小狗型: {
    code: 'PUPPY',
    title: '撒嬌軟萌的哈比狗',
    accent: '#f3a683',
    ear: '#fce5cd',
    body: '#fff2df',
    patch: '#e67e22',
    accessory: 'bone-toy',
    tagline: '你用最純粹的熱情，換取對方最微小的摸摸。'
  },
};

const appState = {
  file: null,
  rawText: "",
  parsedMessages: [], // 儲存拓補處理後的穩定訊息
  activeSpeakers: [],  // 儲存最終選定的二人名單
  lastResult: null,
  subjectSpeaker: null,
  isDemoMode: false,
};


const ui = {
  fileInput: document.getElementById('fileInput'),
  analyzeButton: document.getElementById('analyzeButton'),
  statusBox: document.getElementById('statusBox'),
  loadingState: document.getElementById('loadingState'),
  emptyState: document.getElementById('emptyState'),
  resultState: document.getElementById('resultState'),
  syncBadge: document.getElementById('syncBadge'),
  dogType: document.getElementById('dogType'),
  relationshipModel: document.getElementById('relationshipModel'),
  verdict: document.getElementById('verdict'),
  latencyMetric: document.getElementById('latencyMetric'),
  payloadMetric: document.getElementById('payloadMetric'),
  jitterMetric: document.getElementById('jitterMetric'),
  penaltyMetric: document.getElementById('penaltyMetric'),
  participantsLabel: document.getElementById('participantsLabel'),
  stabilityLabel: document.getElementById('stabilityLabel'),
  confidenceLabel: document.getElementById('confidenceLabel'),
  driversLabel: document.getElementById('driversLabel'),
  jsonOutput: document.getElementById('jsonOutput'),
  mermaidOutput: document.getElementById('mermaidOutput'),
  downloadButton: document.getElementById('downloadButton'),
  shareButton: document.getElementById('shareButton'),
  storyPreview: document.getElementById('storyPreview'),
  exportCanvas: document.getElementById('exportCanvas'),
  identityPicker: document.getElementById('identityPicker'),
  speakerButtons: document.getElementById('speakerButtons'),
  showGuideBtn: document.getElementById('showGuideBtn'),
  guideModal: document.getElementById('guideModal'),
  closeGuideBtn: document.getElementById('closeGuideBtn'),
};

let appInitialized = false;

function initApp() {
  if (appInitialized) return;
  appInitialized = true;
  ui.fileInput = document.getElementById('fileInput');
  ui.analyzeButton = document.getElementById('analyzeButton');
  ui.statusBox = document.getElementById('statusBox');
  ui.loadingState = document.getElementById('loadingState');
  ui.emptyState = document.getElementById('emptyState');
  ui.resultState = document.getElementById('resultState');
  ui.syncBadge = document.getElementById('syncBadge');
  ui.dogType = document.getElementById('dogType');
  ui.relationshipModel = document.getElementById('relationshipModel');
  ui.verdict = document.getElementById('verdict');
  ui.latencyMetric = document.getElementById('latencyMetric');
  ui.payloadMetric = document.getElementById('payloadMetric');
  ui.jitterMetric = document.getElementById('jitterMetric');
  ui.penaltyMetric = document.getElementById('penaltyMetric');
  ui.participantsLabel = document.getElementById('participantsLabel');
  ui.stabilityLabel = document.getElementById('stabilityLabel');
  ui.confidenceLabel = document.getElementById('confidenceLabel');
  ui.driversLabel = document.getElementById('driversLabel');
  ui.jsonOutput = document.getElementById('jsonOutput');
  ui.mermaidOutput = document.getElementById('mermaidOutput');
  ui.downloadButton = document.getElementById('downloadButton');
  ui.shareButton = document.getElementById('shareButton');
  ui.storyPreview = document.getElementById('storyPreview');
  ui.exportCanvas = document.getElementById('exportCanvas');
  ui.identityPicker = document.getElementById('identityPicker');
  ui.speakerButtons = document.getElementById('speakerButtons');
  ui.showGuideBtn = document.getElementById('showGuideBtn');
  ui.guideModal = document.getElementById('guideModal');
  ui.closeGuideBtn = document.getElementById('closeGuideBtn');

  if (ui.fileInput) {
    ui.fileInput.addEventListener("change", handleFileSelect);
  }
  if (ui.analyzeButton) {
    ui.analyzeButton.addEventListener("click", () => startV3AnalysisFlow());
  }
  if (ui.downloadButton) {
    ui.downloadButton.addEventListener("click", downloadStoryCard);
  }
  if (ui.shareButton) {
    ui.shareButton.addEventListener("click", shareStoryCard);
  }

  // --- 匯出指南事件監聽 ---
  if (ui.showGuideBtn && ui.guideModal) {
    ui.showGuideBtn.addEventListener("click", (e) => {
      e.preventDefault();
      ui.guideModal.classList.remove("hidden");
      ui.guideModal.setAttribute("aria-hidden", "false");
    });
  }

  if (ui.closeGuideBtn && ui.guideModal) {
    ui.closeGuideBtn.addEventListener("click", () => {
      ui.guideModal.classList.add("hidden");
      ui.guideModal.setAttribute("aria-hidden", "true");
    });
  }

  // 點擊背景關閉
  if (ui.guideModal) {
    ui.guideModal.addEventListener("click", (e) => {
      if (e.target === ui.guideModal) {
        ui.guideModal.classList.add("hidden");
        ui.guideModal.setAttribute("aria-hidden", "true");
      }
    });
  }
}



function handleFileSelect(event) {
  const [file] = event.target.files || [];
  appState.file = file || null;
  appState.isDemoMode = false; // 只要手動選檔，立即重設 Demo 狀態
  ui.analyzeButton.disabled = !file;

  ui.statusBox.textContent = file
    ? `已載入 ${file.name}。準備進行本機解析。`
    : "系統待命中。請投餵聊天紀錄。";
}


async function startV3AnalysisFlow() {
  try {
    ui.statusBox.textContent = "解析檔案結構中...";
    const rawText = appState.file
      ? await appState.file.text()
      : appState.rawText;

    // --- 模式判定：若無檔案且資料為空或符合 DEMO_TEXT，則啟動 Demo 狀態 ---
    if (!appState.file && (!rawText || rawText === DEMO_TEXT)) {
      ui.statusBox.textContent = "未偵測到聊天紀錄檔，已自動進入 DEMO 模式進行演示。";
      console.warn("未偵測到聊天紀錄檔案，自動啟用 DEMO 模式進行演示。");

      appState.rawText = DEMO_TEXT;
      appState.isDemoMode = true;
    } else {
      appState.rawText = rawText;
      appState.isDemoMode = false;
    }

    const parsedMessages = parseLineChat(appState.rawText);

    const {
      speakers,
      messages: filteredMessages,
      counts,
      allSpeakers
    } = selectTopTwoSpeakers(parsedMessages);

    // 將整理後的數據存入全域狀態，供後續分析階段直接調用 (V2.2 核心更新：鎖定一致性)
    appState.activeSpeakers = speakers;
    appState.parsedMessages = filteredMessages;

    if (allSpeakers.length > 2) {
      console.warn("偵測到多個名字版本或雜訊，系統已自動選取主要二位：", speakers, counts);
    }

    ui.identityPicker.classList.remove("hidden");
    ui.speakerButtons.innerHTML = "";
    speakers.forEach(name => {
      const btn = document.createElement("button");
      btn.className = "speaker-btn";
      btn.textContent = name;
      btn.onclick = () => runAnalysis(name);
      ui.speakerButtons.appendChild(btn);
    });

    ui.statusBox.textContent = appState.isDemoMode
      ? "DEMO 模式載入成功！請點擊您的暱稱以開始判定。"
      : "檔案解析成功！請點擊您的暱稱以開始鑑定。";

    ui.emptyState.innerHTML = `<p>已讀取到 <strong>${speakers.join(" & ")}</strong> 的回憶。<br>請在上方點擊您的名字，系統將以您的視角進行鑑定。</p>`;

  } catch (error) {
    ui.statusBox.textContent = `解析失敗：${error.message}`;
  }
}

async function runAnalysis(subjectName) {
  try {
    appState.subjectSpeaker = subjectName;
    ui.identityPicker.classList.add("hidden");
    ui.loadingState.classList.remove("hidden");
    ui.emptyState.classList.add("hidden");
    ui.resultState.classList.add("hidden");
    ui.statusBox.textContent = `正在以 ${subjectName} 的視角進行量化掃描...`;

    await fakeComputeDelay();

    // 直接使用預先處理好的合併訊息，避免重複解析導致的名字不一致問題
    const messages = appState.parsedMessages;
    const result = analyzeMessages(messages, subjectName);
    appState.lastResult = result;

    renderResult(result);
    ui.statusBox.textContent = "分析完成。您現在可以下載或分享限動圖。";
  } catch (error) {
    ui.statusBox.textContent = `分析失敗：${error.message}`;
  } finally {
    ui.loadingState.classList.add("hidden");
  }
}

function fakeComputeDelay() {
  return new Promise((resolve) => {
    window.setTimeout(resolve, 1400);
  });
}

function parseLineChat(rawText) {
  const rows = rawText
    .replace(/^\uFEFF/, "")
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const messages = [];
  let currentDate = null;
  let currentMessage = null;

  for (const row of rows) {
    // 1) 日期列：2026/04/10（五） or 2026-04-10
    const dateMatch = row.match(/^(\d{4}[\/.-]\d{1,2}[\/.-]\d{1,2})/);

    // 2) 完整日期 + 時間 + 名字 + 內容
    const bracketMatch = row.match(
      /^\[?(\d{4}[\/.-]\d{1,2}[\/.-]\d{1,2})\s+((?:上午|下午)?\s*\d{1,2}:\d{2})\]?\s+([^:：\t]+)[:：]\s*(.+)$/
    );

    const inlineMatch = row.match(
      /^(\d{4}[\/.-]\d{1,2}[\/.-]\d{1,2})\s+((?:上午|下午)?\s*\d{1,2}:\d{2})\s+([^:：]+)[:：]\s*(.+)$/
    );

    // 3) 你原本主吃的格式：時間 tab 名字 tab 內容
    const tabbedMatch = row.match(
      /^((?:上午|下午)?\s*\d{1,2}:\d{2})(?:\s+|\t+)([^:\t]+?)(?:\s*[:：]|\t)(.+)$/
    );

    // 4) 寬鬆格式：時間 + 名字 + 內容（不靠 tab）
    // 例如：09:10 阿晨 早安
    // 或：下午 8:34 小璃 好
    const looseLineMatch = row.match(
      /^((?:上午|下午)?\s*\d{1,2}:\d{2})\s+([^\s:：]+)\s+(.+)$/
    );

    if (bracketMatch) {
      currentDate = bracketMatch[1];
      const message = buildMessage(
        currentDate,
        bracketMatch[2],
        bracketMatch[3],
        bracketMatch[4]
      );
      messages.push(message);
      currentMessage = message;
      continue;
    }

    if (inlineMatch) {
      currentDate = inlineMatch[1];
      const message = buildMessage(
        currentDate,
        inlineMatch[2],
        inlineMatch[3],
        inlineMatch[4]
      );
      messages.push(message);
      currentMessage = message;
      continue;
    }

    // 只要像日期列就先收日期，不再限制長度
    if (dateMatch && !tabbedMatch && !bracketMatch && !inlineMatch) {
      currentDate = dateMatch[1];
      continue;
    }

    if (tabbedMatch && currentDate) {
      const message = buildMessage(
        currentDate,
        tabbedMatch[1],
        tabbedMatch[2],
        tabbedMatch[3]
      );
      messages.push(message);
      currentMessage = message;
      continue;
    }

    if (looseLineMatch && currentDate) {
      const speaker = looseLineMatch[2].trim();
      const content = looseLineMatch[3].trim();

      // 避免整句被誤抓成名字 (由 30 縮減至 20)
      if (speaker.length <= 20 && content.length > 0) {
        // 額外保險：避免寬鬆匹配誤吃系統資訊
        if (!/^(通話時間|收回了訊息|加入|離開|已取消|已讀)$/.test(content)) {
          const message = buildMessage(
            currentDate,
            looseLineMatch[1],
            speaker,
            content
          );
          messages.push(message);
          currentMessage = message;
          continue;
        }
      }
    }

    // 其餘情況當續行
    if (currentMessage) {
      currentMessage.content += ` ${row}`;
      currentMessage.wordCount = countWords(currentMessage.content);
    }
  }

  const parsedMessages = messages.filter(
    (message) => !isSystemMessage(message.content)
  );

  if (parsedMessages.length < 2) {
    console.warn("parse failed preview rows:", rows.slice(0, 20));
    console.warn("raw parsed messages:", messages.slice(0, 10));
    throw new Error(
      `可解析訊息過少（目前只抓到 ${parsedMessages.length} 筆），請確認是 LINE 匯出的 .txt。`
    );
  }

  return parsedMessages;
}

function buildMessage(dateText, timeText, speaker, content) {
  const isoDate = normalizeDate(dateText);
  const normalizedTime = normalizeLineTime(timeText);
  const timestamp = new Date(`${isoDate}T${normalizedTime}:00`);

  return {
    dateText: isoDate,
    timeText: normalizedTime,
    speaker: speaker.trim(),
    content: content.trim(),
    timestamp,
    wordCount: countWords(content),
  };
}

// --- 【V2.2 安全補丁：說話者識別優化】 ---

function normalizeSpeakerName(name) {
  return String(name || "")
    .replace(/^\uFEFF/, "")
    .trim()
    .replace(/\s+/g, " ")          // 多空白壓成一格
    .replace(/[＿_]+/g, "_")       // 全半形底線統一
    .replace(/[－—–-]+/g, "-")     // 各種連字號統一
    .toLowerCase();
}

function buildSpeakerCounts(messages) {
  const counts = {};
  for (const m of messages) {
    const key = normalizeSpeakerName(m.speaker);
    if (!key) continue;
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

function shouldMergeSpeaker(longName, shortName, longCount, shortCount) {
  if (!longName || !shortName) return false;
  if (longName === shortName) return false;

  // 只允許「短名字被完整包含在長名字中」
  if (!longName.includes(shortName)) return false;

  // 太短不合，避免「陳」「王」「林」這種誤吞
  if (shortName.length < 3) return false;

  // 短名必須真的很少，才像 parser 殘影
  if (shortCount > 3) return false;

  // 長名也要夠多，才值得吞
  if (longCount < 8) return false;

  // 比例必須很懸殊
  if (shortCount > longCount * 0.15) return false;

  // 長短差至少 2 字元，避免相近但不同人名誤吞
  if ((longName.length - shortName.length) < 2) return false;

  return true;
}

function consolidateSpeakers(messages) {
  const counts = buildSpeakerCounts(messages);
  const names = Object.keys(counts).sort((a, b) => b.length - a.length);

  const aliasMap = {};
  for (const name of names) aliasMap[name] = name;

  for (let i = 0; i < names.length; i++) {
    const longName = names[i];
    if (!counts[longName]) continue;

    for (let j = i + 1; j < names.length; j++) {
      const shortName = names[j];
      if (!counts[shortName]) continue;

      if (shouldMergeSpeaker(longName, shortName, counts[longName], counts[shortName])) {
        counts[longName] += counts[shortName];
        delete counts[shortName];
        aliasMap[shortName] = longName;
      }
    }
  }

  const normalizedMessages = messages.map(msg => {
    const raw = normalizeSpeakerName(msg.speaker);
    const merged = aliasMap[raw] || raw;
    return {
      ...msg,
      speaker: merged,
    };
  });

  const finalCounts = {};
  for (const msg of normalizedMessages) {
    finalCounts[msg.speaker] = (finalCounts[msg.speaker] || 0) + 1;
  }

  return {
    messages: normalizedMessages,
    counts: finalCounts,
  };
}

function selectTopTwoSpeakers(messages) {
  const { messages: normalizedMessages, counts } = consolidateSpeakers(messages);

  const sorted = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);

  if (sorted.length < 2) {
    throw new Error(`分析失敗：僅辨識到一位說話者 (${sorted[0] || "無"})。請確認檔案格式或視角是否正確。`);
  }

  const topTwo = sorted.slice(0, 2);
  const filteredMessages = normalizedMessages.filter(m => topTwo.includes(m.speaker));

  return {
    speakers: topTwo,
    messages: filteredMessages,
    counts,
    allSpeakers: sorted,
  };
}

function normalizeDate(dateText) {
  const [year, month, day] = dateText.replace(/[./]/g, "-").split("-");
  return [year, month.padStart(2, "0"), day.padStart(2, "0")].join("-");
}

function normalizeLineTime(timeText) {
  const raw = String(timeText).trim();
  // 處理可能的「下午12:03」(無空格) 情況
  const cleanRaw = raw.replace(/\s+/g, "");

  // 下午 8:34 / 上午 9:05 / 中午 / 凌晨
  const zhMeridiemMatch = cleanRaw.match(/^(上午|下午|中午|凌晨)(\d{1,2}):(\d{2})$/);
  if (zhMeridiemMatch) {
    const meridiem = zhMeridiemMatch[1];
    let hour = Number(zhMeridiemMatch[2]);
    const minute = zhMeridiemMatch[3];

    if (meridiem === "上午" || meridiem === "凌晨") {
      if (hour === 12) hour = 0;
    } else if (meridiem === "下午" || meridiem === "中午") {
      if (hour !== 12) hour += 12;
    }

    return `${String(hour).padStart(2, "0")}:${minute}`;
  }

  // AM 8:34 / PM 8:34
  const enMeridiemMatch = cleanRaw.match(/^(AM|PM|am|pm)(\d{1,2}):(\d{2})$/);
  if (enMeridiemMatch) {
    const meridiem = enMeridiemMatch[1].toLowerCase();
    let hour = Number(enMeridiemMatch[2]);
    const minute = enMeridiemMatch[3];

    if (meridiem === "am") {
      if (hour === 12) hour = 0;
    } else if (meridiem === "pm") {
      if (hour !== 12) hour += 12;
    }

    return `${String(hour).padStart(2, "0")}:${minute}`;
  }

  // 純 8:34 / 08:34
  const plainMatch = cleanRaw.match(/^(\d{1,2}):(\d{2})$/);
  if (plainMatch) {
    return `${plainMatch[1].padStart(2, "0")}:${plainMatch[2]}`;
  }

  return "00:00";
}

function countWords(content) {
  const mediaMatches = content.match(/\[照片\]|\[影片\]|\[語音\]|\[貼圖\]/g) || [];
  const mediaWeight = mediaMatches.length * 15;

  const textContent = content.replace(/\[照片\]|\[影片\]|\[語音\]|\[貼圖\]/g, "").replace(/\s+/g, " ").trim();
  const tokens = textContent.match(/[\u4e00-\u9fff]|[A-Za-z0-9_]+/g);
  let textWeight = tokens ? tokens.length : (textContent.length > 0 ? 1 : 0);

  // 【惡魔修復：反字數溢出】
  // 對於超過 100 字的長文，採用對數成長。
  // 這確保了「100 字」與「1000 字」都代表了「極高投入」，
  // 但後者不會因為字數過多而讓前者顯得像「敷衍」(離群值保護)。
  if (textWeight > 100) {
    textWeight = 100 + Math.log10(textWeight - 99) * 20;
  }

  return Math.max(1, textWeight + mediaWeight);
}

function isSystemMessage(content) {
  const trimmed = content.trim();
  return /^(收回了訊息|通話時間|加入了群組|離開了群組|已取消)$/.test(trimmed) ||
    /^\[(貼圖|照片|圖片|影片|語音訊息?|位置資訊)\]$/.test(trimmed);
}

function analyzeMessages(messages, subjectName = null) {
  const speakers = [...new Set(messages.map((message) => message.speaker))];
  if (speakers.length !== 2) {
    throw new Error("目前 MVP 僅支援兩人對話分析。");
  }

  // 如果指定了視角主體，將其設為 speakerA (主角)
  let speakerA, speakerB;
  if (subjectName && speakers.includes(subjectName)) {
    speakerA = subjectName;
    speakerB = speakers.find(s => s !== subjectName);
  } else {
    [speakerA, speakerB] = speakers;
  }

  const responsePairs = buildResponsePairs(messages, speakerA, speakerB);

  // 【致命破口一：已修復】處理完全無回覆的斷線狀況
  if (!responsePairs.length) {
    return buildFallbackZombieResult([speakerA, speakerB], messages.length);
  }

  const responseTimes = responsePairs.map((pair) => pair.responseMinutes);
  const baselineMrt = median(responseTimes);

  // --- 【終極防禦：自適應死寂注入】 ---
  // 不再使用死板的 48h 門檻，改用「相對時間比」。
  // 如果對話結束後的死寂時間 > 對話總時長的 20%，或者 > 平均延遲的 10 倍，即視為異常結束（斷線）。
  const firstMsg = messages[0];
  const lastMsg = messages[messages.length - 1];
  const chatDuration = (lastMsg.timestamp.getTime() - firstMsg.timestamp.getTime()) / 60000;

  const nowMs = appState.isDemoMode
    ? lastMsg.timestamp.getTime() + 1000 * 60 * 5
    : new Date().getTime();

  const trailingSilence = (nowMs - lastMsg.timestamp.getTime()) / 60000;


  const jitterData = [...responseTimes];
  const isAbnormalSilence = trailingSilence > Math.max(
    chatDuration * ABNORMAL_SILENCE_CHAT_RATIO,
    baselineMrt * ABNORMAL_SILENCE_BASELINE_MULTIPLIER,
    ABNORMAL_SILENCE_MIN_MINUTES
  );

  if (isAbnormalSilence) {

    jitterData.push(trailingSilence);
  }

  const jitter = standardDeviation(jitterData);
  const stabilityFlag = jitter > baselineMrt ? "UNSTABLE" : "STABLE";

  let latencyTotal = 0;

  let payloadTotal = 0;
  let packetLoss = 0;

  responsePairs.forEach((pair) => {
    const effectiveBaseline = isQuietHours(pair.request.timestamp)
      ? Math.max(baselineMrt * QUIET_HOUR_BASELINE_MULTIPLIER, 5)
      : baselineMrt;

    const relativeDelay = pair.responseMinutes / Math.max(effectiveBaseline, 1);
    const latencyScore =
      relativeDelay <= 1
        ? 1
        : Math.max(0, 1 - (relativeDelay - 1) / (LATENCY_DECAY_THRESHOLD - 1));

    const payloadRatio = Math.min(
      pair.response.wordCount / Math.max(pair.request.wordCount, 1),
      2
    );
    const payloadScore = payloadRatio / 2;

    if (isQuestion(pair.request.content) && isIrrelevantReply(pair.request, pair.response)) {
      packetLoss += 1;
    }

    latencyTotal += latencyScore;
    payloadTotal += payloadScore;
  });


  const avgLatencyScore = latencyTotal / responsePairs.length;
  const avgPayloadScore = payloadTotal / responsePairs.length;
  const rawScore = 0.6 * avgLatencyScore + 0.4 * avgPayloadScore;

  const rawGhostingPenalty = computeGhostingPenalty(messages);
  const rawDoublePingPenalty = computeDoublePingPenalty(messages);

  const rawPacketLossPenalty = packetLoss * 6;

  const ghostingPenalty = Math.min(rawGhostingPenalty, 14);
  const doublePingPenalty = Math.min(rawDoublePingPenalty, 12);
  const packetLossPenalty = Math.min(rawPacketLossPenalty, 18);
  const penaltyTotal = ghostingPenalty + doublePingPenalty + packetLossPenalty;

  const finalSyncRate = clamp(Math.round(rawScore * 100 - penaltyTotal), 0, 100);

  // Using jitter and stabilityFlag calculated with virtual latency at function start
  const initiationBias = computeInitiationBias(messages, speakerA, speakerB);
  const messageBalance = computeMessageBalance(messages, speakerA, speakerB);
  const anxietySignal = hasAnxietySignal(messages);

  const confidence = computeConfidence({
    messages,
    responsePairs,
    packetLoss,
    stabilityFlag,
  });

  const impactDrivers = buildImpactDrivers({
    avgLatencyScore,
    avgPayloadScore,
    stabilityFlag,
    penaltyTotal,
    packetLoss,
    ghostingPenalty,
    doublePingPenalty,
    initiationBias,
  });

  const relationshipModel = classifyRelationship({
    messages,
    syncRate: finalSyncRate,
    stabilityFlag,
    ghostingPenalty,
    rawGhostingPenalty,
    doublePingPenalty,
    avgLatencyScore,
    initiationBias,
    messageBalance,
    anxietySignal,
  });

  const inputForClassification = {
    messages,
    relationshipModel,
    syncRate: finalSyncRate,
    avgLatencyScore,
    avgPayloadScore,
    doublePingPenalty,
    stabilityFlag,
    anxietySignal,
    ghostingPenalty,
    rawGhostingPenalty,
    initiationBias,
    messageBalance,
    jitterMinutes: jitter,
  };

  // 【惡魔修復】實施非對稱地位判定
  const povSpeaker = subjectName || appState.subjectSpeaker || speakerA;
  const counterpartName = speakerA === povSpeaker ? speakerB : speakerA;

  // 計算雙方的 PowerScore 用於互相輸入
  const mySignals = computeDogSignals(inputForClassification, povSpeaker, 0);
  const cpSignals = computeDogSignals(inputForClassification, counterpartName, 0);

  // 12 種犬種判定 (回傳評分物件以計算 Mix)
  const myScores = classifyDogType(inputForClassification, povSpeaker, cpSignals.powerScore);
  const dogType = resolvePrimaryType(myScores, inputForClassification);
  const personalityMix = calculatePersonalityMix(myScores, dogType);

  const cpScores = classifyDogType(inputForClassification, counterpartName, mySignals.powerScore);
  const counterpartType = resolvePrimaryType(cpScores, inputForClassification);

  const myPower = mySignals.powerScore;
  const cpPower = cpSignals.powerScore;
  const isPursuer = myPower < cpPower;

  const participantsArray = [povSpeaker, counterpartName];

  const metadata = {
    participants: participantsArray,
    messageCount: messages.length,
    responsePairCount: responsePairs.length,
    baselineMRTMinutes: round(baselineMrt),
    latencyScore: round(avgLatencyScore),
    payloadScore: round(avgPayloadScore),
    jitterMinutes: round(jitter),
    stabilityFlag,
    packetLossCount: packetLoss,
    messageBalance,
    confidence,
    impactDrivers,
    penalties: {
      ghosting: ghostingPenalty,
      doublePinging: doublePingPenalty,
      packetLoss: packetLossPenalty,
      total: penaltyTotal,
      rawGhosting: rawGhostingPenalty,
      rawDoublePinging: rawDoublePingPenalty,
      rawPacketLoss: rawPacketLossPenalty,
    },
    finalSyncRate,
    dogType,
    dogCharacter: DOG_CHARACTER_META[dogType] || DOG_CHARACTER_META["邊境牧羊犬型"], // 防呆 fallback

    counterpartType,
    counterpartCharacter: DOG_CHARACTER_META[counterpartType] || DOG_CHARACTER_META["邊境牧羊犬型"], // 防呆 fallback
    relationshipModel,
    personalityMix,
    debug: { // 新增 Debug Metadata 方便原因追查
      povSpeaker,
      counterpartName,
      myInitiation: mySignals.myInitiation,
      myMessageShare: mySignals.myMessageShare,
      myPower: round(myPower),
      cpInitiation: cpSignals.myInitiation,
      cpMessageShare: cpSignals.myMessageShare,
      cpPower: round(cpPower),
      powerGap: round(myPower - cpPower),
      isPursuer,
      baselineMrt: round(baselineMrt),
      trailingSilence: round(trailingSilence),
      isAbnormalSilence
    }
  };


  const mermaid = buildMermaid({
    speakerA,
    speakerB,
    baselineMrt,
    avgLatencyScore,
    avgPayloadScore,
    stabilityFlag,
    finalSyncRate,
  });

  return {
    metadata,
    mermaid,
    verdict: buildVerdict({
      dogType,
      relationshipModel,
      finalSyncRate,
      metrics: inputForClassification,
      stabilityFlag,
      penaltyTotal,
      subjectSpeaker: povSpeaker,
    }),
  };
}

function buildResponsePairs(messages, speakerA, speakerB) {
  const validSpeakers = new Set([speakerA, speakerB]);
  const blocks = [];

  for (const message of messages) {
    if (!validSpeakers.has(message.speaker)) {
      continue;
    }

    const lastBlock = blocks[blocks.length - 1];
    if (
      lastBlock &&
      lastBlock.speaker === message.speaker &&
      (message.timestamp.getTime() - lastBlock.lastTimestamp.getTime()) / 60000 <= BLOCK_MERGE_WINDOW_MINUTES
    ) {

      lastBlock.messages.push(message);
      lastBlock.content += ` ${message.content}`;
      lastBlock.wordCount += message.wordCount;
      lastBlock.lastTimestamp = message.timestamp;
      lastBlock.endTimeText = message.timeText;
    } else {
      blocks.push({
        speaker: message.speaker,
        messages: [message],
        content: message.content,
        wordCount: message.wordCount,
        firstTimestamp: message.timestamp,
        lastTimestamp: message.timestamp,
        dateText: message.dateText,
        startTimeText: message.timeText,
        endTimeText: message.timeText,
      });
    }
  }

  const pairs = [];

  for (let index = 1; index < blocks.length; index += 1) {
    const previous = blocks[index - 1];
    const current = blocks[index];

    if (previous.speaker === current.speaker) {
      continue;
    }

    const responseMinutes =
      (current.firstTimestamp.getTime() - previous.lastTimestamp.getTime()) / 60000;

    if (responseMinutes < 0 || responseMinutes > MAX_RESPONSE_GAP_MINUTES) {
      continue;
    }


    pairs.push({
      request: {
        speaker: previous.speaker,
        content: previous.content.trim(),
        wordCount: previous.wordCount,
        timestamp: previous.lastTimestamp,
        dateText: previous.dateText,
        timeText: previous.endTimeText,
      },
      response: {
        speaker: current.speaker,
        content: current.content.trim(),
        wordCount: current.wordCount,
        timestamp: current.firstTimestamp,
        dateText: current.dateText,
        timeText: current.startTimeText,
      },
      responseMinutes,
      requestBlockSize: previous.messages.length,
      responseBlockSize: current.messages.length,
    });
  }

  return pairs;
}

function computeGhostingPenalty(messages) {

  if (!messages.length) {
    return 0;
  }

  const lastMessage = messages[messages.length - 1];
  let trailingCount = 1;
  let index = messages.length - 2;

  while (index >= 0 && messages[index].speaker === lastMessage.speaker) {
    trailingCount += 1; index -= 1;
  }

  if (index < 0) {
    return trailingCount >= 4 ? 10 : 0;
  }

  const previousOtherSideMessage = messages[index];
  const minutesSinceLastReply =
    (lastMessage.timestamp.getTime() - previousOtherSideMessage.timestamp.getTime()) / 60000;

  if (messages.length < 12 && trailingCount <= 2) {
    return 0;
  }

  if (minutesSinceLastReply >= GHOSTING_HEAVY_MINUTES && trailingCount >= 3) {
    return GHOSTING_SEVERE_MULTIPLIER;
  }

  if (minutesSinceLastReply >= GHOSTING_HEAVY_MINUTES && trailingCount >= 2) {
    return GHOSTING_HEAVY_MULTIPLIER;
  }

  if (minutesSinceLastReply >= GHOSTING_LIGHT_MINUTES && trailingCount >= 2) {
    return GHOSTING_LIGHT_MULTIPLIER;
  }

  return 0;
}



  function computeDoublePingPenalty(messages) {
    let worstPenalty = 0;
    let runStart = 0;

    function evaluateRun(runMessages) {
      if (runMessages.length < 2) return 0;
      let penalty = 0;
      for (let i = 1; i < runMessages.length; i++) {
        const gap = (runMessages[i].timestamp.getTime() - runMessages[i - 1].timestamp.getTime()) / 60000;
        if (gap <= DOUBLE_PING_SHORT_GAP) penalty += 6;
        else if (gap <= DOUBLE_PING_MEDIUM_GAP) penalty += 3;
      }
      return penalty;
    }

    for (let i = 1; i < messages.length; i++) {
      if (messages[i].speaker !== messages[runStart].speaker) {
        worstPenalty += evaluateRun(messages.slice(runStart, i));
        runStart = i;
      }
    }
    worstPenalty += evaluateRun(messages.slice(runStart));
    return worstPenalty;
  }

  function computeInitiationBias(messages, speakerA, speakerB) {
    const sessions = [];
    let currentSession = null;

    messages.forEach((msg) => {
      if (!currentSession || (msg.timestamp.getTime() - currentSession.lastTimestamp.getTime()) / 60000 > 360) {
        currentSession = { initiator: msg.speaker, lastTimestamp: msg.timestamp };
        sessions.push(currentSession);
      } else {
        currentSession.lastTimestamp = msg.timestamp;
      }
    });

    const counts = { [speakerA]: 0, [speakerB]: 0 };
    sessions.forEach((s) => { if (counts[s.initiator] !== undefined) counts[s.initiator]++; });
    const total = Math.max(sessions.length, 1);
    return { [speakerA]: counts[speakerA] / total, [speakerB]: counts[speakerB] / total };
  }

  function computeMessageBalance(messages, speakerA, speakerB) {
    const counts = { [speakerA]: 0, [speakerB]: 0 };
    messages.forEach((msg) => { if (counts[msg.speaker] !== undefined) counts[msg.speaker]++; });
    const total = Math.max(messages.length, 1);
    return { [speakerA]: counts[speakerA] / total, [speakerB]: counts[speakerB] / total };
  }

  function hasAnxietySignal(messages) {
    const lastMsgs = messages.slice(-5);
    const lastSpeaker = lastMsgs.length > 0 ? lastMsgs[lastMsgs.length - 1].speaker : null;
    const trailingCount = lastMsgs.filter(m => m.speaker === lastSpeaker).length;
    return trailingCount >= 4;
  }

function computeDogSignals(input, targetSpeaker, counterpartPower = 0) {
  const myInitiation = input.initiationBias[targetSpeaker] || 0.5;
  const myMessageShare = input.messageBalance[targetSpeaker] || 0.5;

  const powerScore = (0.5 - myInitiation) * 200 + (0.5 - myMessageShare) * 100;

  const isPursuer = powerScore < counterpartPower;
  const isHighPosition = powerScore > counterpartPower + 18;

  const isLowOutput = myMessageShare < 0.38;
  const isMidOutput = myMessageShare >= 0.38 && myMessageShare <= 0.62;
  const isHighOutput = myMessageShare > 0.62;

  const isPassive = myInitiation < 0.42;
  const isBalancedInitiation = myInitiation >= 0.42 && myInitiation <= 0.58;
  const isActive = myInitiation > 0.58;

  const latencyVeryStrong = input.avgLatencyScore >= 0.88;
  const latencyStrong = input.avgLatencyScore >= 0.72;
  const latencyMid = input.avgLatencyScore >= 0.5 && input.avgLatencyScore <= 0.82;
  const latencyWeak = input.avgLatencyScore < 0.45;

  const payloadStrong = input.avgPayloadScore >= 0.8;
  const payloadVeryStrong = input.avgPayloadScore >= 0.88;
  const payloadWeak = input.avgPayloadScore < 0.45;

  const chaotic =
    input.stabilityFlag === "UNSTABLE" &&
    (input.jitterMinutes >= 180 || input.anxietySignal);

  const nearZombie =
    input.ghostingPenalty >= 12 ||
    input.rawGhostingPenalty >= 15 ||
    (input.syncRate < 30 && input.relationshipModel === "斷線關係");

  return {
    myInitiation,
    myMessageShare,
    powerScore,
    isPursuer,
    isHighPosition,
    isLowOutput,
    isMidOutput,
    isHighOutput,
    isPassive,
    isBalancedInitiation,
    isActive,
    latencyVeryStrong,
    latencyStrong,
    latencyMid,
    latencyWeak,
    payloadStrong,
    payloadVeryStrong,
    payloadWeak,
    chaotic,
    nearZombie,
  };
}

function classifyDogType(input, targetSpeaker = null, counterpartPower = 0) {
  const target = targetSpeaker || appState.subjectSpeaker;
  const s = computeDogSignals(input, target, counterpartPower);

  const breeds = [
    "邊境牧羊犬型",
    "黃金獵犬型",
    "貴賓狗型",
    "柴犬型",
    "流浪狗型",
    "警犬型",
    "殭屍狗型",
    "哈士奇型",
    "吉娃娃型",
    "哈比小狗型",
    "高冷黑貓型",
    "佛系和尚狗型",
    "狼系主宰型"
  ];

  const scores = Object.fromEntries(breeds.map((breed) => [breed, 0]));
  const model = input.relationshipModel;

  // A. 高位角色加分，但不直接封神
  const masterScores = {
    "高冷黑貓型": 0,
    "佛系和尚狗型": 0,
    "狼系主宰型": 0,
  };

  if (!s.isPursuer && s.isHighPosition) {
    // 黑貓：真的偏冷才進
    if (
      s.isPassive &&
      s.isLowOutput &&
      input.avgPayloadScore < 0.55 &&
      input.stabilityFlag === "STABLE"
    ) {
      masterScores["高冷黑貓型"] += 32;
    }

    // 和尚：穩、低輸出、不亂、不爭
    if (
      s.isPassive &&
      s.isLowOutput &&
      !s.chaotic &&
      input.stabilityFlag === "STABLE" &&
      input.doublePingPenalty === 0
    ) {
      masterScores["佛系和尚狗型"] += 56;
    }

    // 狼：真的高壓主導才進
    if (s.powerScore > 88 || (s.isActive && s.powerScore > 62)) {
      masterScores["狼系主宰型"] += 72;
    }
  }

  for (const [name, value] of Object.entries(masterScores)) {
    scores[name] += value;
  }

  // B. Relationship Model 基礎導引
  if (model === "雙向同步") {
    scores["邊境牧羊犬型"] += 30;
  }

  if (model === "單向輸出" && s.isPursuer) {
    if (input.avgPayloadScore > 0.62) {
      scores["黃金獵犬型"] += 26;
    } else {
      scores["黃金獵犬型"] += 14;
    }
  }

  if (model === "延遲戀愛") {
    scores["柴犬型"] += 24;
  }

  if (model === "斷線關係") {
    scores["殭屍狗型"] += 44;
  }

  if (model === "間歇性強化") {
    if (s.isPursuer) {
      scores["流浪狗型"] += 24;
      scores["吉娃娃型"] += 8;
    } else {
      scores["高冷黑貓型"] += 8;
      scores["哈士奇型"] += 6;
    }
  }

  // C. 核心硬指標
  if (input.syncRate > 82) {
    scores["邊境牧羊犬型"] += 24;
  }

  // 貴賓狗：投入、體面、節制、不失控
  if (input.avgPayloadScore > 0.8) scores["貴賓狗型"] += 18;
  if (input.avgPayloadScore > 0.9) scores["貴賓狗型"] += 10;
  if (input.doublePingPenalty === 0) scores["貴賓狗型"] += 10;
  if (!input.anxietySignal && !s.chaotic) scores["貴賓狗型"] += 6;
  if (
    s.isHighOutput &&
    input.avgLatencyScore >= 0.5 &&
    input.avgLatencyScore <= 0.88
  ) {
    scores["貴賓狗型"] += 12;
  }

  if (input.avgLatencyScore < 0.45) {
    scores["柴犬型"] += 24;
  }

  if (
    input.avgLatencyScore > 0.92 &&
    s.isHighOutput &&
    input.avgPayloadScore > 0.72 &&
    input.doublePingPenalty <= 3 &&
    !input.anxietySignal
  ) {
    scores["警犬型"] += 24;
  }

  // D. Pursuer 專屬邏輯
  if (s.isPursuer) {
    if (input.doublePingPenalty >= 15) scores["流浪狗型"] += 28;
    if (input.anxietySignal && input.syncRate < 60) scores["流浪狗型"] += 16;
    if (input.syncRate < 50) scores["流浪狗型"] += 10;

    if (input.doublePingPenalty >= 12 && input.avgPayloadScore < 0.45) {
      scores["吉娃娃型"] += 38;
    }

    if (
      input.syncRate > 60 &&
      s.powerScore < -20 &&
      input.doublePingPenalty < 12 &&
      !s.nearZombie
    ) {
      scores["哈比小狗型"] += 28;
    }

    if (
      !input.anxietySignal &&
      input.doublePingPenalty === 0 &&
      input.avgPayloadScore > 0.72
    ) {
      scores["貴賓狗型"] += 14;
    }

    if (s.nearZombie && s.isHighOutput) {
      scores["殭屍狗型"] += 24;
    }

    if (input.ghostingPenalty >= 12 && input.syncRate < 45) {
      scores["殭屍狗型"] += 18;
    }
  }

  // E. 非追求者保護
  if (!s.isPursuer) {
    scores["流浪狗型"] = 0;
    scores["哈比小狗型"] = 0;
    scores["吉娃娃型"] = 0;

    // 黑貓只做很小幅補強，不再當回收桶
    if (
      s.isPassive &&
      s.isLowOutput &&
      input.avgPayloadScore < 0.5 &&
      input.stabilityFlag === "STABLE"
    ) {
      scores["高冷黑貓型"] += 6;
    }

    // 穩定安靜者更偏和尚
    if (s.isPassive && s.latencyMid && !s.chaotic) {
      scores["佛系和尚狗型"] += 12;
    }

    const topScore = Math.max(...Object.values(scores));
    if (topScore === 0) {
      if (s.isPassive && input.stabilityFlag === "STABLE") {
        scores["佛系和尚狗型"] += 16;
      } else if (input.stabilityFlag === "STABLE") {
        scores["柴犬型"] += 16;
      } else {
        scores["貴賓狗型"] += 12;
      }
    }
  }

  // F. 哈士奇：真的亂才叫哈士奇
  const huskyGate =
    s.chaotic &&
    s.isHighOutput &&
    input.syncRate > 55 &&
    !s.nearZombie;

  if (huskyGate) {
    scores["哈士奇型"] += 24;
  } else {
    scores["哈士奇型"] = Math.max(0, scores["哈士奇型"] - 14);
  }

  // G. 細補強
  if (s.nearZombie) {
    scores["殭屍狗型"] += 16;
  }

  // 中間角色引流
  if (input.avgPayloadScore > 0.72 && input.doublePingPenalty === 0) {
    scores["貴賓狗型"] += 8;
  }

  if (input.avgLatencyScore < 0.45 && input.stabilityFlag === "STABLE") {
    scores["柴犬型"] += 8;
  }

  if (model === "單向輸出" && s.isPursuer && input.avgPayloadScore > 0.55) {
    scores["黃金獵犬型"] += 8;
  }

  if (scores["殭屍狗型"] >= 55) {
    scores["哈比小狗型"] = Math.max(0, scores["哈比小狗型"] - 18);
    scores["黃金獵犬型"] = Math.max(0, scores["黃金獵犬型"] - 10);
  }

  return scores;
}
const DRAMATIC_TYPES = new Set([
  "高冷黑貓型",
  "流浪狗型",
  "警犬型",
  "狼系主宰型",
  "殭屍狗型",
  "吉娃娃型",
]);

const STABLE_TYPES = new Set([
  "佛系和尚狗型",
  "柴犬型",
  "黃金獵犬型",
  "貴賓狗型",
  "邊境牧羊犬型",
  "哈比小狗型",
  "哈士奇型",
]);

function resolvePrimaryType(scores, input) {
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [topName, topScore] = sorted[0] || ["柴犬型", 0];
  const [secondName, secondScore] = sorted[1] || ["柴犬型", 0];
  const gap = topScore - secondScore;

  if (DRAMATIC_TYPES.has(topName)) {
    const dramaticGatePassed = passesDramaticGate(topName, topScore, gap, input);

    if (!dramaticGatePassed) {
      if (STABLE_TYPES.has(secondName)) {
        return secondName;
      }
      return fallbackStableType(sorted, input);
    }
  }

  if (
    (topName === "高冷黑貓型" && secondName === "佛系和尚狗型") ||
    (topName === "佛系和尚狗型" && secondName === "高冷黑貓型")
  ) {
    if (Math.abs(topScore - secondScore) <= 10) {
      if (input.avgPayloadScore >= 0.5 && input.stabilityFlag === "STABLE") {
        return "佛系和尚狗型";
      }
    }
  }

  if (topName === "警犬型") {
    const safeWatchdog =
      input.avgLatencyScore > 0.92 &&
      input.avgPayloadScore > 0.72 &&
      input.doublePingPenalty <= 3 &&
      !input.anxietySignal;

    if (!safeWatchdog) {
      if (secondName === "貴賓狗型" || secondName === "黃金獵犬型") {
        return secondName;
      }
      return "貴賓狗型";
    }
  }

  return topName;
}

function passesDramaticGate(type, topScore, gap, input) {
  switch (type) {
    case "高冷黑貓型":
      return (
        topScore >= 40 &&
        gap >= 14 &&
        input.avgPayloadScore < 0.55 &&
        input.stabilityFlag === "STABLE"
      );

    case "流浪狗型":
      return (
        topScore >= 40 &&
        gap >= 10 &&
        (input.doublePingPenalty >= 12 ||
          input.ghostingPenalty >= 3 ||
          (input.syncRate < 50 && input.anxietySignal))
      );

    case "警犬型":
      return (
        topScore >= 38 &&
        gap >= 10 &&
        input.avgLatencyScore > 0.92 &&
        input.avgPayloadScore > 0.72 &&
        input.doublePingPenalty <= 3 &&
        !input.anxietySignal
      );

    case "狼系主宰型":
      return topScore >= 48 && gap >= 12;

    case "殭屍狗型":
      return (
        topScore >= 45 &&
        gap >= 10 &&
        (input.ghostingPenalty >= 12 || input.syncRate < 20)
      );

    case "吉娃娃型":
      return (
        topScore >= 38 &&
        gap >= 10 &&
        input.doublePingPenalty >= 12 &&
        input.avgPayloadScore < 0.45
      );

    default:
      return true;
  }
}

function fallbackStableType(sorted, input) {
  const stableCandidate = sorted.find(([name]) => STABLE_TYPES.has(name));
  if (stableCandidate) return stableCandidate[0];

  if (input.stabilityFlag === "STABLE" && input.avgPayloadScore >= 0.5) {
    return "佛系和尚狗型";
  }

  if (input.avgLatencyScore < 0.45) {
    return "柴犬型";
  }

  return "貴賓狗型";
}
  function calculatePersonalityMix(scores, primaryType = null) {
    const personalityScores = { ...scores };

    // 【視覺一致化】：為主類型注入保底權重，確保混血第一順位與主判定一致
    if (primaryType && personalityScores[primaryType] != null) {
      personalityScores[primaryType] += 12;
    }

    const total = Object.values(personalityScores).reduce((a, b) => a + b, 0);
    if (total === 0) return [];

    return Object.entries(personalityScores)
      .map(([name, score]) => ({
        name: name.replace("型", ""),
        percentage: Math.round((score / total) * 100),
        color: DOG_CHARACTER_META[name]?.accent || "#ccc"
      }))
      .filter(item => item.percentage > 8)
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 3);
  }

function classifyRelationship(input) {
  const dominantBias = Math.max(...Object.values(input.initiationBias));
  const dominantMessageShare = Math.max(...Object.values(input.messageBalance));

  if (input.rawGhostingPenalty >= 15 || input.syncRate < 15) {
    return "斷線關係";
  }

  if (input.ghostingPenalty >= 12 && input.syncRate < 35) {
    return "斷線關係";
  }

  if (
    input.syncRate >= 70 &&
    input.avgLatencyScore >= 0.7 &&
    input.stabilityFlag === "STABLE"
  ) {
    return "雙向同步";
  }

  if (input.syncRate >= 85 && input.avgLatencyScore >= 0.6) {
    return "雙向同步";
  }

  if (
    input.stabilityFlag === "UNSTABLE" &&
    (input.doublePingPenalty >= 6 || input.anxietySignal) &&
    input.syncRate >= 35 &&
    input.syncRate <= 75
  ) {
    return "間歇性強化";
  }

  const isMicroHistory =
    input.messages && new Set(input.messages.map((m) => m.dateText)).size <= 1;

  const activeDominance = isMicroHistory
    ? dominantMessageShare > 0.65
    : dominantBias > 0.72 || dominantMessageShare > 0.68;

  if (activeDominance) {
    return "單向輸出";
  }

  if (input.avgLatencyScore < 0.4 && input.syncRate < 50) {
    return "延遲戀愛";
  }

  return "普通往來";
}


  function buildVerdict({ dogType, relationshipModel, finalSyncRate, stabilityFlag, penaltyTotal, metrics, subjectSpeaker }) {
    const isMaster = ["高冷黑貓型", "佛系和尚狗型", "狼系主宰型"].includes(dogType);
    const counterpart = metrics && metrics.initiationBias
      ? Object.keys(metrics.initiationBias).find(name => name !== subjectSpeaker) || "對方"
      : "對方";

    let targetDogForCounterpart = "流浪狗";
    if (relationshipModel === "雙向同步") targetDogForCounterpart = "邊境牧羊犬";
    if (relationshipModel === "單向輸出") targetDogForCounterpart = "黃金獵犬";
    if (relationshipModel === "斷線關係") targetDogForCounterpart = "殭屍狗";

    const masterTemplates = {
      "高冷黑貓型": `${counterpart} 目前是你的 ${targetDogForCounterpart}。你優雅地維持著距離，對方的熱情在其眼中只是背景音。`,
      "佛系和尚狗型": `${counterpart} 只是你參禪路上的 ${targetDogForCounterpart}。你情緒穩定如磐石，對方的起伏完全無法動搖你的法身。`,
      "狼系主宰型": `${counterpart} 已被你馴化為 ${targetDogForCounterpart}。你掌握著絕對的話語權，每一次回覆都精準地控制著對方的呼吸。`
    };

    const templates = {
      邊境牧羊犬型: "你不是在舔，你是在維持一條雙向低延遲的私有光纖。",
      黃金獵犬型: "你負責提供情緒價值，對方負責把通知欄當收件匣。",
      貴賓狗型: "你每次回覆都像提案簡報，但對方只回了會後摘要。",
      柴犬型: "你以為是穩住節奏，系統紀錄看起來比較像故意延遲 ACK。",
      流浪狗型: "你不是在聊天，你在做高頻 retry，還順便把自尊當封包送出去。",
      警犬型: "你的回覆速度已經不是心動，是即時監控等級的常駐程序。",
      殭屍狗型: "連線早就終止，你還在對著已關閉的埠口送出心跳包。",
    };

    const fallback =
      relationshipModel === "普通往來"
        ? "目前看起來比較像一般互動，還沒強到可以直接蓋章成某種關係劇本。"
        : "系統已完成互動拓撲掃描。";

    const mainText = isMaster ? masterTemplates[dogType] : (templates[dogType] || fallback);

    return `${mainText} 目前模型判定為「${relationshipModel}」，同步率 ${finalSyncRate}%，穩定性 ${stabilityFlag}，總懲罰 ${penaltyTotal}。`;
  }

  function computeConfidence({ messages, responsePairs, packetLoss, stabilityFlag }) {
    let score = 100;
    const systemLikeCount = messages.filter((message) => /\[(貼圖|照片|圖片|影片|語音訊息)\]/.test(message.content)).length;
    const nonTextRatio = systemLikeCount / Math.max(messages.length, 1);

    if (responsePairs.length < 10) score -= 30;
    else if (responsePairs.length < 20) score -= 18;
    else if (responsePairs.length < 40) score -= 10;
    else if (responsePairs.length < 120) score -= 4;

    if (nonTextRatio > 0.35) score -= 14;
    else if (nonTextRatio > 0.2) score -= 6;

    if (packetLoss > 18) score -= 12;
    else if (packetLoss > 8) score -= 6;

    if (stabilityFlag === "UNSTABLE") score -= 4;

    const value = clamp(score, 35, 98);
    return { value, label: value >= 80 ? "High" : value >= 60 ? "Medium" : "Low" };
  }

  function buildImpactDrivers({
    avgLatencyScore,
    avgPayloadScore,
    stabilityFlag,
    penaltyTotal,
    packetLoss,
    ghostingPenalty,
    doublePingPenalty,
    initiationBias,
  }) {
    const drivers = [];
    const dominantBias = Math.max(...Object.values(initiationBias));

    if (avgLatencyScore > 0.82) {
      drivers.push("回覆延遲表現偏強");
    } else if (avgLatencyScore < 0.5) {
      drivers.push("回覆延遲偏慢");
    }

    if (avgPayloadScore > 0.75) {
      drivers.push("回覆投入度高");
    } else if (avgPayloadScore < 0.4) {
      drivers.push("回覆內容偏短");
    }

    if (stabilityFlag === "UNSTABLE") {
      drivers.push("互動節奏忽冷忽熱");
    }

    if (dominantBias > 0.72) {
      drivers.push("開話題明顯偏單邊");
    }

    if (ghostingPenalty >= 12) {
      drivers.push("尾段未回應影響大");
    }

    if (doublePingPenalty >= 8) {
      drivers.push("連續追 ping 拉低評分");
    }

    if (packetLoss >= 8) {
      drivers.push("部分問句沒有被有效接住");
    }

    if (!drivers.length || penaltyTotal < 8) {
      drivers.push("整體互動相對乾淨");
    }

    return drivers.slice(0, 4);
  }

  function humanizeLatency(score) {
    if (score >= 0.88) {
      return "很快";
    }
    if (score >= 0.68) {
      return "正常偏快";
    }
    if (score >= 0.45) {
      return "有點慢";
    }
    return "偏慢";
  }

  function humanizePayload(score) {
    if (score >= 0.8) {
      return "很投入";
    }
    if (score >= 0.58) {
      return "有在接球";
    }
    if (score >= 0.38) {
      return "普通";
    }
    return "偏敷衍";
  }

  function humanizeJitter(jitterMinutes, stabilityFlag) {
    if (stabilityFlag === "UNSTABLE" || jitterMinutes >= 180) {
      return "忽冷忽熱";
    }
    if (jitterMinutes >= 60) {
      return "偶爾飄";
    }
    return "算穩";
  }

  function humanizePenalty(total) {
    if (total >= 35) {
      return "很多";
    }
    if (total >= 18) {
      return "偏多";
    }
    if (total >= 8) {
      return "一些";
    }
    return "很少";
  }

  function buildMermaid({
    speakerA,
    speakerB,
    baselineMrt,
    avgLatencyScore,
    avgPayloadScore,
    stabilityFlag,
    finalSyncRate,
  }) {
    return `graph LR
    A(("${speakerA}")) -- "Baseline MRT: ${round(baselineMrt)} min" --> B(("${speakerB}"))
    B -- "Latency Score: ${round(avgLatencyScore)}" --> A
    A -- "Payload Score: ${round(avgPayloadScore)}" --> B
    S["Stability: ${stabilityFlag}"] --> A
    S --> B
    R["Sync Rate: ${finalSyncRate}%"] --> S`;
  }

  function renderResult(result) {
    try {
      const { metadata, mermaid, verdict } = result;

      if (!ui.resultState) throw new Error("找不到結果顯示區 (resultState)");

      ui.resultState.classList.remove("hidden");
      if (ui.syncBadge) ui.syncBadge.textContent = `${metadata.finalSyncRate}%`;
      if (ui.dogType) ui.dogType.textContent = metadata.dogType;
      if (ui.relationshipModel) ui.relationshipModel.textContent = metadata.relationshipModel;
      if (ui.verdict) ui.verdict.textContent = verdict;

      if (ui.latencyMetric) ui.latencyMetric.textContent = humanizeLatency(metadata.latencyScore);
      if (ui.payloadMetric) ui.payloadMetric.textContent = humanizePayload(metadata.payloadScore);
      if (ui.jitterMetric) ui.jitterMetric.textContent = humanizeJitter(
        metadata.jitterMinutes,
        metadata.stabilityFlag
      );
      if (ui.penaltyMetric) ui.penaltyMetric.textContent = humanizePenalty(metadata.penalties.total);

      if (ui.participantsLabel) ui.participantsLabel.textContent = metadata.participants.join(" ↔ ");
      if (ui.stabilityLabel) ui.stabilityLabel.textContent = metadata.stabilityFlag;
      if (ui.confidenceLabel) ui.confidenceLabel.textContent = `${metadata.confidence.label} (${metadata.confidence.value}%)`;
      if (ui.driversLabel) ui.driversLabel.textContent = metadata.impactDrivers.join(" / ");

      if (ui.jsonOutput) ui.jsonOutput.textContent = JSON.stringify(metadata, null, 2);
      if (ui.mermaidOutput) ui.mermaidOutput.textContent = mermaid;

      const previewUrl = renderStoryCanvas({
        syncRate: metadata.finalSyncRate,
        dogType: metadata.dogType,
        dogCharacter: metadata.dogCharacter,
        counterpartType: metadata.counterpartType,
        counterpartCharacter: metadata.counterpartCharacter,
        relationshipModel: metadata.relationshipModel,
        verdict,
        participants: metadata.participants.join(" × "),
        stabilityFlag: metadata.stabilityFlag,
        personalityMix: metadata.personalityMix, // 傳入比例數據
      });

      if (ui.storyPreview) ui.storyPreview.src = previewUrl;
    } catch (err) {
      console.error("Render error:", err);
      if (ui.statusBox) ui.statusBox.textContent = `渲染失敗：${err.message}`;
    }
  }

  function renderStoryCanvas({
    syncRate,
    dogType,
    dogCharacter,
    counterpartType,
    counterpartCharacter,
    relationshipModel,
    verdict,
    participants,
    stabilityFlag,
    personalityMix, // 接收比例
    __canvas,
    __ctx,
  }) {
    const canvas = __canvas || ui.exportCanvas;
    if (!canvas) throw new Error("找不到渲染目標 (exportCanvas)");
    const ctx = __ctx || canvas.getContext("2d");
    if (!ctx) throw new Error("無法取得繪圖上下文 (Canvas Context)");
    const character = dogCharacter || DOG_CHARACTER_META[dogType] || DOG_CHARACTER_META["邊境牧羊犬型"];
    const cCharacter = counterpartCharacter || DOG_CHARACTER_META[counterpartType] || DOG_CHARACTER_META["邊境牧羊犬型"];


    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const bg = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bg.addColorStop(0, "#f4faf4");
    bg.addColorStop(1, "#edf5ed");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "rgba(132, 167, 138, 0.08)";
    ctx.fillRect(60, 60, 960, 1800);

    drawSoftCard(ctx, 86, 104, 908, 1188);
    drawSoftCard(ctx, 86, 1332, 908, 424);

    ctx.fillStyle = "#4a4a45";
    ctx.font = '700 44px "Noto Sans TC", sans-serif';
    ctx.textAlign = "center";
    if (dogType === "高冷黑貓型" || dogType === "佛系和尚狗型" || dogType === "狼系主宰型") {
      ctx.fillText("你的靈魂主宰是：", 540, 208);
    } else {
      ctx.fillText("你的舔狗品種是：", 540, 208);
    }

    ctx.fillStyle = "#232320";
    const titleSize = dogType.length > 4 ? 88 : dogType.length > 3 ? 102 : 112;
    ctx.font = `800 ${titleSize}px "Noto Sans TC", sans-serif`;
    ctx.fillText(dogType.replace("型", ""), 540, 340);

    ctx.fillStyle = character.accent;
    ctx.font = '700 86px "Space Grotesk", sans-serif';
    ctx.fillText(character.code, 540, 442);

    // 敘事雙向渲染
    // 左側是你
    drawLowPolyDog(ctx, 320, 690, 0.72, character, dogType);

    // 右側是對手
    if (relationshipModel === "斷線關係" || dogType === "殭屍狗型") {
      // 斷線關係：留白，給予離線訊號
      ctx.fillStyle = "rgba(169, 173, 181, 0.2)";
      ctx.beginPath();
      ctx.arc(760, 690, 70, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#abaeb4";
      ctx.font = '700 24px "Noto Sans TC", sans-serif';
      ctx.textAlign = "center";
      ctx.fillText("OFFLINE", 760, 698);
    } else if (relationshipModel === "間歇性強化" || dogType === "流浪狗型") {
      // 流浪狗：背對，無情不回頭
      drawLowPolyDog(ctx, 760, 690, 0.72, cCharacter, counterpartType);
    } else {
      // 常規：面對面
      ctx.save();
      ctx.translate(760, 690);
      ctx.scale(-1, 1);
      drawLowPolyDog(ctx, 0, 0, 0.72, cCharacter, counterpartType);
      ctx.restore();
    }

    // 底部文案
    ctx.fillStyle = "#5f5d57";
    ctx.font = '500 40px "Noto Sans TC", sans-serif';
    ctx.textAlign = "center";
    wrapCenteredText(ctx, character.tagline, 540, 982, 720, 56);

    ctx.textAlign = "left";
    ctx.fillStyle = "#616059";
    ctx.font = '700 40px "Noto Sans TC", sans-serif';
    ctx.fillText("你的主類型：", 136, 1412);

    ctx.fillStyle = "#20211d";
    ctx.font = '700 72px "Space Grotesk", sans-serif';
    ctx.fillText(`${character.code}`, 136, 1510);

    ctx.font = '800 56px "Noto Sans TC", sans-serif';
    ctx.fillText(`（${dogType.replace("型", "")}）`, 392, 1510);

    ctx.fillStyle = "#66725f";
    ctx.font = '600 34px "Noto Sans TC", sans-serif';
    wrapText(ctx, `${relationshipModel} / ${syncRate}% / ${stabilityFlag}`, 136, 1586, 760, 44);

    ctx.fillStyle = "#7b7a72";
    ctx.font = '500 28px "IBM Plex Mono", monospace';
    wrapText(ctx, `${participants}  ·  ${verdict}`, 136, 1660, 780, 38);

    // --- 【Phase 3.1 視覺硬化：垂直標籤排列】 ---
    if (personalityMix && personalityMix.length > 0) {
      const startY = 210;
      const rightMargin = 920;

      // 小標題：混血傾向
      ctx.textAlign = "right";
      ctx.fillStyle = "#8a877f";
      ctx.font = '700 22px "Noto Sans TC", sans-serif';
      ctx.fillText("混血傾向", rightMargin, 176);

      // 嚴格限制 Top 3 排列
      personalityMix.slice(0, 3).forEach((item, i) => {
        const text = `${item.name} ${item.percentage}%`;
        ctx.font = '700 24px "Space Grotesk", sans-serif';
        const textWidth = ctx.measureText(text).width;
        const padding = 20;
        const pillWidth = textWidth + padding * 2;
        const pillHeight = 48;

        const currentY = startY + i * (pillHeight + 12);
        const currentX = rightMargin - pillWidth;

        // 畫背景 (Pill) - 右對齊垂直排列
        drawRoundedRect(ctx, currentX, currentY, pillWidth, pillHeight, pillHeight / 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
        ctx.fill();
        ctx.strokeStyle = `${item.color}44`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // 畫文字
        ctx.fillStyle = item.color;
        ctx.textAlign = "left";
        ctx.fillText(text, currentX + padding, currentY + 32);
      });
    }

    return canvas.toDataURL("image/png");
  }

  function downloadStoryCard() {
    if (!appState.lastResult || !ui.storyPreview?.src) {
      ui.statusBox.textContent = "目前沒有可下載的圖片。";
      return;
    }
    const link = document.createElement("a");
    link.href = ui.storyPreview.src;
    link.download = "soul-sync-story.png";
    link.click();
  }

  async function shareStoryCard() {
    if (!appState.lastResult || !navigator.share || !ui.storyPreview.src) {
      ui.statusBox.textContent = "目前環境不支援原生分享，請改用下載圖片。";
      return;
    }

    try {
      const response = await fetch(ui.storyPreview.src);
      const blob = await response.blob();
      const file = new File([blob], "soul-sync-story.png", { type: "image/png" });

      if (navigator.canShare && !navigator.canShare({ files: [file] })) {
        throw new Error("share-not-supported");
      }

      await navigator.share({
        title: "SOUL-SYNC 舔狗判定",
        text: `${appState.lastResult.metadata.dogType} / ${appState.lastResult.metadata.finalSyncRate}%`,
        files: [file],
      });
    } catch (error) {
      ui.statusBox.textContent =
        error.message === "share-not-supported"
          ? "這台裝置不能直接分享檔案，請先下載圖片。"
          : "分享未完成，你仍然可以先下載圖片。";
    }
  }

  function isQuietHours(timestamp) {
    const hour = timestamp.getHours();
    return hour >= QUIET_HOUR_START && hour < QUIET_HOUR_END;
  }


  function isQuestion(content) {
    const normalized = normalizeSemanticText(content);
    const tokens = semanticTokens(content);
    if (!normalized || normalized.startsWith("http")) {
      return false;
    }

    if (/(\?|？|嗎|要不要|有沒有|會不會|可不可以|能不能)/.test(content)) {
      return tokens.length >= 2;
    }

    return false;
  }

  function isIrrelevantReply(request, response) {
    const responseText = normalizeSemanticText(response.content);
    const requestTokens = semanticTokens(request.content);
    const responseTokens = semanticTokens(response.content);


    if (requestTokens.length < 3) return false;
    if (!responseText || !responseTokens.length) return true;

    if (/(可以|不行|有|沒有|好啊|不要|要|會|不會|今天不行|晚點|等等|明天|在忙|到了|還沒|醒了|睡著了|知道了|收到)/.test(responseText)) return false;

    if (responseTokens.length <= 3) return isLowSignalReply(response.content);

    const requestKeywords = extractKeywords(request.content);
    const responseKeywords = extractKeywords(response.content);
    const overlap = requestKeywords.filter((keyword) => responseKeywords.includes(keyword));

    if (overlap.length > 0) return false;

    if (/(今天|明天|晚點|等等|現在|剛剛|下班|到家|吃飯|開會|忙完|回家)/.test(responseText)) return false;

    return responseTokens.length <= 3 && isLowSignalReply(response.content);
  }

  function extractKeywords(content) {
    const tokens = semanticTokens(content).filter((token) => !isStopToken(token));
    return [...new Set(tokens)].slice(0, 8);
  }

  function semanticTokens(content) {
    return normalizeSemanticText(content).match(/[A-Za-z0-9_]{2,}|[\u4e00-\u9fff]/g) || [];
  }

  function normalizeSemanticText(content) {
    return content
      .replace(/https?:\/\/\S+/g, " ")
      .replace(/\[[^\]]+\]/g, " ")
      .replace(/\(emoji\)/gi, " ")
      .replace(/[^\p{L}\p{N}\s\u4e00-\u9fff]/gu, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function isLowSignalReply(content) {
    const normalized = normalizeSemanticText(content);
    if (!normalized) return true;

    const fillers = new Set(["嗯", "恩", "喔", "哦", "好", "對", "對啊", "是喔", "有哇", "真假", "原來", "還好", "還好欸", "哈哈", "哈哈哈", "lol", "ok", "okay", "摁", "欸"]);
    const meaningfulShortReplies = new Set(["可以", "不行", "有", "沒有", "在忙", "等等", "晚點", "明天", "今天不行", "等一下", "好啊", "不要", "要", "會", "不會", "到了", "快到了", "還沒", "醒了", "睡著了", "知道了", "收到", "下班了", "回家了"]);

    if (meaningfulShortReplies.has(normalized)) return false;

    return fillers.has(normalized);
  }

  function isStopToken(token) {
    return new Set([
      "我",
      "你",
      "他",
      "她",
      "的",
      "了",
      "嗎",
      "呢",
      "啊",
      "呀",
      "喔",
      "哦",
      "欸",
      "是",
      "有",
      "在",
      "就",
      "也",
      "都",
      "很",
      "還",
      "但",
      "那",
      "這",
    ]).has(token);
  }

  function average(values) {
    return values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
  }

  function median(values) {
    if (values.length === 0) return 1;
    const sorted = [...values].sort((a, b) => a - b);
    const half = Math.floor(sorted.length / 2);
    if (sorted.length % 2) return sorted[half];
    return (sorted[half - 1] + sorted[half]) / 2.0;
  }

  function buildFallbackZombieResult(speakers, messageCount) {
    const dogCharacter = DOG_CHARACTER_META["殭屍狗型"] || { accent: "#a9adb5", code: "NULL", accessory: "dead-signal", tagline: "連線已終止" };
    return {
      metadata: {
        participants: speakers,
        messageCount: messageCount,
        responsePairCount: 0,
        baselineMRTMinutes: 999,
        latencyScore: 0,
        payloadScore: 0,
        jitterMinutes: 0,
        stabilityFlag: "UNSTABLE",
        packetLossCount: 0,
        messageBalance: { [speakers[0]]: 1, [speakers[1] || "對方"]: 0 },
        confidence: { value: 99, label: "High" },
        impactDrivers: ["對方完全無回應", "終極單向輸出"],
        penalties: {
          ghosting: 14,
          doublePinging: 12,
          packetLoss: 0,
          total: 26,
          rawGhosting: 18,
          rawDoublePinging: 15,
          rawPacketLoss: 0,
        },
        finalSyncRate: 0,

        dogType: "殭屍狗型",
        dogCharacter: dogCharacter,
        counterpartType: "殭屍狗型",
        counterpartCharacter: dogCharacter,
        relationshipModel: "斷線關係",
        personalityMix: [],
      },
      mermaid: `graph LR\n    A(("${speakers[0]}")) -- "No Connection" --> B(("${speakers[1] || "對方"}"))`,
      verdict: "連線早就終止，你還在對著已關閉的埠口送出心跳包。目前模型判定為「斷線關係」，同步率 0%，總懲罰爆表。",
    };
  }

  function standardDeviation(values) {
    const mean = average(values);
    const variance =
      values.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
      Math.max(values.length, 1);
    return Math.sqrt(variance);
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function round(value) {
    return Math.round(value * 100) / 100;
  }

  function drawGlow(ctx, x, y, radius, color) {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawSoftCard(ctx, x, y, width, height) {
    ctx.save();
    ctx.fillStyle = "#f8fbf7";
    ctx.shadowColor = "rgba(112, 125, 108, 0.18)";
    ctx.shadowBlur = 36;
    ctx.shadowOffsetY = 14;
    roundRect(ctx, x, y, width, height, 40, true);
    ctx.shadowColor = "transparent";
    ctx.strokeStyle = "rgba(188, 202, 188, 0.7)";
    ctx.lineWidth = 3;
    roundRect(ctx, x, y, width, height, 40, false, true);
    ctx.restore();
  }

  function drawLowPolyDog(ctx, centerX, centerY, scale, character, dogType) {
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.scale(scale, scale);
    ctx.shadowColor = "rgba(95, 109, 96, 0.16)";
    ctx.shadowBlur = 22;
    ctx.shadowOffsetY = 18;

    ctx.fillStyle = "rgba(160, 170, 160, 0.18)";
    ellipse(ctx, 0, 240, 134, 24);
    ctx.fill();

    ctx.shadowColor = "transparent";

    if (dogType === "邊境牧羊犬型") {
      drawBorderCollieShape(ctx, character);
    } else if (dogType === "黃金獵犬型") {
      drawGoldenRetrieverShape(ctx, character);
    } else if (dogType === "貴賓狗型") {
      drawPoodleShape(ctx, character);
    } else if (dogType === "柴犬型") {
      drawShibaShape(ctx, character);
    } else if (dogType === "流浪狗型") {
      drawStrayShape(ctx, character);
    } else if (dogType === "警犬型") {
      drawWatchDogShape(ctx, character);
    } else if (dogType === "殭屍狗型") {
      drawZombieShape(ctx, character);
    } else if (dogType === "哈士奇型") {
      drawHuskyShape(ctx, character);
    } else if (dogType === "吉娃娃型") {
      drawChihuahuaShape(ctx, character);
    } else if (dogType === "哈比小狗型") {
      drawPuppyShape(ctx, character);
    } else if (dogType === "高冷黑貓型") {
      drawBlackCatShape(ctx, character);
    } else if (dogType === "佛系和尚狗型") {
      drawMonkDogShape(ctx, character);
    } else if (dogType === "狼系主宰型") {
      drawAlphaWolfShape(ctx, character);
    } else {
      drawBorderCollieShape(ctx, character);
    }

    drawAccessory(ctx, character.accessory, character.accent);
    ctx.restore();
  }

  function drawBorderCollieShape(ctx, character) {
    drawStandardBody(ctx, character, {
      body: [[-24, 18], [46, -26], [122, 48], [66, 130], [-12, 96]],
      head: [[40, -112], [120, -82], [132, 0], [62, 34], [-8, -10]],
      leftEar: [[-4, -84], [28, -162], [74, -98]],
      rightEar: [[78, -102], [126, -164], [144, -84]],
      snout: [[48, -74], [80, -38], [20, -28]],
      leftArm: [[-82, 18], [-28, -16], [-2, 36], [-56, 88]],
      rightArm: [[110, 38], [162, 8], [190, 56], [132, 102]],
      torsoLeftLeg: [[18, 120], [72, 118], [38, 212], [-4, 206]],
      torsoRightLeg: [[92, 116], [132, 136], [126, 224], [84, 212]],
      leftLeg: [[-26, 126], [0, 154], [-42, 222], [-76, 188]],
      rightLeg: [[152, 126], [188, 150], [170, 230], [132, 204]],
      tail: { moveTo: [128, 92], curveTo: [196, 118, 204, 166, 186, 198] },
    });
  }

  function drawGoldenRetrieverShape(ctx, character) {
    drawStandardBody(ctx, character, {
      body: [[-38, 10], [38, -32], [130, 26], [88, 126], [-6, 112]],
      head: [[34, -104], [108, -96], [142, -8], [72, 36], [-10, -6]],
      leftEar: [[-10, -64], [18, -144], [50, -14], [10, 14]],
      rightEar: [[102, -64], [142, -136], [152, -6], [112, 18]],
      snout: [[46, -64], [92, -34], [22, -14]],
      leftArm: [[-88, 24], [-32, -6], [2, 44], [-58, 100]],
      rightArm: [[118, 30], [176, 24], [210, 82], [136, 108]],
      torsoLeftLeg: [[18, 124], [70, 122], [42, 222], [-2, 214]],
      torsoRightLeg: [[96, 124], [142, 140], [150, 228], [104, 220]],
      leftLeg: [[-30, 130], [0, 156], [-24, 230], [-64, 206]],
      rightLeg: [[148, 136], [184, 158], [182, 240], [138, 222]],
      tail: { moveTo: [126, 102], curveTo: [220, 138, 222, 196, 174, 218] },
    });
    fillPoly(ctx, [[126, 98], [186, 122], [210, 162], [154, 150]], "#ead6b2");
  }

  function drawPoodleShape(ctx, character) {
    drawStandardBody(ctx, character, {
      body: [[-18, 28], [58, -8], [118, 42], [74, 120], [0, 104]],
      head: [[36, -94], [110, -74], [118, -8], [66, 26], [2, -10]],
      leftEar: [[14, -80], [28, -128], [50, -72]],
      rightEar: [[88, -74], [104, -126], [126, -62]],
      snout: [[50, -58], [78, -32], [28, -18]],
      leftArm: [[-74, 34], [-26, 4], [4, 48], [-46, 92]],
      rightArm: [[108, 44], [148, 18], [176, 58], [126, 96]],
      torsoLeftLeg: [[26, 114], [60, 114], [46, 196], [20, 196]],
      torsoRightLeg: [[86, 112], [118, 120], [116, 198], [88, 198]],
      leftLeg: [[-4, 118], [18, 150], [-4, 212], [-34, 184]],
      rightLeg: [[128, 120], [154, 144], [142, 210], [112, 192]],
      tail: { moveTo: [118, 88], curveTo: [162, 76, 190, 118, 180, 154] },
    });
    drawPoodleFluff(ctx, 20, -112, 28, character.patch);
    drawPoodleFluff(ctx, 114, -108, 26, character.patch);
    drawPoodleFluff(ctx, 64, -132, 38, character.body);
    drawPoodleFluff(ctx, 38, 206, 18, character.patch);
    drawPoodleFluff(ctx, 102, 206, 18, character.patch);
    drawPoodleFluff(ctx, -18, 194, 18, character.patch);
    drawPoodleFluff(ctx, 136, 194, 18, character.patch);
    drawPoodleCollar(ctx, character.accent);
  }

  function drawShibaShape(ctx, character) {
    drawStandardBody(ctx, character, {
      body: [[-34, 48], [22, 10], [104, 40], [74, 138], [-16, 128]],
      head: [[18, -98], [92, -88], [124, -6], [58, 42], [-8, 10]],
      leftEar: [[26, -86], [48, -154], [72, -82]],
      rightEar: [[82, -88], [106, -158], [132, -82]],
      snout: [[38, -42], [84, -18], [28, 10]],
      leftArm: [[-66, 56], [-24, 28], [0, 74], [-38, 106]],
      rightArm: [[92, 56], [132, 38], [144, 84], [100, 108]],
      torsoLeftLeg: [[10, 138], [44, 138], [32, 224], [6, 222]],
      torsoRightLeg: [[62, 138], [96, 140], [94, 222], [66, 222]],
      leftLeg: [[-20, 148], [4, 176], [-12, 234], [-44, 214]],
      rightLeg: [[100, 148], [128, 172], [118, 232], [88, 214]],
      tail: { moveTo: [110, 98], curveTo: [174, 58, 190, 118, 144, 144] },
      skipFace: true,
    });
    fillPoly(ctx, [[10, -34], [54, -14], [34, 20], [-2, 6]], "#fff9f2");
    fillPoly(ctx, [[52, -18], [100, 2], [76, 26], [34, 14]], "#fff9f2");
    fillPoly(ctx, [[26, 20], [72, 18], [58, 50], [20, 44]], "#fff9f2");
    ctx.strokeStyle = "#7d786f";
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(132, 104, 24, 0.35, Math.PI * 2.18);
    ctx.stroke();
    drawFace(ctx, {
      leftEye: [42, -18],
      rightEye: [78, -18],
      nose: [[50, 10], [60, 16], [70, 10]],
      mouth: [48, 28, 60, 36, 72, 28],
    });
  }

  function drawStrayShape(ctx, character) {
    drawStandardBody(ctx, character, {
      body: [[-44, 38], [10, -10], [92, 24], [54, 142], [-30, 116]],
      head: [[8, -116], [92, -92], [122, -8], [44, 34], [-24, -4]],
      leftEar: [[2, -92], [22, -166], [50, -86]],
      rightEar: [[72, -74], [134, -136], [108, -42]],
      snout: [[34, -62], [82, -34], [0, -14]],
      leftArm: [[-96, 46], [-52, 10], [-20, 62], [-72, 120]],
      rightArm: [[82, 52], [132, 26], [152, 92], [90, 116]],
      torsoLeftLeg: [[-4, 132], [34, 126], [12, 232], [-18, 220]],
      torsoRightLeg: [[58, 130], [96, 142], [90, 240], [54, 230]],
      leftLeg: [[-44, 138], [-18, 168], [-58, 236], [-94, 202]],
      rightLeg: [[104, 142], [138, 164], [126, 234], [94, 208]],
      tail: { moveTo: [86, 110], curveTo: [150, 136, 168, 204, 142, 246] },
      skipFace: true,
    });
    fillPoly(ctx, [[-6, -52], [34, -20], [-6, 16], [-36, -6]], character.patch);
    fillPoly(ctx, [[60, -18], [86, 4], [52, 28], [24, 4]], "#d8c6b6");
    drawFace(ctx, {
      leftEye: [26, -44],
      rightEye: [76, -34],
      nose: [[34, -10], [52, 2], [68, -10]],
      mouth: [36, 18, 48, 30, 64, 18],
    });
  }

  function drawWatchDogShape(ctx, character) {
    drawStandardBody(ctx, character, {
      body: [[-42, 26], [26, -34], [128, 12], [92, 136], [-18, 116]],
      head: [[22, -130], [116, -106], [156, -12], [84, 34], [-8, -8]],
      leftEar: [[28, -96], [54, -196], [88, -98]],
      rightEar: [[92, -102], [126, -200], [162, -88]],
      snout: [[60, -84], [122, -52], [26, -18]],
      leftArm: [[-94, 30], [-30, -14], [4, 40], [-52, 94]],
      rightArm: [[116, 28], [180, -10], [206, 50], [140, 96]],
      torsoLeftLeg: [[18, 132], [64, 124], [44, 238], [10, 232]],
      torsoRightLeg: [[90, 128], [138, 132], [132, 238], [96, 234]],
      leftLeg: [[-18, 138], [6, 166], [-8, 244], [-44, 222]],
      rightLeg: [[140, 138], [172, 160], [162, 238], [126, 214]],
      tail: { moveTo: [120, 100], curveTo: [180, 78, 214, 118, 192, 170] },
      skipFace: true,
    });
    fillPoly(ctx, [[20, -86], [120, -56], [96, 18], [22, -8]], character.patch);
    fillPoly(ctx, [[-12, 8], [30, -20], [70, 16], [22, 56]], "#e9dfcf");
    drawFace(ctx, {
      leftEye: [52, -52],
      rightEye: [102, -50],
      nose: [[64, -18], [82, -6], [100, -18]],
      mouth: [66, 8, 82, 18, 98, 8],
    });
  }

  function drawZombieShape(ctx, character) {
    drawStandardBody(ctx, character, {
      body: [[-40, 34], [20, -10], [94, 18], [58, 140], [-30, 126]],
      head: [[10, -120], [90, -94], [118, -4], [48, 30], [-22, -4]],
      leftEar: [[4, -90], [26, -154], [54, -84]],
      rightEar: [[72, -88], [104, -152], [114, -58]],
      snout: [[28, -66], [70, -38], [-2, -20]],
      leftArm: [[-104, 38], [-56, 18], [-34, 72], [-88, 132]],
      rightArm: [[82, 46], [120, 26], [134, 84], [92, 118]],
      torsoLeftLeg: [[-2, 136], [30, 134], [14, 242], [-14, 238]],
      torsoRightLeg: [[60, 134], [92, 140], [82, 236], [54, 234]],
      leftLeg: [[-46, 144], [-22, 176], [-56, 244], [-92, 214]],
      rightLeg: [[102, 146], [130, 170], [120, 240], [90, 216]],
      tail: { moveTo: [84, 112], curveTo: [126, 138, 138, 194, 122, 232] },
      skipFace: true,
    });
    ctx.fillStyle = "rgba(136, 141, 149, 0.16)";
    ctx.beginPath();
    ctx.arc(44, -10, 54, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#8f9298";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(18, -54);
    ctx.lineTo(42, -30);
    ctx.moveTo(42, -54);
    ctx.lineTo(18, -30);
    ctx.stroke();
    ctx.fillStyle = "#5b5e63";
    ctx.beginPath();
    ctx.arc(78, -40, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#6d7075";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(36, -8);
    ctx.lineTo(54, 0);
    ctx.lineTo(72, -8);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(34, 16);
    ctx.lineTo(74, 16);
    ctx.stroke();
  }

  function drawBlackCatShape(ctx, character) {
    drawStandardBody(ctx, character, {
      body: [[-10, 30], [40, 0], [90, 30], [60, 110], [-10, 90]],
      head: [[20, -90], [100, -90], [110, 0], [50, 30], [-10, 0]],
      leftEar: [[10, -90], [-30, -170], [50, -90]],
      rightEar: [[70, -90], [150, -160], [100, -80]],
      snout: [[50, -40], [80, -20], [40, -10]],
      leftArm: [[-60, 30], [-20, 10], [0, 60], [-40, 90]],
      rightArm: [[80, 20], [130, 30], [120, 80], [90, 70]],
      torsoLeftLeg: [[10, 100], [50, 90], [30, 200], [-10, 200]],
      torsoRightLeg: [[60, 90], [100, 100], [90, 200], [50, 200]],
      leftLeg: [[-20, 110], [10, 150], [-20, 210], [-50, 180]],
      rightLeg: [[100, 110], [130, 140], [120, 210], [80, 180]],
      tail: { moveTo: [80, 90], curveTo: [200, 10, 240, 200, 100, 230] },
      skipFace: true,
    });

    // Custom Cat Face
    ctx.fillStyle = "#fff5ab"; // yellow sleek cat eyes
    ctx.beginPath();
    ctx.ellipse(36, -44, 4, 10, -0.3, 0, Math.PI * 2);
    ctx.ellipse(86, -44, 4, 10, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#000"; // Pupils
    ctx.beginPath();
    ctx.ellipse(36, -44, 1.5, 8, -0.3, 0, Math.PI * 2);
    ctx.ellipse(86, -44, 1.5, 8, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Cat nose
    ctx.fillStyle = "#ff9eaa";
    ctx.beginPath();
    ctx.moveTo(56, -14);
    ctx.lineTo(66, -14);
    ctx.lineTo(61, -6);
    ctx.fill();
  }

  function drawMonkDogShape(ctx, character) {
    drawStandardBody(ctx, character, {
      body: [[-50, 40], [50, -20], [150, 40], [110, 150], [-30, 140]],
      head: [[0, -110], [130, -100], [150, 20], [60, 50], [-20, 10]],
      leftEar: [[-10, -70], [-50, -10], [0, 40]],
      rightEar: [[120, -70], [170, 0], [110, 50]],
      snout: [[40, -50], [90, -30], [20, -10]],
      leftArm: [[-70, 80], [-20, 50], [10, 110], [-50, 130]],
      rightArm: [[110, 50], [160, 80], [140, 130], [90, 110]],
      torsoLeftLeg: [[10, 130], [60, 130], [30, 210], [-10, 210]],
      torsoRightLeg: [[70, 130], [120, 140], [100, 210], [60, 210]],
      leftLeg: [[-40, 150], [0, 180], [-30, 230], [-70, 200]],
      rightLeg: [[130, 150], [170, 170], [140, 230], [100, 200]],
      tail: { moveTo: [110, 120], curveTo: [130, 130, 140, 150, 130, 160] },
      skipFace: true,
    });

    // Zen face (Closed eyes)
    ctx.strokeStyle = "#544f49";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(30, -40); ctx.quadraticCurveTo(45, -30, 60, -40); // Left closed eye
    ctx.moveTo(80, -40); ctx.quadraticCurveTo(95, -30, 110, -40); // Right closed eye
    ctx.stroke();

    // Wide nose
    ctx.beginPath();
    ctx.moveTo(60, -16); ctx.lineTo(70, -8); ctx.lineTo(80, -16);
    ctx.stroke();
  }

  function drawAlphaWolfShape(ctx, character) {
    drawStandardBody(ctx, character, {
      body: [[-30, 10], [50, -40], [140, 30], [80, 130], [-10, 110]],
      head: [[40, -120], [110, -90], [140, -10], [60, 40], [-10, -20]],
      leftEar: [[10, -90], [-20, -200], [60, -100]],
      rightEar: [[80, -100], [140, -200], [120, -80]],
      snout: [[60, -80], [120, -10], [20, -10]],
      leftArm: [[-80, 20], [-20, -10], [10, 50], [-50, 90]],
      rightArm: [[120, 30], [180, 0], [190, 60], [130, 100]],
      torsoLeftLeg: [[20, 120], [70, 110], [40, 210], [-10, 200]],
      torsoRightLeg: [[90, 110], [130, 140], [120, 220], [80, 210]],
      leftLeg: [[-20, 140], [10, 170], [-40, 220], [-70, 190]],
      rightLeg: [[140, 140], [170, 160], [150, 230], [120, 200]],
      tail: { moveTo: [110, 100], curveTo: [180, 110, 200, 180, 160, 230] },
      skipFace: true,
    });

    // Fierce Alpha Eyes
    ctx.fillStyle = "#ff6b4a"; // glowing alpha eyes
    ctx.beginPath();
    ctx.moveTo(34, -40); ctx.lineTo(44, -46); ctx.lineTo(54, -40); ctx.lineTo(44, -36); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(84, -40); ctx.lineTo(94, -46); ctx.lineTo(104, -40); ctx.lineTo(94, -36); ctx.fill();

    // Sharp nose and mouth
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(60, -10); ctx.lineTo(76, 0); ctx.lineTo(92, -10);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(66, 20); ctx.lineTo(76, 26); ctx.lineTo(86, 20);
    ctx.stroke();
  }

  function drawStandardBody(ctx, character, shape) {
    fillPoly(ctx, shape.body, character.body);
    fillPoly(ctx, shape.head, character.body);
    fillPoly(ctx, shape.leftEar, character.ear);
    fillPoly(ctx, shape.rightEar, character.ear);
    fillPoly(ctx, shape.snout, character.patch);
    fillPoly(ctx, shape.leftArm, character.body);
    fillPoly(ctx, shape.rightArm, character.body);
    fillPoly(ctx, shape.torsoLeftLeg, character.body);
    fillPoly(ctx, shape.torsoRightLeg, character.body);
    fillPoly(ctx, shape.leftLeg, character.body);
    fillPoly(ctx, shape.rightLeg, character.body);
    drawTail(ctx, shape.tail);
    if (!shape.skipFace) {
      drawFace(ctx, {
        leftEye: [44, -44],
        rightEye: [94, -40],
        nose: [[58, -16], [72, -8], [86, -16]],
        mouth: [54, 10, 70, 24, 86, 10],
      });
    }
  }

  function drawTail(ctx, tail) {
    ctx.strokeStyle = "#7d786f";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(tail.moveTo[0], tail.moveTo[1]);
    ctx.bezierCurveTo(tail.curveTo[0], tail.curveTo[1], tail.curveTo[2], tail.curveTo[3], tail.curveTo[4], tail.curveTo[5]);
    ctx.stroke();
  }

  function drawFace(ctx, face, skipEyes = false) {
    if (!skipEyes && face.leftEye && face.rightEye) {
      ctx.fillStyle = "#2c2926";
      ctx.beginPath();
      ctx.arc(face.leftEye[0], face.leftEye[1], 5.5, 0, Math.PI * 2);
      ctx.arc(face.rightEye[0], face.rightEye[1], 5.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = "#544f49";
    ctx.lineWidth = 4;
    if (face.nose) {
      ctx.beginPath();
      ctx.moveTo(face.nose[0][0], face.nose[0][1]);
      ctx.lineTo(face.nose[1][0], face.nose[1][1]);
      ctx.lineTo(face.nose[2][0], face.nose[2][1]);
      ctx.stroke();
    }

    if (face.mouth) {
      ctx.beginPath();
      ctx.moveTo(face.mouth[0], face.mouth[1]);
      ctx.quadraticCurveTo(face.mouth[2], face.mouth[3], face.mouth[4], face.mouth[5]);
      ctx.stroke();
    }
  }

  function drawAccessory(ctx, accessory, accent) {
    ctx.save();
    if (accessory === "heart-lamp") {
      fillPoly(ctx, [[-154, 40], [-108, -18], [-66, 36], [-82, 120], [-142, 118]], accent);
      fillPoly(ctx, [[-146, 22], [-126, -10], [-98, 22], [-122, 56]], "#f3d36b");
    } else if (accessory === "delay-bar") {
      ctx.fillStyle = accent;
      roundRect(ctx, -158, 96, 64, 18, 9, true);
      ctx.fillStyle = "#e8e5de";
      roundRect(ctx, -138, 100, 20, 10, 5, true);
    } else if (accessory === "notif-ring" || accessory === "notif-dot") {
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(-132, 58, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fffaf3";
      ctx.beginPath();
      ctx.arc(-132, 58, 8, 0, Math.PI * 2);
      ctx.fill();
    } else if (accessory === "shield-tag" || accessory === "scan-beam") {
      fillPoly(ctx, [[-168, 16], [-88, -18], [-86, 52], [-162, 82]], "rgba(210, 166, 78, 0.28)");
      ctx.fillStyle = accent;
      roundRect(ctx, -146, 20, 54, 18, 9, true);
    } else if (accessory === "dead-signal" || accessory === "offline") {
      ctx.strokeStyle = accent;
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(-154, 8);
      ctx.lineTo(-98, 64);
      ctx.moveTo(-98, 8);
      ctx.lineTo(-154, 64);
      ctx.stroke();
    } else if (accessory === "badge") {
      ctx.fillStyle = accent;
      roundRect(ctx, -154, 34, 86, 72, 20, true);
      ctx.fillStyle = "#fff7ef";
      ctx.font = '700 22px "Space Grotesk", sans-serif';
      ctx.fillText("VIP", -135, 78);
    } else {
      ctx.strokeStyle = accent;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(-132, 56, 34, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(-132, 56, 18, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawPoodleFluff(ctx, x, y, radius, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.arc(x - radius * 0.7, y + radius * 0.2, radius * 0.75, 0, Math.PI * 2);
    ctx.arc(x + radius * 0.72, y + radius * 0.12, radius * 0.68, 0, Math.PI * 2);
    ctx.arc(x, y + radius * 0.65, radius * 0.78, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawPoodleCollar(ctx, accent) {
    ctx.save();
    ctx.fillStyle = accent;
    roundRect(ctx, 18, 12, 92, 18, 9, true);
    ctx.fillStyle = "#fff8f1";
    ctx.beginPath();
    ctx.arc(104, 21, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function fillPoly(ctx, points, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let index = 1; index < points.length; index += 1) {
      ctx.lineTo(points[index][0], points[index][1]);
    }
    ctx.closePath();
    ctx.fill();
  }

  function ellipse(ctx, x, y, radiusX, radiusY) {
    ctx.beginPath();
    ctx.ellipse(x, y, radiusX, radiusY, 0, 0, Math.PI * 2);
  }

  function drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  function wrapCenteredText(ctx, text, x, y, maxWidth, lineHeight) {
    const chars = [...text];
    let line = "";
    let cursorY = y;
    for (const char of chars) {
      const testLine = line + char;
      if (ctx.measureText(testLine).width > maxWidth && line) {
        ctx.fillText(line, x, cursorY);
        line = char;
        cursorY += lineHeight;
      } else {
        line = testLine;
      }
    }
    if (line) {
      ctx.fillText(line, x, cursorY);
    }
  }

  function drawGrid(ctx, width, height) {
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= width; x += 54) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += 54) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const chars = [...text];
    let line = "";
    let cursorY = y;

    for (const char of chars) {
      const testLine = line + char;
      if (ctx.measureText(testLine).width > maxWidth && line) {
        ctx.fillText(line, x, cursorY);
        line = char;
        cursorY += lineHeight;
      } else {
        line = testLine;
      }
    }

    if (line) {
      ctx.fillText(line, x, cursorY);
    }
  }

  function roundRect(ctx, x, y, width, height, radius, fill, stroke = false) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    if (fill) {
      ctx.fill();
    }
    if (stroke) {
      ctx.stroke();
    }
  }

  function createDogPreviewData(dogType, overrides = {}) {
    const dogCharacter = DOG_CHARACTER_META[dogType];
    return {
      syncRate: overrides.syncRate ?? 72,
      dogType,
      dogCharacter,
      relationshipModel: overrides.relationshipModel ?? "人格樣本",
      verdict: overrides.verdict ?? dogCharacter.tagline,
      participants: overrides.participants ?? "Node A × Node B",
      stabilityFlag: overrides.stabilityFlag ?? "STABLE",
    };
  }

  function renderDogCardToCanvas(canvas, options) {
    const ctx = canvas.getContext("2d");
    renderStoryCanvas({
      ...options,
      __canvas: canvas,
      __ctx: ctx,
    });
  }

  function drawHuskyShape(ctx, character) {
    drawStandardBody(ctx, character, {
      body: [[-38, 26], [42, -18], [128, 42], [76, 126], [-10, 112]],
      head: [[32, -120], [118, -98], [148, -4], [68, 42], [-14, -6]],
      leftEar: [[12, -102], [32, -186], [78, -108]],
      rightEar: [[86, -112], [134, -188], [158, -102]],
      snout: [[48, -78], [96, -38], [14, -22]],
      leftArm: [[-94, 30], [-34, -8], [2, 44], [-64, 102]],
      rightArm: [[118, 38], [178, 18], [202, 76], [132, 108]],
      torsoLeftLeg: [[14, 124], [68, 122], [42, 218], [-4, 212]],
      torsoRightLeg: [[92, 122], [138, 138], [132, 222], [96, 218]],
      leftLeg: [[-30, 132], [4, 160], [-18, 232], [-54, 210]],
      rightLeg: [[142, 136], [178, 164], [168, 234], [128, 212]],
      tail: { moveTo: [116, 102], curveTo: [192, 118, 210, 154, 182, 198] },
      skipFace: true,
    });
    // Husky mask (The Three-Flame / 三火)
    fillPoly(ctx, [[32, -114], [52, -138], [72, -114], [92, -138], [112, -114], [72, -34]], character.patch);
    fillPoly(ctx, [[42, -88], [102, -88], [72, -42]], "#ffffff");
    drawFace(ctx, {
      leftEye: [48, -58],
      rightEye: [96, -58],
      nose: [[62, -28], [72, -22], [82, -28]],
      mouth: [58, -8, 72, 0, 86, -8],
    });
  }

  function drawChihuahuaShape(ctx, character) {
    drawStandardBody(ctx, character, {
      body: [[-22, 54], [34, 34], [94, 58], [68, 122], [-8, 118]],
      head: [[14, -72], [98, -72], [108, 18], [56, 54], [2, 18]],
      leftEar: [[-14, -58], [-42, -164], [48, -78]],
      rightEar: [[64, -74], [154, -158], [126, -58]],
      snout: [[44, 2], [68, 18], [20, 34]],
      leftArm: [[-56, 62], [-24, 44], [4, 78], [-32, 108]],
      rightArm: [[88, 62], [122, 52], [132, 88], [94, 112]],
      torsoLeftLeg: [[16, 118], [42, 118], [34, 188], [18, 188]],
      torsoRightLeg: [[62, 118], [88, 118], [88, 188], [66, 188]],
      leftLeg: [[-4, 122], [10, 142], [-2, 196], [-28, 182]],
      rightLeg: [[98, 124], [118, 140], [108, 194], [86, 184]],
      tail: { moveTo: [92, 98], curveTo: [122, 88, 142, 112, 134, 142] },
      skipFace: true,
    });

    // Huge bulging eyes (Yappy style)
    ctx.save();
    ctx.fillStyle = "#20211d";
    ctx.beginPath();
    ctx.arc(32, -8, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(80, -8, 18, 0, Math.PI * 2);
    ctx.fill();

    // White iris/catchlights
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(38, -14, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(86, -14, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    drawFace(ctx, {
      nose: [[48, 24], [56, 30], [64, 24]],
      mouth: [46, 38, 56, 46, 66, 38],
    }, true);
  }

  function drawPuppyShape(ctx, character) {
    drawStandardBody(ctx, character, {
      body: [[-18, 38], [42, 8], [98, 38], [58, 118], [-8, 98]],
      head: [[32, -82], [112, -82], [118, -12], [68, 32], [18, -12]],
      leftEar: [[18, -72], [2, -132], [58, -72]],
      rightEar: [[88, -72], [132, -128], [108, -58]],
      snout: [[58, -42], [88, -22], [38, -12]],
      leftArm: [[-72, 48], [-22, 18], [8, 58], [-42, 108]],
      rightArm: [[108, 48], [148, 28], [178, 68], [128, 108]],
      torsoLeftLeg: [[28, 118], [58, 118], [42, 202], [18, 202]],
      torsoRightLeg: [[88, 118], [118, 128], [112, 208], [82, 208]],
      leftLeg: [[-2, 128], [22, 148], [8, 218], [-22, 198]],
      rightLeg: [[128, 128], [158, 148], [148, 222], [118, 198]],
      tail: { moveTo: [112, 98], curveTo: [172, 88, 198, 138, 188, 178] },
    });
  }

  window.SoulSyncRenderer = {
    DOG_CHARACTER_META,
    createDogPreviewData,
    renderDogCardToCanvas,
  };


  if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initApp);
    } else {
      initApp();
    }
  }
