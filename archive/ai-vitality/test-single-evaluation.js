import vm from 'vm';

// We want to test what a backtick template literal containing candidate strings evaluates to.
// In the worker.js, we have:
// var CHAT_HTML = `... <script> ... <candidate_string> ... </script> ... `;

// Let's define the candidate strings EXACTLY as they would be written inside backticks in worker.js.
// We use a helper function that evaluates a backtick template literal containing the candidate.
function evaluateBacktick(candidate) {
  // Since we are inside a JS script, we can construct the backtick string dynamically
  // and run eval() on it to get the evaluated result (which is what the browser receives).
  return eval("`" + candidate.replace(/`/g, '\\`').replace(/\${/g, '\\${') + "`");
}

const candidates = [
  {
    name: "Candidate A (current in worker.js)",
    raw: `onclick="applyCopilotCode(this, \\\\\\\\'\\\\' + uniqId + \\\\\\\\'\\\\')"`
  },
  {
    name: "Candidate B (double backslashes inside worker.js backticks)",
    raw: `onclick="applyCopilotCode(this, \\\\'' + uniqId + \\\\'\')"`
  },
  {
    name: "Candidate C (triple backslashes inside worker.js backticks)",
    raw: `onclick="applyCopilotCode(this, \\\\\\'' + uniqId + \\\\\\'\')"`
  },
  {
    name: "Candidate D (using four backslashes inside worker.js backticks)",
    raw: `onclick="applyCopilotCode(this, \\\\\\\\'' + uniqId + \\\\\\\\'\')"`
  }
];

candidates.forEach(c => {
  try {
    const evaluated = evaluateBacktick(c.raw);
    console.log(`\n=== ${c.name} ===`);
    console.log("What the browser receives inside the script tag:");
    console.log(evaluated);
    
    // Now let's try to parse this evaluated string as part of a browser-side JS function block
    // i.e., return '<button ' + evaluated + '>Click</button>';
    const browserCode = `function test() { var uniqId = 'code_123'; return '<button ' + ${JSON.stringify(evaluated)} + '>Click</button>'; }`;
    new vm.Script(browserCode);
    console.log("VERDICT: SUCCESS! Valid browser JS syntax.");
  } catch (err) {
    console.log("VERDICT: FAILED!", err.message);
  }
});
