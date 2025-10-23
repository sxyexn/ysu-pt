const menuItems = [
    { id: 1, name: "제육볶음", price: 12900 },
    { id: 2, name: "닭발", price: 14900 },
    { id: 3, name: "포카칩피자", price: 5000 }
    { id: 4, name: "포카칩", price: 5000 }
    { id: 5, name: "주먹밥", price: 3500 }
    { id: 5, name: "자릿세", price: 5000 }
];

const tablesCount = 20;
let currentTable = null;
let totalRevenue = 0;
let salesStatus = {};

const tables = {};
for (let i = 1; i <= tablesCount; i++) {
    tables[i] = {
        currentOrders: [],
        placedOrders: [],
        total: 0,
        paid: false,
    };
}

const tablesGrid = document.getElementById('tables-grid');
const menuGrid = document.getElementById('menu-grid');
const orderDetailPanel = document.getElementById('order-detail-panel');
const summaryPanel = document.getElementById('summary-panel');
const noTableSelected = document.getElementById('no-table-selected');
const currentTableNumberEl = document.getElementById('current-table-number');
const previousOrdersEl = document.getElementById('previous-orders');
const currentOrdersEl = document.getElementById('current-orders');
const currentTableTotalEl = document.getElementById('current-table-total');
const totalRevenueEl = document.getElementById('total-revenue');
const salesListEl = document.getElementById('sales-list');

function init() {
    createTableButtons();
    createMenuButtons();
    initSalesStatus();
    summaryPanel.style.display = 'none';
}

function initSalesStatus() {
    menuItems.forEach(item => {
        salesStatus[item.name] = 0;
    });
    updateSalesStatusPanel();
}

function createTableButtons() {
    for (let i = 1; i <= tablesCount; i++) {
        const button = document.createElement('button');
        button.className = 'table-button';
        button.dataset.tableNumber = i;
        button.addEventListener('click', () => selectTable(i));

        button.innerHTML = `
            <span class="table-number">${i}번 테이블</span>
            <div class="table-order-summary">
                <p>주문 내역 없음</p>
            </div>
        `;
        tablesGrid.appendChild(button);
    }
}

function createMenuButtons() {
    menuItems.forEach(item => {
        const button = document.createElement('button');
        button.className = 'menu-button';
        button.textContent = `${item.name} (${item.price.toLocaleString()}원)`;
        button.addEventListener('click', () => addOrder(item));
        menuGrid.appendChild(button);
    });
}

