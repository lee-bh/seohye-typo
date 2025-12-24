const API_URL = 'https://script.google.com/macros/s/AKfycbyiINN08iExnzgRMLgTNFxYy6VAPmgyZWZgjp-bIDub-oJyWmckij8m4dyv8X-JvO3-/exec';

// State
let state = {
    items: [],
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    isDragging: false,
    lastMouseX: 0,
    lastMouseY: 0,
    minYear: 1800,
    maxYear: 2025
};

// DOM Elements
const app = document.getElementById('app');
const timelineContainer = document.getElementById('timeline-container');
const timelineContent = document.getElementById('timeline-content');
const modalOverlay = document.getElementById('modal-overlay');
const itemForm = document.getElementById('item-form');
const loadingIndicator = document.getElementById('loading-indicator');

// Constants
const PIXELS_PER_YEAR = 20; // Base width for one year
const Y_SPREAD = 400; // Vertical spread range

// Initialize
async function init() {
    console.log('Current Scale:', PIXELS_PER_YEAR);
    setupInteractions();
    setupForm();
    await loadData();
    centerView();
}

// Data Fetching
async function loadData() {
    showLoading(true);
    try {
        const response = await fetch(`${API_URL}?action=read`);
        const result = await response.json();

        if (result.status === 'success') {
            console.log('Raw rows:', result.data.rows);
            state.items = parseRows(result.data.headers, result.data.rows);
            console.log('Parsed items:', state.items);
            calculateBounds();
            renderTimeline();
        } else {
            console.error('Error loading data:', result.message);
            alert('Failed to load data. Please check console.');
        }
    } catch (error) {
        console.error('Fetch error:', error);
        // Mock data for development if CORS fails
        console.warn('Using mock data due to fetch error (likely CORS)');
        useMockData();
    } finally {
        showLoading(false);
    }
}

function parseRows(headers, rows) {
    return rows.map((row, index) => {
        const item = {};
        headers.forEach((header, i) => {
            item[header.toLowerCase()] = row[i];
        });
        item._row = index + 2; // Sheet row index (1-based, header is 1)
        return item;
    });
}

function useMockData() {
    state.items = [
        { _row: 2, nation: 'Korea', category: '서체', yr: 1443, item: 'Hunminjeongeum', info: 'Creation of Hangul', link: '', cite: 'Annals' },
        { _row: 3, nation: 'China', category: '기술', yr: 1040, item: 'Bi Sheng', info: 'Movable Type', link: '', cite: 'History' },
        { _row: 4, nation: 'Japan', category: '서체', yr: 1957, item: 'Helvetica', info: 'Not Asian but test', link: '', cite: 'Wiki' },
        { _row: 5, nation: 'Korea', category: '경향', yr: 2000, item: 'Digital Era', info: 'Web fonts', link: '', cite: 'News' }
    ];
    calculateBounds();
    renderTimeline();
}

function calculateBounds() {
    if (state.items.length === 0) {
        state.minYear = 1800;
        state.maxYear = 2030;
        return;
    }
    const years = state.items.map(i => parseInt(i.yr) || 0).filter(y => y > 0);
    if (years.length === 0) {
        state.minYear = 1800;
        state.maxYear = 2030;
        return;
    }
    state.minYear = Math.min(...years) - 10;
    state.maxYear = Math.max(...years) + 10;
}

// Rendering
function renderTimeline() {
    timelineContent.innerHTML = ''; // Clear content

    // Sort items by year for better stacking
    state.items.sort((a, b) => (parseInt(a.yr) || 0) - (parseInt(b.yr) || 0));

    state.items.forEach((item, index) => {
        const el = document.createElement('div');
        el.className = 'timeline-item';

        // Position Calculation
        // X: Proportional to screen width
        // Formula: (screenWidth / totalTime) * (itemYear - startYear)
        const totalTime = state.maxYear - state.minYear;
        const screenWidth = window.innerWidth;
        const pixelsPerYear = screenWidth / totalTime;

        let year = parseInt(item.yr);
        if (isNaN(year)) year = state.minYear;

        const x = (year - state.minYear) * pixelsPerYear;

        // Y: Stacked line by line
        // Formula: index * rowHeight
        const rowHeight = 2; // Fixed height per item
        const y = index * rowHeight;

        el.style.left = `${x}px`;
        el.style.top = `${y}rem`;

        // Adjust width to fit better
        el.style.width = '400px';

        if (state.items.indexOf(item) < 3) {
            console.log(`Item ${state.items.indexOf(item)} pos:`, { x, y, year, min: state.minYear });
        }

        // Content
        // Content
        const info = item.info || '';
        el.innerHTML = `
            <div class="item-title">${item.yr || ''} ${item.item || 'Unknown'} <span class="tag">${item.nation}</span> <span class="tag">${item.category}</span></div>
            <div class="item-desc">${info.substring(0, 50)}${info.length > 50 ? '...' : ''}</div>
        `;

        el.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent drag start
            openEditModal(item);
        });

        timelineContent.appendChild(el);
    });

    console.log('Timeline children count:', timelineContent.children.length);
}

