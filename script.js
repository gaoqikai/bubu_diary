class Calculator {
    constructor(previousOperandTextElement, currentOperandTextElement) {
        this.previousOperandTextElement = previousOperandTextElement;
        this.currentOperandTextElement = currentOperandTextElement;
        this.clear();
    }

    clear() {
        this.currentOperand = '0';
        this.previousOperand = '';
        this.operation = undefined;
    }

    delete() {
        if (this.currentOperand === '0' || this.currentOperand === 'Error') return;
        if (this.currentOperand.length === 1 || (this.currentOperand.length === 2 && this.currentOperand.startsWith('-'))) {
            this.currentOperand = '0';
        } else {
            this.currentOperand = this.currentOperand.toString().slice(0, -1);
        }
    }

    appendNumber(number) {
        if (this.currentOperand === 'Error') this.clear();
        if (number === '.' && this.currentOperand.includes('.')) return;
        if (this.currentOperand === '0' && number !== '.') {
            this.currentOperand = number.toString();
        } else {
            this.currentOperand = this.currentOperand.toString() + number.toString();
        }
    }

    chooseOperation(operation) {
        if (this.currentOperand === 'Error') this.clear();
        if (this.currentOperand === '') return;
        
        if (operation === '%') {
            this.computePercentage();
            return;
        }

        if (this.previousOperand !== '') {
            this.compute();
        }
        this.operation = operation;
        this.previousOperand = this.currentOperand;
        this.currentOperand = '';
    }

    computePercentage() {
        const current = parseFloat(this.currentOperand);
        if (isNaN(current)) return;
        // Fix floating point issues for percentage
        this.currentOperand = (Math.round((current / 100) * 10000000000) / 10000000000).toString();
        this.updateDisplay();
    }

    compute() {
        let computation;
        const prev = parseFloat(this.previousOperand);
        const current = parseFloat(this.currentOperand);
        if (isNaN(prev) || isNaN(current)) return;
        switch (this.operation) {
            case '+':
                computation = prev + current;
                break;
            case '-':
                computation = prev - current;
                break;
            case '×':
            case '*':
                computation = prev * current;
                break;
            case '÷':
            case '/':
                if (current === 0) {
                    this.currentOperand = 'Error';
                    this.operation = undefined;
                    this.previousOperand = '';
                    return;
                }
                computation = prev / current;
                break;
            default:
                return;
        }
        
        // Handle floating point precision issues (e.g. 0.1 + 0.2)
        computation = Math.round(computation * 10000000000) / 10000000000;
        
        this.currentOperand = computation.toString();
        this.operation = undefined;
        this.previousOperand = '';
    }

    getDisplayNumber(number) {
        if (number === 'Error') return 'Error';
        const stringNumber = number.toString();
        const integerDigits = parseFloat(stringNumber.split('.')[0]);
        const decimalDigits = stringNumber.split('.')[1];
        let integerDisplay;
        
        if (isNaN(integerDigits)) {
            integerDisplay = '';
        } else if (integerDigits === 0 && stringNumber.startsWith('-0')) {
             integerDisplay = '-0';
        } else {
            integerDisplay = integerDigits.toLocaleString('en', { maximumFractionDigits: 0 });
        }
        
        if (decimalDigits != null) {
            return `${integerDisplay}.${decimalDigits}`;
        } else {
            return integerDisplay;
        }
    }

    updateDisplay() {
        this.currentOperandTextElement.innerText = this.getDisplayNumber(this.currentOperand);
        if (this.operation != null) {
            this.previousOperandTextElement.innerText = 
                `${this.getDisplayNumber(this.previousOperand)} ${this.operation}`;
        } else {
            this.previousOperandTextElement.innerText = '';
        }
    }
}

const previousOperandTextElement = document.getElementById('previous-operand');
const currentOperandTextElement = document.getElementById('current-operand');
const calculator = new Calculator(previousOperandTextElement, currentOperandTextElement);

// Event Listeners for Buttons
const numberButtons = document.querySelectorAll('[data-value]:not([data-action="operator"])');
const actionButtons = document.querySelectorAll('[data-action]');

numberButtons.forEach(button => {
    button.addEventListener('click', () => {
        calculator.appendNumber(button.dataset.value);
        calculator.updateDisplay();
    });
});

actionButtons.forEach(button => {
    button.addEventListener('click', () => {
        const action = button.dataset.action;
        if (action === 'clear') {
            calculator.clear();
        } else if (action === 'delete') {
            calculator.delete();
        } else if (action === 'calculate') {
            calculator.compute();
        } else if (action === 'operator') {
             calculator.chooseOperation(button.dataset.value);
        }
        calculator.updateDisplay();
    });
});