function goHome() {
    document.querySelectorAll('.table-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    orderDetailPanel.style.display = 'none';
    noTableSelected.style.display = 'flex';
    document.getElementById('summary-button').style.display = 'block';

    currentTable = null;
    summaryPanel.style.display = 'none';
    document.getElementById('summary-button').textContent = '총 수입 및 판매 현황 보기';
}

function selectTable(tableNumber) {
    document.querySelectorAll('.table-button').forEach(btn => {
        btn.classList.remove('active');
    });

    const selectedButton = document.querySelector(`.table-button[data-table-number='${tableNumber}']`);
    if (selectedButton) {
        selectedButton.classList.add('active');
    }
    
    currentTable = tableNumber;
    noTableSelected.style.display = 'none';
    orderDetailPanel.style.display = 'flex';
    document.getElementById('summary-button').style.display = 'none';
    summaryPanel.style.display = 'none';
    currentTableNumberEl.textContent = `${tableNumber}번 테이블`;

    updateOrderPanel();
}

function addOrder(item) {
    if (!currentTable) return;
    
    const tableCurrentOrders = tables[currentTable].currentOrders;
    const existingOrder = tableCurrentOrders.find(order => order.id === item.id);
    
    if (existingOrder) {
        existingOrder.quantity++;
    } else {
        tableCurrentOrders.push({ ...item, quantity: 1 });
    }
    
    updateOrderPanel();
}

function updateOrderPanel() {
    // 이전 주문 목록 업데이트
    previousOrdersEl.innerHTML = '';
    tables[currentTable].placedOrders.forEach(order => {
        const li = document.createElement('li');
        li.textContent = `${order.name} - ${order.price.toLocaleString()}원 x ${order.quantity}`;
        previousOrdersEl.appendChild(li);
    });

    // 새로운 주문 목록 업데이트
    currentOrdersEl.innerHTML = '';
    tables[currentTable].currentOrders.forEach(order => {
        const li = document.createElement('li');
        li.innerHTML = `
            ${order.name} - ${order.price.toLocaleString()}원 x ${order.quantity}
            <button class="delete-item-button" onclick="deleteOrderItem(${order.id})">삭제</button>
        `;
        currentOrdersEl.appendChild(li);
    });
    
    const totalPlaced = tables[currentTable].placedOrders.reduce((acc, order) => acc + (order.price * order.quantity), 0);
    const totalCurrent = tables[currentTable].currentOrders.reduce((acc, order) => acc + (order.price * order.quantity), 0);
    currentTableTotalEl.textContent = (totalPlaced + totalCurrent).toLocaleString();
}

function deleteOrderItem(itemId) {
    const tableCurrentOrders = tables[currentTable].currentOrders;
    const itemIndex = tableCurrentOrders.findIndex(order => order.id === itemId);

    if (itemIndex !== -1) {
        const itemToRemove = tableCurrentOrders[itemIndex];
        itemToRemove.quantity--;
        
        if (itemToRemove.quantity === 0) {
            tableCurrentOrders.splice(itemIndex, 1);
        }

        updateOrderPanel();
    }
}

function placeOrder() {
    if (!currentTable) return;

    const currentOrders = tables[currentTable].currentOrders;
    if (currentOrders.length === 0) {
        alert("주문할 메뉴가 없습니다.");
        return;
    }

    const placedOrders = tables[currentTable].placedOrders;
    currentOrders.forEach(item => {
        const existingItem = placedOrders.find(order => order.id === item.id);
        if (existingItem) {
            existingItem.quantity += item.quantity;
        } else {
            placedOrders.push({ ...item });
        }
    });

    tables[currentTable].currentOrders = [];
    tables[currentTable].total = placedOrders.reduce((acc, order) => acc + (order.price * order.quantity), 0);
    
    updateTableSummary(currentTable);
    updateTableStatus(currentTable, 'occupied');
    
    goHome();
}

function payOrder() {
    if (!currentTable) return;
    
    if (tables[currentTable].placedOrders.length === 0) {
        alert("결제할 내역이 없습니다.");
        return;
    }
    
    totalRevenue += tables[currentTable].total;

    tables[currentTable].placedOrders.forEach(order => {
        if (salesStatus[order.name] !== undefined) {
            salesStatus[order.name] += order.quantity;
        }
    });

    updateSalesStatusPanel();
    
    updateTableStatus(currentTable, 'paid');
    totalRevenueEl.textContent = totalRevenue.toLocaleString();
    
    // 결제 완료 후 해당 테이블의 주문 내역을 모두 초기화합니다.
    tables[currentTable].currentOrders = [];
    tables[currentTable].placedOrders = [];
    tables[currentTable].total = 0;
    
    // 테이블 버튼의 주문 내역도 삭제되도록 updateTableSummary를 호출합니다.
    updateTableSummary(currentTable);
    
    goHome();
}

function updateTableStatus(tableNumber, status) {
    const tableButton = document.querySelector(`.table-button[data-table-number='${tableNumber}']`);
    
    if (tableButton.classList.contains('active')) {
        return;
    }

    tableButton.classList.remove('occupied', 'paid');
    
    if (status === 'occupied') {
        tableButton.classList.add('occupied');
    } else if (status === 'paid') {
        tableButton.classList.add('paid');
    }
}

function updateTableSummary(tableNumber) {
    const tableButton = document.querySelector(`.table-button[data-table-number='${tableNumber}']`);
    const summaryEl = tableButton.querySelector('.table-order-summary');
    const orders = tables[tableNumber].placedOrders;
    const tableTotal = tables[tableNumber].total;

    summaryEl.innerHTML = '';
    if (orders.length > 0) {
        summaryEl.classList.add('has-orders');
        orders.forEach(order => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'summary-item';
            itemDiv.innerHTML = `<span class="summary-item-name">${order.name}</span><span class="summary-item-qty">x${order.quantity}</span>`;
            summaryEl.appendChild(itemDiv);
        });
        const totalDiv = document.createElement('div');
        totalDiv.className = 'summary-item total-summary';
        totalDiv.innerHTML = `<span>총 금액</span><span>${tableTotal.toLocaleString()}원</span>`;
        summaryEl.appendChild(totalDiv);
    } else {
        summaryEl.classList.remove('has-orders');
        summaryEl.innerHTML = `<p>주문 내역 없음</p>`;
    }
}

function updateSalesStatusPanel() {
    salesListEl.innerHTML = '';
    for (const menu in salesStatus) {
        const li = document.createElement('li');
        li.textContent = `${menu}: ${salesStatus[menu]}개`;
        salesListEl.appendChild(li);
    }
}

function toggleSummaryPanel() {
    const summaryButton = document.getElementById('summary-button');
    const isHidden = summaryPanel.style.display === 'none' || summaryPanel.style.display === '';
    
    if (isHidden) {
        summaryPanel.style.display = 'flex';
        summaryButton.textContent = '총 수입 및 판매 현황 숨기기';
    } else {
        summaryPanel.style.display = 'none';
        summaryButton.textContent = '총 수입 및 판매 현황 보기';
    }
}

// 터치 확대/축소(pinch) 및 더블 탭 확대 방지
document.addEventListener('touchstart', function(event) {
    if (event.touches.length > 1) {
        event.preventDefault();
    }
}, { passive: false });

document.addEventListener('touchmove', function(event) {
    if (event.scale !== 1) {
        event.preventDefault();
    }
}, { passive: false });

let lastTouchEnd = 0;
document.addEventListener('touchend', function(event) {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, false);

init();
