// t.me / telegram.me → 目标 Telegram 客户端深链
// 客户端名由模块参数注入：argument="{{{CLIENT}}}" → 脚本内读 $argument
// 深链参数名以 https://core.telegram.org/api/links 为准

const NAMES = {
  telegram: "",
  nagram: "tg",
  swiftgram: "sg",
  turrit: "turrit",
  ime: "ime",
  nicegram: "ng",
  lingogram: "lingo",
};

const LIST = Object.keys(NAMES);

// 参数值 → scheme。返回 "" 表示放行不跳转。
// 顺序：精确客户端名 → 唯一前缀简写 → 有歧义按 Nagram → 形如 scheme 就照用 → 兜底 tg
function resolve(raw) {
  const key = raw.toLowerCase();
  if (NAMES[key] !== undefined) return NAMES[key];
  const hit = LIST.filter((n) => n.indexOf(key) === 0);
  if (hit.length === 1) return NAMES[hit[0]];
  if (hit.length > 1) return NAMES.nagram;
  return /^[a-z][a-z0-9+.-]*$/.test(key) ? key : NAMES.nagram;
}

function queryValue(qs, key) {
  const m = qs.match(new RegExp("(?:^|&)" + key + "=([^&]*)"));
  return m ? decodeURIComponent(m[1]) : "";
}

function deeplink(scheme, path, qs) {
  const p = path.split("/").filter(Boolean);
  const e = encodeURIComponent;
  if (!p[0]) return "";
  if (p[0][0] === "+") return scheme + "://join?invite=" + e(p[0].slice(1));
  if (p[0] === "joinchat" && p[1]) return scheme + "://join?invite=" + e(p[1]);
  if (p[0] === "addstickers" && p[1]) return scheme + "://addstickers?set=" + e(p[1]);
  if (p[0] === "share" && p[1] === "url")
    return scheme + "://msg_url?url=" + e(queryValue(qs, "url")) + "&text=" + e(queryValue(qs, "text"));
  if (p[1] && /^\d+$/.test(p[1]))
    return scheme + "://resolve?domain=" + e(p[0]) + "&post=" + e(p[1]);
  return scheme + "://resolve?domain=" + e(p[0]);
}

function run() {
  const m = $request.url.match(/^https?:\/\/(?:t\.me|telegram\.me)\/(.+)$/i);
  if (!m) return {};

  const raw = (typeof $argument === "string" ? $argument : "").replace(/^"+|"+$/g, "").trim();
  if (!raw) return {};

  const scheme = resolve(raw);
  if (!scheme) return {};

  let tail = m[1];
  if (tail.indexOf("s/") === 0) tail = tail.slice(2);
  const qi = tail.indexOf("?");
  const loc = deeplink(scheme, qi < 0 ? tail : tail.slice(0, qi), qi < 0 ? "" : tail.slice(qi + 1));
  if (!loc) return {};

  return {
    response: {
      status: 302,
      headers: { Location: loc, "Cache-Control": "no-store, no-cache" },
      body: "",
    },
  };
}

$done(run());
