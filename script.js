const GameState = {
  players: [],
  predictions: {},
  votes: {},
  phase: "setup",
  currentPlayerIndex: 0,
  theme: "",
  themes: [
    "一番すぐ寝そう",
    "一番裏切りそう",
    "一番将来成功しそう",
    "一番秘密を持ってそう",
    "一番モテそう"
  ]
};

function render() {
  const content = document.getElementById("content");
  content.innerHTML = "";

  if (GameState.phase === "setup") renderSetup(content);
  if (GameState.phase === "predict") renderPredict(content);
  if (GameState.phase === "vote") renderVote(content);
  if (GameState.phase === "result") renderResult(content);
}

function renderSetup(el) {
  const input = document.createElement("input");
  const addBtn = document.createElement("button");
  addBtn.textContent = "追加";

  addBtn.onclick = () => {
    if (!input.value) return;
    GameState.players.push({ name: input.value });
    input.value = "";
    render();
  };

  el.appendChild(input);
  el.appendChild(addBtn);

  GameState.players.forEach((p, i) => {
    const div = document.createElement("div");
    div.textContent = p.name;
    el.appendChild(div);
  });

  if (GameState.players.length >= 3) {
    const startBtn = document.createElement("button");
    startBtn.textContent = "開始";
    startBtn.onclick = startRound;
    el.appendChild(startBtn);
  }
}

function startRound() {
  GameState.theme =
    GameState.themes[Math.floor(Math.random() * GameState.themes.length)];

  GameState.predictions = {};
  GameState.votes = {};
  GameState.currentPlayerIndex = 0;
  GameState.phase = "predict";
  render();
}

function renderPredict(el) {
  const player = GameState.players[GameState.currentPlayerIndex];

  const title = document.createElement("h2");
  title.textContent = GameState.theme;
  el.appendChild(title);

  const label = document.createElement("p");
  label.textContent = `${player.name}さん：自分は何票入る？`;
  el.appendChild(label);

  const input = document.createElement("input");
  input.type = "number";
  input.min = 0;
  input.max = GameState.players.length - 1;
  el.appendChild(input);

  const btn = document.createElement("button");
  btn.textContent = "決定";
  btn.onclick = () => {
    GameState.predictions[player.name] = Number(input.value);
    GameState.currentPlayerIndex++;

    if (GameState.currentPlayerIndex >= GameState.players.length) {
      GameState.currentPlayerIndex = 0;
      GameState.phase = "vote";
    }
    render();
  };
  el.appendChild(btn);
}

function renderVote(el) {
  const player = GameState.players[GameState.currentPlayerIndex];

  const title = document.createElement("h2");
  title.textContent = GameState.theme;
  el.appendChild(title);

  const label = document.createElement("p");
  label.textContent = `${player.name}さん：誰に投票する？`;
  el.appendChild(label);

  GameState.players.forEach(p => {
    if (p.name === player.name) return;

    const btn = document.createElement("button");
    btn.textContent = p.name;
    btn.onclick = () => {
      GameState.votes[p.name] = (GameState.votes[p.name] || 0) + 1;
      GameState.currentPlayerIndex++;

      if (GameState.currentPlayerIndex >= GameState.players.length) {
        GameState.phase = "result";
      }
      render();
    };
    el.appendChild(btn);
  });
}

function renderResult(el) {
  const results = [];

  GameState.players.forEach(p => {
    const actual = GameState.votes[p.name] || 0;
    const predicted = GameState.predictions[p.name] || 0;
    const error = Math.abs(actual - predicted);

    results.push({
      name: p.name,
      actual,
      predicted,
      error
    });
  });

  const title = document.createElement("h2");
  title.textContent = "結果";
  el.appendChild(title);

  results.forEach(r => {
    const div = document.createElement("div");
    div.textContent =
      `${r.name} 予想:${r.predicted} 実際:${r.actual} 誤差:${r.error}`;
    el.appendChild(div);
  });

  const nextBtn = document.createElement("button");
  nextBtn.textContent = "次のラウンド";
  nextBtn.onclick = startRound;
  el.appendChild(nextBtn);
}

render();
