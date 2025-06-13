// logic.js

// ─── Game State ─────────────────────────────────────────────────────────────

let activeRow = 1;
const totalRows = 4;
const totalCols = 5;

function getAnswer() {
  // Decodes the base64 string
  return atob("MDkyMjY=");
}
const answer = getAnswer(); // sorry you can't cheat!

const allHints = [
  "1. Digit 2 is odd, Digit 3 is even",
  "2. (Digit 1 + Digit 2) - 1 = Digit 4 + Digit 5",
  "3. At least one digit repeats",
  "4. Digit 3 + Digit 4 = Digit 5 - Digit 3"
];
let revealedHints = [ allHints[0] ];

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

// ─── GUESS GRADING ──────────────────────────────────────────────────────────

function submitGuess() {
  const inputs = Array.from(getRowInputs(activeRow));
  const guess = inputs.map(i => i.value).join('');
  if (guess.length < totalCols) {
    alert('Please enter a 5-digit guess.');
    inputs[0].focus();
    return;
  }

  // clear previous
  inputs.forEach(i => i.classList.remove('correct','present','absent'));

  const guessArr   = guess.split('');
  const answerArr  = answer.split('');
  const answerUsed = Array(totalCols).fill(false);
  const guessUsed  = Array(totalCols).fill(false);

  // 1) green pass
  for (let i = 0; i < totalCols; i++) {
    if (guessArr[i] === answerArr[i]) {
      inputs[i].classList.add('correct');
      answerUsed[i] = guessUsed[i] = true;
    }
  }
  // 2) yellow / gray pass
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

  // lock & advance
  inputs.forEach(i => i.setAttribute('readonly','readonly'));
  advanceRow();
  addNextHint();
}

// ─── INITIALIZATION ─────────────────────────────────────────────────────────

function init() {
  // Show the modal
  const modal    = document.getElementById('rulesModal');
  const startBtn = document.getElementById('start-game-btn');
  const submitBtn = document.getElementById('submit-btn');

  if (!modal || !startBtn || !submitBtn) {
    console.error('Missing modal, start-game-btn, or submit-btn in DOM');
    return;
  }

  modal.style.display = 'flex';

  // Start button hides modal and kicks off game
  startBtn.addEventListener('click', () => {
    modal.style.display = 'none';
    startBtn.style.display = 'none';
    setActiveRow(activeRow);
    showHints();
  });

  // Input navigation & auto-advance
  getAllInputs().forEach((inp, idx, all) => {
    inp.addEventListener('input', e => {
      e.target.value = e.target.value.replace(/[^0-9]/g,'').slice(0,1);
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

  // Submit button
  submitBtn.addEventListener('click', submitGuess);

  // Unlock first row
  setActiveRow(activeRow);
}

// Run after DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
