const GameState = {
  players: [],
  phase: "setup", // setup | theme | play | result
  themes: {},
  currentCategory: "",
  theme: "",
  lastTheme: "",
  currentIndex: 0,
  predictions: {},
  votes: {}
};

const screen = document.getElementById("screen");

/* =========================
   初期化
========================= */

async function init() {
  await loadThemes();
  GameState.currentCategory = Object.keys(GameState.themes)[0];
  render();
}

async function loadThemes() {
  const res = await fetch("themes.json");
  GameState.themes = await res.json();
}

/* =========================
   共通描画
========================= */

function render() {
  screen.innerHTML = "";

  if (GameState.phase === "setup") renderSetup();
  if (GameState.phase === "theme") renderTheme();
  if (GameState.phase === "play") renderPlay();
  if (GameState.phase === "result") renderResult();
}

/* =========================
   SETUP
========================= */

function renderSetup() {
  const title = document.createElement("h1");
  title.textContent = "プレイヤー登録";
  screen.appendChild(title);

  const input = document.createElement("input");
  input.placeholder = "名前を入力";
  screen.appendChild(input);

  const addBtn = document.createElement("button");
  addBtn.textContent = "追加";
  addBtn.className = "primary";
  screen.appendChild(addBtn);

  function addPlayer() {
    const name = input.value.trim();
    if (!name) return;
    GameState.players.push(name);
    input.value = "";
    render();
  }

  addBtn.onclick = addPlayer;
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") addPlayer();
  });

  GameState.players.forEach((name, i) => {
    const row = document.createElement("div");
    row.className = "player-row";

    const span = document.createElement("span");
    span.textContent = name;

    const del = document.createElement("button");
    del.textContent = "削除";
    del.className = "secondary";
    del.onclick = () => {
      GameState.players.splice(i, 1);
      render();
    };

    row.appendChild(span);
    row.appendChild(del);
    screen.appendChild(row);
  });

  if (GameState.players.length >= 3) {
    const startBtn = document.createElement("button");
    startBtn.textContent = "お題へ";
    startBtn.className = "primary footer-btn";
    startBtn.onclick = () => {
      GameState.phase = "theme";
      setRandomTheme();
      render();
    };
    screen.appendChild(startBtn);
  }
}

/* =========================
   THEME
========================= */

function renderTheme() {
  const title = document.createElement("h1");
  title.textContent = "お題";
  screen.appendChild(title);

  // カテゴリ選択
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

  // お題表示
  const themeText = document.createElement("h2");
  themeText.textContent = GameState.theme;
  screen.appendChild(themeText);

  const changeBtn = document.createElement("button");
  changeBtn.textContent = "お題変更";
  changeBtn.className = "secondary";
  changeBtn.onclick = () => {
    setRandomTheme();
    render();
  };
  screen.appendChild(changeBtn);

  const startBtn = document.createElement("button");
  startBtn.textContent = "回す";
  startBtn.className = "primary";
  startBtn.onclick = startRound;
  screen.appendChild(startBtn);

  const backBtn = document.createElement("button");
  backBtn.textContent = "トップに戻る";
  backBtn.className = "secondary footer-btn";
  backBtn.onclick = () => {
    GameState.phase = "setup";
    render();
  };
  screen.appendChild(backBtn);
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

/* =========================
   PLAY
========================= */

function startRound() {
  GameState.currentIndex = 0;
  GameState.predictions = {};
  GameState.votes = {};
  GameState.phase = "play";
  render();
}

function renderPlay() {
  const player = GameState.players[GameState.currentIndex];

  const title = document.createElement("h2");
  title.textContent = GameState.theme;
  screen.appendChild(title);

  const name = document.createElement("p");
  name.textContent = player + " さん";
  screen.appendChild(name);

  let prediction = 0;
  let selectedVote = null;

  /* 予想UI */
  const counter = document.createElement("div");
  counter.className = "counter";

  const minus = document.createElement("button");
  minus.textContent = "−";

  const num = document.createElement("div");
  num.textContent = prediction;

  const plus = document.createElement("button");
  plus.textContent = "+";

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

  /* 投票UI */
  const grid = document.createElement("div");
  grid.className = "vote-grid";

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
    };

    grid.appendChild(btn);
  });

  screen.appendChild(grid);

  /* 次へ */
  const nextBtn = document.createElement("button");
  nextBtn.textContent = "次へ";
  nextBtn.className = "primary footer-btn";
  nextBtn.onclick = () => {
    if (selectedVote == null) return;

    GameState.predictions[player] = prediction;
    GameState.votes[selectedVote] =
      (GameState.votes[selectedVote] || 0) + 1;

    GameState.currentIndex++;

    if (GameState.currentIndex >= GameState.players.length) {
      GameState.phase = "result";
    }

    render();
  };

  screen.appendChild(nextBtn);
}

/* =========================
   RESULT
========================= */

function renderResult() {
  const results = GameState.players.map(p => {
    const actual = GameState.votes[p] || 0;
    const predicted = GameState.predictions[p] || 0;
    const error = Math.abs(actual - predicted);
    return { name: p, actual, predicted, error };
  });

  const voteRank = [...results].sort((a, b) => b.actual - a.actual);
  const errorRank = [...results].sort((a, b) => a.error - b.error);

  const title = document.createElement("h2");
  title.textContent = "結果";
  screen.appendChild(title);

  const voteTitle = document.createElement("h3");
  voteTitle.textContent = "投票数ランキング";
  screen.appendChild(voteTitle);

  voteRank.forEach(r => {
    const div = document.createElement("div");
    div.textContent = `${r.name} : ${r.actual}票`;
    screen.appendChild(div);
  });

  const errorTitle = document.createElement("h3");
  errorTitle.textContent = "誤差ランキング";
  screen.appendChild(errorTitle);

  errorRank.forEach(r => {
    const div = document.createElement("div");
    div.textContent = `${r.name} : 誤差 ${r.error}`;
    screen.appendChild(div);
  });

  const nextBtn = document.createElement("button");
  nextBtn.textContent = "お題へ戻る";
  nextBtn.className = "primary footer-btn";
  nextBtn.onclick = () => {
    GameState.phase = "theme";
    setRandomTheme();
    render();
  };
  screen.appendChild(nextBtn);
}

init();
