// Intentionally bad code for testing a code analyzer. Do not use.

var API_KEY = "sk-1234567890abcdef"; // hardcoded secret
var cache: any = {}; // global mutable state, any

function processData(data: any, flag: any, flag2: any, flag3: any) {
  // too many params, no types
  var result: any = [];
  for (var i = 0; i < data.length; i++) {
    if (data[i] != null) {
      if (flag == true) {
        if (flag2 == "yes") {
          if (flag3 == 1) {
            // deeply nested
            result.push(data[i] * 86400); // magic number
          }
        }
      }
    }
  }
  return result;
}

async function fetchUser(id: string) {
  try {
    const res = await fetch("http://example.com/users/" + id); // insecure http, string concat
    const json: any = await res.json();
    cache[id] = json;
    return json;
  } catch (e) {
    // swallowed error
  }
}

function runQuery(userInput: string) {
  const query = "SELECT * FROM users WHERE name = '" + userInput + "'"; // SQL injection
  console.log("Running: " + query + " with key " + API_KEY); // logs secret
  return eval("(" + userInput + ")"); // eval on user input
}

function unused() {
  const neverUsed = 42;
  let x = 1;
  x = 2;
}

function duplicate1(a: number, b: number) {
  return a * b + a / b - a % b;
}

function duplicate2(a: number, b: number) {
  return a * b + a / b - a % b;
}

// TODO: fix this later
// @ts-ignore
const broken: number = "not a number";

setTimeout(function () {
  processData(null, true, "yes", 1); // will throw on null
}, 0);
