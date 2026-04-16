import re

with open('/Users/chenpeijun/Desktop/舔狗類型/app.js', 'r') as f:
    js_code = f.read()

# Strip DOM stuff
js_code = re.sub(r'document\.querySelector\([^)]*\)', '({})', js_code)
js_code = re.sub(r'document\.addEventListener\([^)]*\)', '', js_code)
js_code = re.sub(r'window\.setTimeout\([^)]*\)', '', js_code)
js_code = re.sub(r'if\s*\(document\.readyState.*', 'if(false) {', js_code)

runner_code = """
function main() {
  const demos = Object.keys(DEMO_LIBRARY).filter(k => k !== 'default');
  for (const key of demos) {
    const text = DEMO_LIBRARY[key].text;
    const messages = parseLineChat(text);
    const speakers = [...new Set(messages.map((m) => m.speaker))];
    const speakerA = speakers[0];
    const speakerB = speakers[1];
    
    appState.subjectSpeaker = speakerA;
    appState.file = null;
    
    // Simulate what standard path does
    const inputForClassification = {
        messages: messages,
        relationshipModel: "間歇性強化", // Dummy, will be overwritten
        syncRate: 50,
        avgLatencyScore: 0.5,
        avgPayloadScore: 0.5,
        doublePingPenalty: 0,
        stabilityFlag: "STABLE",
        anxietySignal: false,
        ghostingPenalty: 0,
        rawGhostingPenalty: 0,
        initiationBias: computeInitiationBias(messages, speakerA, speakerB),
        messageBalance: computeMessageBalance(messages, speakerA, speakerB),
    };
    
    const relationshipModel = classifyRelationship(inputForClassification);
    inputForClassification.relationshipModel = relationshipModel;
    
    const dogTypeA = classifyDogType(inputForClassification, speakerA);
    const dogTypeB = classifyDogType(inputForClassification, speakerB);
    
    console.log("----- " + key + " -----");
    console.log("Relationship:", relationshipModel);
    console.log(speakerA + " => " + dogTypeA);
    console.log(speakerB + " => " + dogTypeB);
  }
}
main();
"""

with open('/Users/chenpeijun/Desktop/舔狗類型/run_temp.js', 'w') as f:
    f.write(js_code + '\n\n' + runner_code)
