const GameState = {
  players: [],
  phase: "setup", // setup | theme | play | summary | result
  themes: {},
  currentCategory: "",
  theme: "",
  lastTheme: "",
  currentIndex: 0,
  predictions: {},
  votes: {}
};

const screen = document.getElementById("screen");

/* =======================
   初期化
======================= */

async function init() {
  loadPlayers();
  await loadThemes();
  GameState.currentCategory = "すべて（オトナ以外）";
  render();
}

async function loadThemes() {
  const res = await fetch("themes.json");
  const data = await res.json();

  const allExceptAdult = [];
  const allIncludingAdult = [];

  Object.keys(data).forEach(cat => {
    if (cat !== "オトナ") {
      allExceptAdult.push(...data[cat]);
    }
    allIncludingAdult.push(...data[cat]);
  });

  data["すべて（オトナ以外）"] = allExceptAdult;
  data["すべて（オトナ含む）"] = allIncludingAdult;

  GameState.themes = data;
}

function savePlayers() {
  localStorage.setItem("players", JSON.stringify(GameState.players));
}

function loadPlayers() {
  const saved = localStorage.getItem("players");
  if (saved) GameState.players = JSON.parse(saved);
}

/* =======================
   共通描画
======================= */

function render() {
  screen.innerHTML = "";

  if (GameState.phase === "setup") renderSetup();
  if (GameState.phase === "theme") renderTheme();
  if (GameState.phase === "play") renderPlay();
  if (GameState.phase === "summary") renderSummary();
  if (GameState.phase === "result") renderResult();
}

/* =======================
   SETUP
======================= */

function renderSetup() {
  const title = document.createElement("h1");
  title.textContent = "プレイヤー登録";
  screen.appendChild(title);

  const row = document.createElement("div");
  row.className = "add-row";

  const input = document.createElement("input");
  input.placeholder = "名前を入力";

  const addBtn = document.createElement("button");
  addBtn.textContent = "追加";
  addBtn.className = "primary";

  function addPlayer() {
    const name = input.value.trim();
    if (!name) return;
    GameState.players.push(name);
    savePlayers();
    input.value = "";
    render();
  }

  addBtn.onclick = addPlayer;
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") addPlayer();
  });

  row.appendChild(input);
  row.appendChild(addBtn);
  screen.appendChild(row);

  GameState.players.forEach((name, i) => {
    const div = document.createElement("div");
    div.className = "player-row";

    const span = document.createElement("span");
    span.textContent = name;

    const del = document.createElement("button");
    del.textContent = "削除";
    del.className = "secondary";
    del.onclick = () => {
      GameState.players.splice(i, 1);
      savePlayers();
      render();
    };

    div.appendChild(span);
    div.appendChild(del);
    screen.appendChild(div);
  });

  if (GameState.players.length >= 3) {
    const btn = document.createElement("button");
    btn.textContent = "お題へ";
    btn.className = "primary footer-btn";
    btn.onclick = () => {
      GameState.phase = "theme";
      setRandomTheme();
      render();
    };
    screen.appendChild(btn);
  }
}

/* =======================
   THEME
======================= */

function renderTheme() {
  const back = document.createElement("button");
  back.textContent = "トップ";
  back.className = "secondary top-right";
  back.onclick = () => {
    GameState.phase = "setup";
    render();
  };
  screen.appendChild(back);

  const title = document.createElement("h1");
  title.textContent = "お題";
  screen.appendChild(title);

  const select = document.createElement("select");

  Object.keys(GameState.themes).forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    select.appendChild(option);
  });

  select.value = GameState.currentCategory;

  select.onchange = () => {
    GameState.currentCategory = select.value;
    setRandomTheme();
    render();
  };

  screen.appendChild(select);

  const card = document.createElement("div");
  card.className = "theme-card";
  card.textContent = GameState.theme;
  screen.appendChild(card);

  const changeBtn = document.createElement("button");
  changeBtn.textContent = "お題変更";
  changeBtn.className = "secondary center-btn";
  changeBtn.onclick = () => {
    setRandomTheme();
    render();
  };
  screen.appendChild(changeBtn);

  const startBtn = document.createElement("button");
  startBtn.textContent = "開始";
  startBtn.className = "primary start-btn";
  startBtn.onclick = startRound;
  screen.appendChild(startBtn);
}

function setRandomTheme() {
  const list = GameState.themes[GameState.currentCategory];
  if (!list || list.length === 0) return;

  let newTheme;

  if (list.length === 1) {
    newTheme = list[0];
  } else {
    do {
      newTheme = list[Math.floor(Math.random() * list.length)];
    } while (newTheme === GameState.lastTheme);
  }

  GameState.theme = newTheme;
  GameState.lastTheme = newTheme;
}

/* =======================
   PLAY
======================= */

function startRound() {
  GameState.currentIndex = 0;
  GameState.predictions = {};
  GameState.votes = {};
  GameState.phase = "play";
  render();
}

