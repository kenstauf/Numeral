// ─── Game State ─────────────────────────────────────────────────────────────

let activeRow = 1;
const totalRows = 4;
const totalCols = 5;

// ─── LOAD INFO FROM JSON BASED ON DATE ─────────────────────────────────────────────────────────

let answer;
let allHints = [];
let revealedHints = [];

// Load & decode the puzzle for today's date (or fallback)
async function loadGameData() {
  try {
    const res    = await fetch('data.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data   = await res.json();  // { puzzles: [ { date, answer, hints }, … ] }

    // Build today’s date strings
    const todayISO  = new Date().toISOString().split('T')[0];
    const todayNice = new Date().toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Update the subtitle with the “last updated” date
    const updatedEl = document.getElementById('last-updated');
    if (updatedEl) {
      updatedEl.textContent = `Updated: ${todayNice}`;
    }

    // Pick today’s puzzle (or fallback to the first)
    const todaysPuzzle = data.puzzles.find(p => p.date === todayISO)
                      || data.puzzles[0];

    // Decode answer
    answer   = atob(todaysPuzzle.answer);

    // Decode hints and seed first hint
    allHints       = todaysPuzzle.hints.map(h => atob(h));
    revealedHints  = [ allHints[0] ];

  } catch (err) {
    console.error('Failed to load game data:', err);
  }
}


// ─── DOM UTILITIES ─────────────────────────────────────────────────────────

function getRowInputs(row) {
  return document.querySelectorAll(`.cell-input[data-row="${row}"]`);
}

function getAllInputs() {
  return document.querySelectorAll('.cell-input');
}

// ─── ROW MANAGEMENT ─────────────────────────────────────────────────────────

function setActiveRow(row) {
  activeRow = row;
  for (let r = 1; r <= totalRows; r++) {
    getRowInputs(r).forEach(inp => {
      if (r === row) {
        inp.removeAttribute('readonly');
      } else {
        inp.setAttribute('readonly', 'readonly');
      }
    });
  }
  const first = getRowInputs(row)[0];
  if (first) first.focus();
}

function advanceRow() {
  if (activeRow < totalRows) {
    setActiveRow(activeRow + 1);
  }
}

// ─── HINTS ─────────────────────────────────────────────────────────────────

function showHints() {
  const hintList = document.getElementById('hint-list');
  hintList.innerHTML = '';
  revealedHints.forEach(hint => {
    const li = document.createElement('li');
    li.textContent = hint;
    hintList.appendChild(li);
  });
}

function addNextHint() {
  if (revealedHints.length < allHints.length) {
    revealedHints.push(allHints[revealedHints.length]);
    showHints();
  }
}
// ─── CHECK FOR WIN ──────────────────────────────────────────────────────────
// return true if guessArr exactly matches answerArr
function checkWin(guessArr, answerArr) {
  return guessArr.every((digit, i) => digit === answerArr[i]);
}

// ─── FUN WIN ANIMATION ──────────────────────────────────────────────────────────

// Launches a 2-second confetti burst from both sides
function runConfetti() {
  const duration = 2 * 1000;
  const end = Date.now() + duration;

  (function frame() {
    // left-side burst
    confetti({
      particleCount: 5,
      angle: 60,
      spread: 55,
      origin: { x: 0 }
    });
    // right-side burst
    confetti({
      particleCount: 5,
      angle: 120,
      spread: 55,
      origin: { x: 1 }
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
}

// ─── GUESS GRADING ──────────────────────────────────────────────────────────

function submitGuess() {
  const inputs   = Array.from(getRowInputs(activeRow));
  const guess    = inputs.map(i => i.value).join('');
  const guessArr = guess.split('');
  const answerArr= answer.split('');

  // 1) ensure full row
  if (guessArr.length < totalCols || guessArr.some(d => d === '')) {
    alert('Please enter a 5-digit guess.');
    inputs[0].focus();
    return;
  }

  // 2) did they win?
  if (checkWin(guessArr, answerArr)) {
    // mark them all green
    inputs.forEach(i => i.classList.add('correct'));
    // CONFETTI TIME HELL YEAH
    runConfetti();
    
    return; // stop here—don't advance row or add hints
  }

  // 3) clear old classes
  inputs.forEach(i => i.classList.remove('correct','present','absent'));

  // 4) grade non-winning guess
  const answerUsed = Array(totalCols).fill(false);
  const guessUsed  = Array(totalCols).fill(false);

  // 4a) green pass
  for (let i = 0; i < totalCols; i++) {
    if (guessArr[i] === answerArr[i]) {
      inputs[i].classList.add('correct');
      answerUsed[i] = guessUsed[i] = true;
    }
  }

  // 4b) yellow/gray pass
  for (let i = 0; i < totalCols; i++) {
    if (guessUsed[i]) continue;
    let found = false;
    for (let j = 0; j < totalCols; j++) {
      if (!answerUsed[j] && guessArr[i] === answerArr[j]) {
        inputs[i].classList.add('present');
        answerUsed[j] = true;
        found = true;
        break;
      }
    }
    if (!found) inputs[i].classList.add('absent');
  }

  // 5) lock & advance
  inputs.forEach(i => i.setAttribute('readonly','readonly'));
  advanceRow();
  addNextHint();
}

// ─── INITIALIZATION ─────────────────────────────────────────────────────────

// Make init async so we can await the JSON load
async function init() {
  // 0) Load today’s puzzle data (answer + hints)
  await loadGameData();

  // 1) Grab key elements
  const modal      = document.getElementById('rulesModal');
  const startBtn   = document.getElementById('start-game-btn');
  const submitBtn  = document.getElementById('submit-btn');
  const toggleBtn  = document.querySelector('.rules-toggle');
  const rulesPanel = document.querySelector('.rules-panel');

  if (!modal || !startBtn || !submitBtn || !toggleBtn || !rulesPanel) {
    console.error('Missing one of: rulesModal, start-game-btn, submit-btn, rules-toggle or rules-panel');
    return;
  }

  // 2) Show the modal on load
  modal.style.display = 'flex';

  // 3) Start Game: hide modal & kick off game
  startBtn.addEventListener('click', () => {
    modal.style.display     = 'none';
    startBtn.style.display  = 'none';
    setActiveRow(activeRow);
    showHints();
  });

  // 4) Toggle the Rules Recap panel
  toggleBtn.addEventListener('click', () => {
    rulesPanel.classList.toggle('expanded');
  });

  // 5) Input navigation & auto-advance
  getAllInputs().forEach((inp, idx, all) => {
    inp.addEventListener('input', e => {
      e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 1);
      if (e.target.value && idx < all.length - 1) {
        const next = all[idx + 1];
        if (next.dataset.row === e.target.dataset.row && !next.hasAttribute('readonly')) {
          next.focus();
        }
      }
    });
    inp.addEventListener('keydown', e => {
      const row = +inp.dataset.row;
      const col = +inp.dataset.col;
      if (e.key === 'Enter' && row === activeRow) {
        e.preventDefault();
        submitGuess();
      }
      if (e.key === 'Backspace' && !inp.value && col > 1) {
        const prev = document.querySelector(`.cell-input[data-row="${row}"][data-col="${col-1}"]`);
        if (prev) prev.focus();
      }
      if (e.key === 'ArrowLeft' && col > 1) {
        document.querySelector(`.cell-input[data-row="${row}"][data-col="${col-1}"]`).focus();
      }
      if (e.key === 'ArrowRight' && col < totalCols) {
        const next = document.querySelector(`.cell-input[data-row="${row}"][data-col="${col+1}"]`);
        if (next && !next.hasAttribute('readonly')) next.focus();
      }
    });
  });

  // 6) Submit button
  submitBtn.addEventListener('click', submitGuess);

  // 7) Unlock first row
  setActiveRow(activeRow);
}

// Run init after DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}


// Run after DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
  console.log("version 1.12")
}

