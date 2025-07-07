// ✅ app.js

// Dark/Light Theme Toggle
function toggleTheme() {
  const html = document.documentElement;
  const currentTheme = html.getAttribute('data-theme');
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  html.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
}

let currentBudget = 0;
let items = [];
let currentWeek = '';

// DOM Elements
const app = document.getElementById('app');

app.innerHTML = `
  <h2>📊 Weekly Budget Tracker</h2>

  <label for="weekSelect">Label This Budget Period</label>
  <input type="text" id="weekSelect" placeholder="e.g. July 7–10, 2025" />

  <label for="budgetInput">Set Weekly Budget (₱)</label>
  <input type="number" id="budgetInput" placeholder="e.g. 1500" />
  <button id="setBudgetBtn">Set Budget</button>
  <button id="extraBudgetBtn">Add Extra Budget</button>

  <div class="budget-display" id="remainingBudget">Remaining: ₱0.00</div>

  <label for="itemName">Item Name</label>
  <input type="text" id="itemName" placeholder="e.g. Groceries" />

  <label for="itemPrice">Item Price (₱)</label>
  <input type="number" id="itemPrice" placeholder="e.g. 350" />

  <button id="addItemBtn">Add Item</button>
  <button class="reset-btn" id="resetBtn">Reset All</button>
  <button class="export-btn" id="exportBtn">Export CSV</button>

  <div class="expenses-header">🧾 Expenses</div>
  <ul id="itemList"></ul>
`;

// Inputs
const weekSelect = document.getElementById('weekSelect');
const budgetInput = document.getElementById('budgetInput');
const setBudgetBtn = document.getElementById('setBudgetBtn');
const extraBudgetBtn = document.getElementById('extraBudgetBtn');
const remainingBudget = document.getElementById('remainingBudget');
const itemName = document.getElementById('itemName');
const itemPrice = document.getElementById('itemPrice');
const addItemBtn = document.getElementById('addItemBtn');
const resetBtn = document.getElementById('resetBtn');
const exportBtn = document.getElementById('exportBtn');
const itemList = document.getElementById('itemList');

// Init on load
window.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);

  const lastUsedWeek = localStorage.getItem('lastUsedWeek');
  if (lastUsedWeek) {
    currentWeek = lastUsedWeek;
    weekSelect.value = currentWeek;
    weekSelect.disabled = true;
    setBudgetBtn.disabled = true;
    loadData();
  }
});

// Set Budget
setBudgetBtn.onclick = () => {
  const budget = parseFloat(budgetInput.value);
  const label = weekSelect.value.trim();
  if (!label) return alert('Please label the budget period.');
  if (!budgetInput.value) return alert('Budget input is required.');
  if (isNaN(budget) || budget <= 0) return alert('Enter valid budget.');
  currentBudget = budget;
  items = [];
  currentWeek = label;
  weekSelect.disabled = true;
  setBudgetBtn.disabled = true;
  budgetInput.value = '';
  localStorage.setItem('lastUsedWeek', currentWeek);
  saveData();
  updateBudgetDisplay();
  renderItems();
};

// Add Extra Budget
extraBudgetBtn.onclick = () => {
  const extra = prompt('Enter extra budget amount (₱):');
  const amount = parseFloat(extra);
  if (isNaN(amount) || amount <= 0) return alert('Invalid extra amount.');
  currentBudget += amount;
  saveData();
  updateBudgetDisplay();
};

// Add Item
addItemBtn.onclick = () => {
  const name = itemName.value.trim();
  const price = parseFloat(itemPrice.value);
  if (!name) return alert('Item name is required.');
  if (!itemPrice.value) return alert('Item price is required.');
  if (isNaN(price) || price <= 0) return alert('Enter a valid price.');
  if (price > currentBudget) return alert('Not enough budget.');
  items.push({ name, price });
  currentBudget -= price;
  saveData();
  updateBudgetDisplay();
  renderItems();
  itemName.value = '';
  itemPrice.value = '';
};

// Remove Item
function removeItem(index) {
  if (index < 0 || index >= items.length) return;
  currentBudget += items[index].price;
  items.splice(index, 1);
  saveData();
  updateBudgetDisplay();
  renderItems();
}

// Reset
resetBtn.onclick = () => {
  if (confirm('Reset everything for this week?')) {
    localStorage.removeItem(`budgetData-${currentWeek}`);
    localStorage.removeItem('lastUsedWeek');
    currentBudget = 0;
    items = [];
    updateBudgetDisplay();
    renderItems();
    weekSelect.disabled = false;
    setBudgetBtn.disabled = false;
    weekSelect.value = '';
    budgetInput.value = '';
  }
};

// Export CSV
exportBtn.onclick = () => {
  try {
    let allKeys = Object.keys(localStorage)
      .filter(key => key.startsWith('budgetData-'))
      .sort();
    let csv = 'Week,Budget,Item,Price\n';
    allKeys.forEach(key => {
      const week = key.replace('budgetData-', '');
      const { budget, items } = JSON.parse(localStorage.getItem(key));
      items.forEach(item => {
        csv += `"${week}",${budget},"${item.name}",${item.price}\n`;
      });
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'budget-history.csv';
    link.click();
  } catch (err) {
    alert('Export failed.');
    console.error(err);
  }
};

// Display Remaining
function updateBudgetDisplay() {
  remainingBudget.textContent = `Remaining: ₱${currentBudget.toFixed(2)}`;
}

// Render Items
function renderItems() {
  itemList.innerHTML = '';
  if (!items.length) {
    itemList.innerHTML = '<li style="text-align:center;color:#aaa">No expenses yet.</li>';
    return;
  }
  items.forEach((item, index) => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${item.name}</span><span>₱${item.price.toFixed(2)}</span>`;
    const btn = document.createElement('button');
    btn.textContent = 'Remove';
    btn.className = 'remove-btn';
    btn.onclick = () => removeItem(index);
    li.appendChild(btn);
    itemList.appendChild(li);
  });
}

// Load from localStorage
function loadData() {
  const saved = localStorage.getItem(`budgetData-${currentWeek}`);
  if (saved) {
    const parsed = JSON.parse(saved);
    currentBudget = parsed.budget || 0;
    items = parsed.items || [];
  } else {
    currentBudget = 0;
    items = [];
  }
  updateBudgetDisplay();
  renderItems();
}

// Save to localStorage
function saveData() {
  localStorage.setItem(`budgetData-${currentWeek}`, JSON.stringify({ budget: currentBudget, items }));
}