function updateTransform() {
    // Transform removed for new layout
    // timelineContent.style.transform = `translate(${state.offsetX}px, ${state.offsetY}px) scale(${state.scale})`;
}

function centerView() {
    // Center view logic removed for new layout
}

// Interactions
function setupInteractions() {
    // Pan/Zoom removed for new layout

    // Buttons
    document.getElementById('zoom-in').style.display = 'none';
    document.getElementById('zoom-out').style.display = 'none';
    document.getElementById('reset-view').style.display = 'none';

    document.getElementById('add-item-btn').onclick = () => {
        openEditModal(null);
    };

    // Re-render on resize
    window.addEventListener('resize', () => {
        renderTimeline();
    });
}

// Modal & Form
function openEditModal(item) {
    const modalTitle = document.getElementById('modal-title');
    const deleteBtn = document.getElementById('delete-btn');

    if (item) {
        modalTitle.textContent = 'Edit Item';
        document.getElementById('edit-row').value = item._row;
        document.getElementById('edit-nation').value = item.nation;
        document.getElementById('edit-category').value = item.category;
        document.getElementById('edit-yr').value = item.yr;
        document.getElementById('edit-item').value = item.item;
        document.getElementById('edit-info').value = item.info;
        document.getElementById('edit-link').value = item.link;
        document.getElementById('edit-cite').value = item.cite;
        deleteBtn.classList.remove('hidden');

        deleteBtn.onclick = () => deleteItem(item._row);
    } else {
        modalTitle.textContent = 'Add New Item';
        itemForm.reset();
        document.getElementById('edit-row').value = '';
        deleteBtn.classList.add('hidden');
    }

    modalOverlay.classList.remove('hidden');
}

function setupForm() {
    document.getElementById('close-modal').onclick = () => {
        modalOverlay.classList.add('hidden');
    };

    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            modalOverlay.classList.add('hidden');
        }
    });

    itemForm.onsubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(itemForm);
        const data = Object.fromEntries(formData.entries());

        const action = data._row ? 'update' : 'create';
        await sendData(action, data);
    };
}

async function sendData(action, data) {
    showLoading(true);
    modalOverlay.classList.add('hidden');

    try {
        // Convert data to URLSearchParams for POST body
        const params = new URLSearchParams();
        for (const key in data) {
            params.append(key, data[key]);
        }

        const response = await fetch(`${API_URL}?action=${action}`, {
            method: 'POST',
            body: params
        });

        const result = await response.json();
        if (result.status === 'success') {
            await loadData(); // Reload to see changes
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error('Save error:', error);
        alert('Failed to save. Check console.');
    } finally {
        showLoading(false);
    }
}

async function deleteItem(row) {
    if (!confirm('Are you sure you want to delete this item?')) return;

    showLoading(true);
    modalOverlay.classList.add('hidden');

    try {
        const params = new URLSearchParams();
        params.append('_row', row);

        const response = await fetch(`${API_URL}?action=delete`, {
            method: 'POST',
            body: params
        });

        const result = await response.json();
        if (result.status === 'success') {
            await loadData();
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error('Delete error:', error);
        alert('Failed to delete.');
    } finally {
        showLoading(false);
    }
}

function showLoading(show) {
    if (show) loadingIndicator.classList.remove('hidden');
    else loadingIndicator.classList.add('hidden');
}

// Start
init();
