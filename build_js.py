#!/usr/bin/env python3
"""
Soul-Sync JS Build & Test Runner
用於生成並執行測試腳本，驗證分析引擎邏輯。
"""

import re
from typing import List

def build_test_runner(source_path: str, output_path: str) -> bool:
    """
    讀取原始 JS 檔案，移除瀏覽器 DOM 操作後，附加測試執行邏輯。
    """
    try:
        with open(source_path, 'r', encoding='utf-8') as f:
            js_code = f.read()

        # 移除 DOM 相關操作以利於 Node.js 執行
        js_code = re.sub(r'document\.querySelector\([^)]*\)', '({})', js_code)
        js_code = re.sub(r'document\.addEventListener\([^)]*\)', '', js_code)
        js_code = re.sub(r'window\.setTimeout\([^)]*\)', '', js_code)
        js_code = re.sub(r'if\s*\(document\.readyState.*', 'if(false) {', js_code)

        runner_logic = """
function main() {
    console.log("Starting Soul-Sync logic verification...");
    const demos = Object.keys(DEMO_LIBRARY).filter(k => k !== 'default');
    for (const key of demos) {
        const text = DEMO_LIBRARY[key].text;
        const messages = parseLineChat(text);
        if (!messages.length) continue;

        const result = analyzeMessages(messages);
        const metadata = result.metadata;

        console.log(`----- ${key} -----`);
        console.log(`Relationship: ${metadata.relationshipModel}`);
        console.log(`Subject (${metadata.participants[0]}): ${metadata.dogType} (${metadata.finalSyncRate}%)`);
        console.log(`Impact Factors: ${metadata.impactDrivers.join(", ")}`);
    }
}
main();
"""

        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(js_code + '\n\n' + runner_logic)

        return True
    except Exception as e:
        print(f"Build failed: {e}")
        return False

if __name__ == "__main__":
    build_test_runner('/Users/chenpeijun/Desktop/舔狗類型/app.js', '/Users/chenpeijun/Desktop/舔狗類型/run_temp.js')
