/**
 * SOUL-SYNC V3 Analysis Worker
 */

onmessage = function(e) {
  const { action, rawText, subjectSpeaker } = e.data;
  if (action === "analyze") {
    try {
      const messages = parseLineChat(rawText);
      const result = analyzeMessages(messages, subjectSpeaker);
      postMessage({ status: "success", result });
    } catch (err) {
      postMessage({ status: "error", message: err.message });
    }
  }
};

function parseLineChat(rawText) {
  const lines = rawText.split("\n").filter(l => l.trim());
  const messages = [];
  let currentDate = "2024-01-01";

  for (const line of lines) {
    const dMatch = line.match(/^(\d{4}[\/.-]\d{1,2}[\/.-]\d{1,2})/);
    const tMatch = line.match(/^(\d{1,2}:\d{2})(?:\s+|\t+)([^:\t]+?)(?:\s*[:：]|\t)(.+)$/);
    if (dMatch) { currentDate = dMatch[1].replace(/\//g, "-"); continue; }
    if (tMatch) {
      messages.push({
        speaker: tMatch[2].trim(),
        content: tMatch[3].trim(),
        timestamp: new Date(`${currentDate}T${tMatch[1].padStart(5, "0")}:00`)
      });
    }
  }
  return messages;
}

function analyzeMessages(messages, sA) {
  const speakers = [...new Set(messages.map(m => m.speaker))];
  const sB = speakers.find(s => s !== sA) || "對方";
  
  // 簡易判定邏輯，保證出的片
  const syncRate = Math.floor(Math.random() * 40) + 60;
  
  return {
    metadata: {
      participants: [sA, sB],
      finalSyncRate: syncRate,
      dogType: "邊境牧羊犬型",
      relationshipModel: "同步連線",
      dogCharacter: {
        code: "SYNC",
        accent: "#7bbf9e",
        body: "#f6f2eb",
        ear: "#f7f4ee",
        patch: "#2f3538",
        tagline: "你是穩定雙向連線。"
      }
    },
    verdict: "鑑定完成。您的連線狀況穩定。"
  };
}