function renderPlay() {
  const player = GameState.players[GameState.currentIndex];

  const theme = document.createElement("div");
  theme.className = "theme-card";
  theme.textContent = GameState.theme;
  screen.appendChild(theme);

  const turn = document.createElement("div");
  turn.className = "player-turn";
  turn.textContent = player + " さんのターンです";
  screen.appendChild(turn);

  const label1 = document.createElement("label");
  label1.textContent = "何人から投票されそう？";
  screen.appendChild(label1);

  let prediction = 0;
  let selectedVote = null;

  const counter = document.createElement("div");
  counter.className = "counter";

  const minus = document.createElement("button");
  minus.textContent = "−";
  minus.className = "minus";

  const num = document.createElement("div");
  num.textContent = prediction;

  const plus = document.createElement("button");
  plus.textContent = "+";
  plus.className = "plus";

  minus.onclick = () => {
    if (prediction > 0) prediction--;
    num.textContent = prediction;
  };

  plus.onclick = () => {
    if (prediction < GameState.players.length - 1) prediction++;
    num.textContent = prediction;
  };

  counter.appendChild(minus);
  counter.appendChild(num);
  counter.appendChild(plus);
  screen.appendChild(counter);

  const label2 = document.createElement("label");
  label2.textContent = "だれに投票する？";
  screen.appendChild(label2);

  const grid = document.createElement("div");
  grid.className = "vote-grid";

  const nextBtn = document.createElement("button");
  nextBtn.textContent = "次へ";
  nextBtn.className = "primary footer-btn";
  nextBtn.disabled = true;

  GameState.players.forEach(p => {
    if (p === player) return;

    const btn = document.createElement("button");
    btn.textContent = p;
    btn.className = "vote-btn";

    btn.onclick = () => {
      selectedVote = p;
      document.querySelectorAll(".vote-btn")
        .forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      nextBtn.disabled = false;
    };

    grid.appendChild(btn);
  });

  screen.appendChild(grid);

  nextBtn.onclick = () => {
    if (!selectedVote) return;

    GameState.predictions[player] = prediction;
    GameState.votes[selectedVote] =
      (GameState.votes[selectedVote] || 0) + 1;

    GameState.currentIndex++;

    if (GameState.currentIndex >= GameState.players.length) {
      GameState.phase = "summary";
    }

    render();
  };

  screen.appendChild(nextBtn);
}

/* =======================
   SUMMARY
======================= */

function renderSummary() {
  const wrapper = document.createElement("div");
  wrapper.className = "summary-screen";

  const title = document.createElement("h1");
  title.textContent = "集計完了";
  wrapper.appendChild(title);

  const btn = document.createElement("button");
  btn.textContent = "結果を見る";
  btn.className = "primary footer-btn";
  btn.onclick = () => {
    GameState.phase = "result";
    render();
  };

  wrapper.appendChild(btn);
  screen.appendChild(wrapper);
}

/* =======================
   RESULT
======================= */

function renderResult() {
  const results = GameState.players.map(p => {
    const actual = GameState.votes[p] || 0;
    const predicted = GameState.predictions[p] || 0;
    const error = Math.abs(actual - predicted);
    return { name: p, actual, predicted, error };
  });

  /* ===== 投票数ランキング（票数のみ） ===== */
  const voteRank = [...results].sort((a, b) => b.actual - a.actual);

  const title = document.createElement("h2");
  title.textContent = "結果";
  screen.appendChild(title);

  const voteSection = document.createElement("div");
  voteSection.className = "result-section";

  const vTitle = document.createElement("h3");
  vTitle.textContent = "投票数ランキング";
  voteSection.appendChild(vTitle);

  voteRank.forEach((r, index) => {
    const div = document.createElement("div");
    div.className = "result-card";
    div.textContent = `${index + 1}位　${r.name}：${r.actual}票`;
    voteSection.appendChild(div);
  });

  screen.appendChild(voteSection);

  /* ===== 誤差ランキング（多い順・飛ばし順位） ===== */
  const errorRank = [...results].sort((a, b) => b.error - a.error);

  const errorSection = document.createElement("div");
  errorSection.className = "result-section";

  const eTitle = document.createElement("h3");
  eTitle.textContent = "誤差ランキング";
  errorSection.appendChild(eTitle);

  let currentRank = 0;
  let lastError = null;

  errorRank.forEach((r, index) => {
    if (r.error !== lastError) {
      currentRank = index + 1;
      lastError = r.error;
    }

    const row = document.createElement("div");
    row.className = "error-row";

    const rank = document.createElement("div");
    rank.className = "rank";
    rank.textContent = `${currentRank}位`;

    const name = document.createElement("div");
    name.className = "error-name";
    name.textContent = r.name;

    const value = document.createElement("div");
    value.className = "error-value";
    value.textContent = `誤差 ${r.error}`;

    row.appendChild(rank);
    row.appendChild(name);
    row.appendChild(value);

    errorSection.appendChild(row);
  });

  screen.appendChild(errorSection);

  const btn = document.createElement("button");
  btn.textContent = "お題へ戻る";
  btn.className = "primary footer-btn";
  btn.onclick = () => {
    GameState.phase = "theme";
    setRandomTheme();
    render();
  };

  screen.appendChild(btn);
}

init();
