let activeRow = 1;
const totalRows = 4;
const totalCols = 5;

function getAnswer() {
  // Decodes the base64 string
  return atob("MDkyMjY=");
}

const answer = getAnswer(); //sorry you cant cheat

//BREAK INTO SEPARATE FILE
//SET UP MULTIPLE DAYS WORTH OF HINTS AND ANSWERS ENCRYPTED

//begin game logic

// Utility: Get all inputs for a specific row
function getRowInputs(row) {
  return document.querySelectorAll(`.cell-input[data-row="${row}"]`);
}

// Utility: Get all input elements
function getAllInputs() {
  return document.querySelectorAll('.cell-input');
}

// Set active row: enable its inputs, disable others
function setActiveRow(row) {
  for (let r = 1; r <= totalRows; r++) {
    const inputs = getRowInputs(r);
    inputs.forEach(inp => {
      if (r === row) {
        inp.removeAttribute('readonly');
        // inp.value = ''; // Optionally clear
      } else {
        inp.setAttribute('readonly', 'readonly');
      }
    });
  }
  // Focus first input of new active row
  const firstInput = getRowInputs(row)[0];
  if (firstInput) firstInput.focus();
}

function advanceRow() {
  if (activeRow < totalRows) {
    activeRow++;
    setActiveRow(activeRow);
  }
  // After the 4th guess (activeRow === totalRows), don't activate a new row.
  // Game is over, leave the last row as-is.
}


// Listen for input and navigation logic
getAllInputs().forEach((input, idx, inputs) => {
  input.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 1);
    // Move to next input if digit entered
    if (e.target.value && idx < inputs.length - 1) {
      let next = inputs[idx + 1];
      if (next && !next.hasAttribute('readonly') && next.dataset.row === e.target.dataset.row) {
        next.focus();
      }
    }
  });

  input.addEventListener('keydown', (e) => {
    const row = parseInt(input.dataset.row);
    const col = parseInt(input.dataset.col);

    // Submit on Enter (if in active row)
    if (e.key === "Enter" && row === activeRow) {
      e.preventDefault();
      document.getElementById("submit-btn").click();
    }

    // Backspace logic (move back if empty)
    if (e.key === "Backspace" && !e.target.value && col > 1) {
      let prev = document.querySelector(`.cell-input[data-row="${row}"][data-col="${col - 1}"]`);
      if (prev) prev.focus();
    }

    // Left/right arrow navigation
    if (e.key === "ArrowLeft" && col > 1) {
      let prev = document.querySelector(`.cell-input[data-row="${row}"][data-col="${col - 1}"]`);
      if (prev) prev.focus();
    }
    if (e.key === "ArrowRight" && col < totalCols) {
      let next = document.querySelector(`.cell-input[data-row="${row}"][data-col="${col + 1}"]`);
      if (next && !next.hasAttribute('readonly')) next.focus();
    }
  });
});

// Submit logic (button or Enter)
document.getElementById('submit-btn').addEventListener('click', function() {
  const guessInputs = getRowInputs(activeRow);
  const guess = Array.from(guessInputs).map(inp => inp.value).join('');
  if (guess.length < totalCols) {
    alert('Please enter a 5-digit guess.');
    guessInputs[0].focus();
    return;
  }

  // Remove previous feedback classes
  guessInputs.forEach(inp => {
    inp.classList.remove('correct', 'present', 'absent');
  });

  // Prepare arrays to keep track of checked positions
  const answerArr = answer.split('');
  const guessArr = guess.split('');
  const answerChecked = Array(totalCols).fill(false); // To mark used positions in answer
  const guessChecked = Array(totalCols).fill(false); // To mark processed positions in guess

  // First pass: check for correct (green)
  for (let i = 0; i < totalCols; i++) {
    if (guessArr[i] === answerArr[i]) {
      guessInputs[i].classList.add('correct');
      answerChecked[i] = true;
      guessChecked[i] = true;
    }
  }

  // Second pass: check for present (yellow)
  for (let i = 0; i < totalCols; i++) {
    if (!guessChecked[i]) {
      let found = false;
      for (let j = 0; j < totalCols; j++) {
        if (!answerChecked[j] && guessArr[i] === answerArr[j]) {
          guessInputs[i].classList.add('present');
          answerChecked[j] = true;
          found = true;
          break;
        }
      }
      if (!found) {
        guessInputs[i].classList.add('absent');
      }
    }
  }

  // Lock current row, advance to next
  guessInputs.forEach(inp => inp.setAttribute('readonly', 'readonly'));
  advanceRow();
  addNextHint();

});

// Initialize: only first row enabled
setActiveRow(activeRow);

// HINTS
function showHints() {
  const hintList = document.getElementById('hint-list');
  hintList.innerHTML = ''; // Clear old hints
  revealedHints.forEach(hint => {
    const li = document.createElement('li');
    li.textContent = hint;
    hintList.appendChild(li);
  });
}

const allHints = [
  "1. Digit 2 is odd, Digit 3 is even",
  "2. (Digit 1 + Digit 2) - 1 = Digit 4 + Digit 5",
  "3. Atleast one digit repeats ",
  "4. Digit 3 + Digit 4 = Digit 5 - Digit 3 "
];

let revealedHints = [allHints[0]]; // Array to store the hints we've revealed

function addNextHint() {
  if (revealedHints.length === 0 && allHints.length > 0) {
    revealedHints.push(allHints[0]); // Always ensure first hint is revealed
  } else if (revealedHints.length < allHints.length) {
    revealedHints.push(allHints[revealedHints.length]);
  }
  showHints();
}

  function closeModal() {
    document.getElementById('rulesModal').style.display = 'none';
  }

  window.addEventListener('load', () => {
    document.getElementById('rulesModal').style.display = 'flex';
    showHints();
  });