// Keyboard Support
document.addEventListener('keydown', e => {
    if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
    
    let key = e.key;
    
    // Number keys and decimal
    if (/[0-9\.]/.test(key)) {
        e.preventDefault();
        calculator.appendNumber(key);
        calculator.updateDisplay();
        highlightButton(`[data-value="${key}"]:not([data-action="operator"])`);
    }
    
    // Operators
    if (['+', '-', '*', '/'].includes(key)) {
        e.preventDefault();
        let op = key;
        if (key === '*') op = '×';
        if (key === '/') op = '÷';
        calculator.chooseOperation(op);
        calculator.updateDisplay();
        
        highlightButton(`[data-action="operator"][data-value="${op}"]`);
    }
    
    // Percentage
    if (key === '%') {
        e.preventDefault();
        calculator.chooseOperation('%');
        calculator.updateDisplay();
        highlightButton(`[data-value="%"]`);
    }

    // Equals/Enter
    if (key === 'Enter' || key === '=') {
        e.preventDefault();
        calculator.compute();
        calculator.updateDisplay();
        highlightButton(`[data-action="calculate"]`);
    }

    // Backspace for delete
    if (key === 'Backspace') {
        e.preventDefault();
        calculator.delete();
        calculator.updateDisplay();
        highlightButton(`[data-action="delete"]`);
    }

    // Escape for clear
    if (key === 'Escape') {
        e.preventDefault();
        calculator.clear();
        calculator.updateDisplay();
        highlightButton(`[data-action="clear"]`);
    }
});

function highlightButton(selector) {
    const btn = document.querySelector(selector);
    if (btn) {
        btn.classList.add('active-key');
        setTimeout(() => {
            btn.classList.remove('active-key');
        }, 100);
    }
}

// ==========================================
// Diary Logic
// ==========================================

const diaryBtn = document.getElementById('diary-btn');
const diaryModal = document.getElementById('diary-modal');
const closeDiaryBtn = document.getElementById('close-diary');
const newNoteBtn = document.getElementById('new-note-btn');
const saveNoteBtn = document.getElementById('save-note-btn');
const undoBtn = document.getElementById('undo-btn');
const notesListEl = document.getElementById('notes-list');

const titleInput = document.getElementById('note-title');
const contentInput = document.getElementById('note-content');
const idInput = document.getElementById('note-id');

let currentNotes = [];

diaryBtn.addEventListener('click', () => {
    diaryModal.classList.remove('hidden');
    loadNotes();
});

closeDiaryBtn.addEventListener('click', () => {
    diaryModal.classList.add('hidden');
});

// Load all notes from the backend
async function loadNotes() {
    try {
        const response = await fetch('/api/notes');
        currentNotes = await response.json();
        renderNotesList();
        if (currentNotes.length > 0 && !idInput.value) {
            selectNote(currentNotes[0].id);
        } else if (currentNotes.length === 0) {
            createNewNote();
        }
    } catch (e) {
        console.error("Failed to load notes", e);
    }
}

function renderNotesList() {
    notesListEl.innerHTML = '';
    currentNotes.forEach(note => {
        const el = document.createElement('div');
        el.className = `note-item ${note.id === idInput.value ? 'active' : ''}`;
        el.innerHTML = `
            <h4>${note.title || '无标题'}</h4>
            <p>${note.current_content || '...'}</p>
        `;
        el.addEventListener('click', () => selectNote(note.id));
        notesListEl.appendChild(el);
    });
}

function selectNote(id) {
    const note = currentNotes.find(n => n.id === id);
    if (note) {
        idInput.value = note.id;
        titleInput.value = note.title;
        contentInput.value = note.current_content;
        renderNotesList(); // update active class
    }
}

function createNewNote() {
    idInput.value = 'note_' + Date.now();
    titleInput.value = '';
    contentInput.value = '';
    renderNotesList(); // clear active class
    titleInput.focus();
}

newNoteBtn.addEventListener('click', createNewNote);

saveNoteBtn.addEventListener('click', async () => {
    const id = idInput.value;
    if (!id) return;
    
    const data = {
        id: id,
        title: titleInput.value.trim() || 'Untitled',
        content: contentInput.value
    };
    
    try {
        const res = await fetch('/api/note', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (res.ok) {
            saveNoteBtn.textContent = '已保存 ✓';
            setTimeout(() => saveNoteBtn.textContent = '保存', 2000);
            loadNotes(); // reload to update list
        }
    } catch (e) {
        console.error("Save failed", e);
        alert("保存失败！");
    }
});

const diffModal = document.getElementById('diff-modal');
const diffOldContent = document.getElementById('diff-old-content');
const diffNewContent = document.getElementById('diff-new-content');
const confirmRollbackBtn = document.getElementById('confirm-rollback-btn');
const cancelRollbackBtn = document.getElementById('cancel-rollback-btn');

undoBtn.addEventListener('click', async () => {
    const id = idInput.value;
    if (!id) return;
    
    try {
        const res = await fetch(`/api/note?id=${id}`);
        const data = await res.json();
        
        if (data.history && data.history.length > 0) {
            const previousContent = data.history[data.history.length - 1];
            diffOldContent.textContent = previousContent;
            diffNewContent.textContent = contentInput.value;
            diffModal.classList.remove('hidden');
        } else {
            alert("没有更早的历史记录可以撤销啦！");
        }
    } catch (e) {
        console.error("Fetch history failed", e);
    }
});

cancelRollbackBtn.addEventListener('click', () => {
    diffModal.classList.add('hidden');
});

confirmRollbackBtn.addEventListener('click', async () => {
    const id = idInput.value;
    if (!id) return;
    
    try {
        const res = await fetch('/api/note/undo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
        const data = await res.json();
        
        if (res.ok && data.success) {
            contentInput.value = data.content;
            undoBtn.textContent = '已撤销 ✓';
            setTimeout(() => undoBtn.textContent = '撤销 (回滚)', 2000);
            // Save the reverted state automatically
            saveNoteBtn.click();
            diffModal.classList.add('hidden');
        } else {
            alert("回滚失败！");
        }
    } catch (e) {
        console.error("Undo failed", e);
    }
});
