// Base URL for the API
const API_BASE_URL = 'http://localhost:5000/api';

// DOM elements
const cubeSelect = document.getElementById('cube-select');
const filterCubeSelect = document.getElementById('filter-cube');
const algorithmsList = document.querySelector('.algorithms-list');
const addAlgorithmForm = document.getElementById('add-algorithm-form');
const editAlgorithmForm = document.getElementById('edit-algorithm-form');
const editModal = document.getElementById('edit-modal');
const closeModalBtn = document.querySelector('.close-modal');
const clearDatabaseBtn = document.getElementById('clear-database-btn');
const confirmationModal = document.getElementById('confirmation-modal');
const confirmYesBtn = document.getElementById('confirm-yes');
const confirmNoBtn = document.getElementById('confirm-no');

// Flag to prevent multiple simultaneous loads
let isLoading = false;

// Algorithm image mapping - same as in bibliotekaAlgorytmow.js
const algorithmImageMap = {
    "R U R' U' R' F R2 U' R' U' R U R' F'": "R U R' U' R U' R' F' U' F R U R'",  // PLL-T
    "R U R' U R U2 R'": "R U R' U R U2 R' F R U R' U' F'",                       // Sune
    "U (R U' R')": "R U R2 U' R' F R U R U' F'",                                  // F2L-1
    "R U' R' U' F2 U' R U R' D R2": "R U2 R2 F R F' U2 R' F R F'",               // PBL-1
    "R U R' U R U R'": "F R' F R2 U' R' U' R U R' F2",                           // L3C
    "L' R L R'": "L F' L' U' L U F U' L'"                                         // Top First
};

// Track loaded algorithm IDs to prevent duplicates
const loadedAlgorithmIds = new Set();

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    loadCubes();
    loadAlgorithms();
    setupEventListeners();
});

// Load cubes for dropdowns
async function loadCubes() {
    try {
        const response = await fetch(`${API_BASE_URL}/kostki`);
        const cubes = await response.json();
        
        // Populate cube select in add form
        cubeSelect.innerHTML = '';
        cubes.forEach(cube => {
            const option = document.createElement('option');
            option.value = cube.id;
            option.textContent = `${cube.nazwa} (${cube.rozmiar})`;
            cubeSelect.appendChild(option);
        });
        
        // Populate cube select in filter
        filterCubeSelect.innerHTML = '<option value="all">All Cubes</option>';
        cubes.forEach(cube => {
            const option = document.createElement('option');
            option.value = cube.id;
            option.textContent = `${cube.nazwa} (${cube.rozmiar})`;
            filterCubeSelect.appendChild(option);
        });
        
        // Populate cube select in edit form
        const editCubeSelect = document.getElementById('edit-cube-select');
        editCubeSelect.innerHTML = '';
        cubes.forEach(cube => {
            const option = document.createElement('option');
            option.value = cube.id;
            option.textContent = `${cube.nazwa} (${cube.rozmiar})`;
            editCubeSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading cubes:', error);
        showNotification('Failed to load cubes. Please try again later.', 'error');
    }
}

// Load algorithms
async function loadAlgorithms(cubeId = null) {
    // Prevent multiple simultaneous loads
    if (isLoading) {
        return;
    }
    
    isLoading = true;
    
    try {
        // Clear the loaded IDs set
        loadedAlgorithmIds.clear();
        
        // Clear the list
        algorithmsList.innerHTML = '';
        
        let url = `${API_BASE_URL}/algorytmy`;
        if (cubeId && cubeId !== 'all') {
            url += `?kostka_id=${cubeId}`;
        }
        
        const response = await fetch(url);
        const algorithms = await response.json();
        
        // Only filter out the cleanup flag algorithm
        const activeAlgorithms = algorithms.filter(alg => 
            alg.nazwa !== '___CLEANUP_FLAG___'
        );
        
        console.log("Loaded algorithms:", activeAlgorithms.length, "out of", algorithms.length, "total");
        displayAlgorithms(activeAlgorithms);
    } catch (error) {
        console.error('Error loading algorithms:', error);
        showNotification('Failed to load algorithms. Please try again later.', 'error');
    } finally {
        isLoading = false;
    }
}

// Display algorithms in the list
function displayAlgorithms(algorithms) {
    algorithmsList.innerHTML = '';
    
    if (algorithms.length === 0) {
        algorithmsList.innerHTML = '<p class="no-algorithms">No algorithms found.</p>';
        return;
    }
    
    algorithms.forEach(algorithm => {
        // Skip if this algorithm ID is already displayed
        if (loadedAlgorithmIds.has(algorithm.id)) {
            return;
        }
        
        // Add this ID to our tracking set
        loadedAlgorithmIds.add(algorithm.id);
        
        const algorithmItem = document.createElement('div');
        algorithmItem.className = 'algorithm-item';
        algorithmItem.dataset.id = algorithm.id;
        
        // Get cube name for this algorithm
        getCubeName(algorithm.kostka_id).then(cubeName => {
            // Use the same image handling as in bibliotekaAlgorytmow.js
            let imgPath;
            
            // First check if we have a mapped image
            const mappedImage = algorithmImageMap[algorithm.notacja];
            
            if (algorithm.sciezka_obrazu) {
                // If the algorithm has a stored path, use it
                imgPath = `../${algorithm.sciezka_obrazu}`;
            } else {
                // Otherwise use the mapping or notation as filename
                const imageName = mappedImage || algorithm.notacja;
                imgPath = `../assets/images/algorithms/${imageName}.png`;
            }
            
            algorithmItem.innerHTML = `
                <div class="algorithm-info">
                    <div class="algorithm-image">
                        <img src="${imgPath}" alt="${algorithm.nazwa}" onerror="this.onerror=null; this.style.display='none';">
                    </div>
                    <div class="algorithm-details">
                        <h4>${algorithm.nazwa}</h4>
                        <p>${algorithm.notacja}</p>
                        <p>Cube: ${cubeName}</p>
                    </div>
                </div>
                <div class="algorithm-actions">
                    <button class="edit-btn" data-id="${algorithm.id}">Edit</button>
                    <button class="delete-btn" data-id="${algorithm.id}">Delete</button>
                </div>
            `;
            
            // Add event listeners to action buttons
            algorithmItem.querySelector('.edit-btn').addEventListener('click', () => {
                openEditModal(algorithm);
            });
            
            algorithmItem.querySelector('.delete-btn').addEventListener('click', () => {
                if (confirm(`Are you sure you want to delete "${algorithm.nazwa}"?`)) {
                    deleteAlgorithm(algorithm.id);
                }
            });
            
            algorithmsList.appendChild(algorithmItem);
        });
    });
}

// Get cube name by ID
async function getCubeName(cubeId) {
    try {
        const response = await fetch(`${API_BASE_URL}/kostki/${cubeId}`);
        const cube = await response.json();
        return `${cube.nazwa} (${cube.rozmiar})`;
    } catch (error) {
        console.error('Error fetching cube:', error);
        return 'Unknown Cube';
    }
}

// Set up event listeners
function setupEventListeners() {
    // Filter change
    filterCubeSelect.addEventListener('change', (e) => {
        loadAlgorithms(e.target.value);
    });
    
    // Add algorithm form submission
    addAlgorithmForm.addEventListener('submit', (e) => {
        e.preventDefault();
        addAlgorithm();
    });
    
    // Edit algorithm form submission
    editAlgorithmForm.addEventListener('submit', (e) => {
        e.preventDefault();
        updateAlgorithm();
    });
    
    // Close modal
    closeModalBtn.addEventListener('click', () => {
        editModal.style.display = 'none';
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === editModal) {
            editModal.style.display = 'none';
        }
    });
    
    // Clear database button
    clearDatabaseBtn.addEventListener('click', () => {
        confirmationModal.style.display = 'block';
    });
    
    // Confirmation modal buttons
    confirmYesBtn.addEventListener('click', () => {
        confirmationModal.style.display = 'none';
        clearAllAlgorithms();
    });
    
    confirmNoBtn.addEventListener('click', () => {
        confirmationModal.style.display = 'none';
    });
    
    // Close confirmation modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === confirmationModal) {
            confirmationModal.style.display = 'none';
        }
    });
}

// Add a new algorithm
async function addAlgorithm() {
    if (isLoading) return;
    
    const formData = new FormData();
    formData.append('kostka_id', cubeSelect.value);
    formData.append('nazwa', document.getElementById('algorithm-name').value);
    formData.append('notacja', document.getElementById('algorithm-notation').value);
    
    const imageFile = document.getElementById('algorithm-image').files[0];
    if (imageFile) {
        formData.append('obraz', imageFile);
    }
    
    try {
        isLoading = true;
        const response = await fetch(`${API_BASE_URL}/algorytmy`, {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log("Algorithm added:", result);
            showNotification('Algorithm added successfully!', 'success');
            addAlgorithmForm.reset();
            await new Promise(resolve => setTimeout(resolve, 500)); // Small delay to ensure server processes
            await loadAlgorithms();
        } else {
            const errorText = await response.text();
            try {
                const error = JSON.parse(errorText);
                throw new Error(error.error || 'Failed to add algorithm');
            } catch (jsonError) {
                throw new Error(`Failed to add algorithm: ${errorText.substring(0, 100)}`);
            }
        }
    } catch (error) {
        console.error('Error adding algorithm:', error);
        showNotification(error.message, 'error');
    } finally {
        isLoading = false;
    }
}

// Open edit modal
function openEditModal(algorithm) {
    document.getElementById('edit-algorithm-id').value = algorithm.id;
    document.getElementById('edit-cube-select').value = algorithm.kostka_id;
    document.getElementById('edit-algorithm-name').value = algorithm.nazwa;
    document.getElementById('edit-algorithm-notation').value = algorithm.notacja;
    
    const currentImage = document.getElementById('current-algorithm-image');
    
    // Use the same image handling as in the display function
    if (algorithm.sciezka_obrazu) {
        currentImage.src = `../${algorithm.sciezka_obrazu}`;
        currentImage.style.display = 'block';
    } else {
        // Try to use the mapping or notation as filename
        const mappedImage = algorithmImageMap[algorithm.notacja];
        const imageName = mappedImage || algorithm.notacja;
        currentImage.src = `../assets/images/algorithms/${imageName}.png`;
        currentImage.style.display = 'block';
        
        // Hide the image if it fails to load
        currentImage.onerror = () => {
            currentImage.style.display = 'none';
        };
    }
    
    editModal.style.display = 'block';
}

// Update an algorithm using the PUT endpoint
async function updateAlgorithm() {
    if (isLoading) return;
    isLoading = true;
    
    try {
        const algorithmId = document.getElementById('edit-algorithm-id').value;
        const cubeId = document.getElementById('edit-cube-select').value;
        const name = document.getElementById('edit-algorithm-name').value;
        const notation = document.getElementById('edit-algorithm-notation').value;
        
        // Check if an image file was selected
        const imageFile = document.getElementById('edit-algorithm-image').files[0];
        
        if (imageFile) {
            // If there's a new image, we need to use FormData
            const formData = new FormData();
            formData.append('kostka_id', cubeId);
            formData.append('nazwa', name);
            formData.append('notacja', notation);
            formData.append('obraz', imageFile);
            
            // For file uploads with PUT, we need to make a POST request
            // and then delete the original algorithm
            const response = await fetch(`${API_BASE_URL}/algorytmy`, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to update algorithm: ${errorText.substring(0, 100)}`);
            }
            
            // Delete the original algorithm
            const deleteResponse = await fetch(`${API_BASE_URL}/algorytmy/${algorithmId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            if (!deleteResponse.ok) {
                console.warn("Could not delete original algorithm, but update completed");
            }
        } else {
            // If no new image, we can use the normal PUT endpoint
            // First get the current algorithm to preserve any existing image path
            const currentAlg = await fetchAlgorithmById(algorithmId);
            if (!currentAlg) {
                throw new Error("Could not fetch current algorithm data");
            }
            
            // Update with PUT
            const response = await fetch(`${API_BASE_URL}/algorytmy/${algorithmId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    kostka_id: cubeId,
                    nazwa: name,
                    notacja: notation,
                    sciezka_obrazu: currentAlg.sciezka_obrazu // Preserve existing image path
                })
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to update algorithm: ${errorText.substring(0, 100)}`);
            }
        }
        
        showNotification('Algorithm updated successfully!', 'success');
        editModal.style.display = 'none';
        
        // Reload algorithms after a small delay to ensure server processes
        await new Promise(resolve => setTimeout(resolve, 800));
        await loadAlgorithms();
    } catch (error) {
        console.error('Error updating algorithm:', error);
        showNotification(error.message, 'error');
    } finally {
        isLoading = false;
    }
}

/**
 * Fetches an algorithm by its ID
 */
async function fetchAlgorithmById(algorithmId) {
    try {
        const response = await fetch(`${API_BASE_URL}/algorytmy/${algorithmId}`);
        if (!response.ok) {
            console.error(`Failed to fetch algorithm ${algorithmId}: ${response.statusText}`);
            return null;
        }
        return await response.json();
    } catch (error) {
        console.error(`Error fetching algorithm ${algorithmId}:`, error);
        return null;
    }
}

// Simplified delete approach using the DELETE endpoint
async function deleteAlgorithm(algorithmId) {
    try {
        const response = await fetch(`${API_BASE_URL}/algorytmy/${algorithmId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (response.ok) {
            console.log(`Algorithm ${algorithmId} deleted successfully`);
            showNotification('Algorithm deleted successfully', 'success');
            
            // Remove from UI immediately
            const item = document.querySelector(`[data-id="${algorithmId}"]`);
            if (item) item.remove();
        } else {
            console.error('Error deleting algorithm:', response.statusText);
            showNotification('Failed to delete algorithm', 'error');
        }
    } catch (error) {
        console.error('Error deleting algorithm:', error);
        showNotification('An error occurred while deleting the algorithm', 'error');
    }
}

// Function to clear all algorithms from the database
async function clearAllAlgorithms() {
    if (isLoading) return;
    isLoading = true;
    
    try {
        // First, get all algorithms
        const response = await fetch(`${API_BASE_URL}/algorytmy`);
        if (!response.ok) {
            throw new Error("Failed to fetch algorithms");
        }
        
        const algorithms = await response.json();
        
        if (algorithms.length === 0) {
            showNotification('No algorithms to delete', 'info');
            isLoading = false;
            return;
        }
        
        showNotification(`Found ${algorithms.length} algorithms. Starting deletion...`, 'info');
        console.log(`Starting deletion of ${algorithms.length} algorithms`);
        
        // Process algorithms in batches to avoid overwhelming the server
        const batchSize = 5;
        let deleted = 0;
        let failed = 0;
        
        for (let i = 0; i < algorithms.length; i += batchSize) {
            const batch = algorithms.slice(i, i + batchSize);
            
            // Process this batch
            const batchPromises = batch.map(async (algorithm) => {
                // Skip our cleanup flag algorithm if it exists
                if (algorithm.nazwa === '___CLEANUP_FLAG___') {
                    console.log('Skipping cleanup flag algorithm');
                    return;
                }
                
                try {
                    // Use DELETE endpoint to remove the algorithm
                    const result = await fetch(`${API_BASE_URL}/algorytmy/${algorithm.id}`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (result.ok) {
                        console.log(`Successfully deleted algorithm #${algorithm.id}: ${algorithm.nazwa}`);
                        deleted++;
                    } else {
                        console.error(`Failed to delete algorithm #${algorithm.id}: ${algorithm.nazwa}`);
                        failed++;
                    }
                } catch (err) {
                    console.error(`Error processing algorithm #${algorithm.id}:`, err);
                    failed++;
                }
            });
            
            // Wait for this batch to complete
            await Promise.all(batchPromises);
            
            // Update the user after each batch
            if ((i + batchSize) % 20 === 0 || i + batchSize >= algorithms.length) {
                showNotification(`Progress: ${deleted} deleted, ${failed} failed`, 'info');
            }
            
            // Wait a moment to avoid overwhelming the server
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        // Final success message
        showNotification(`Database cleaned: ${deleted} algorithms deleted, ${failed} failed`, 'success');
        
        // Reload the list after a longer delay - give the server time to recover
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Force a clean reload
        window.location.reload();
    } catch (error) {
        console.error('Error clearing algorithms:', error);
        showNotification(`Failed to clear algorithms: ${error.message}`, 'error');
    } finally {
        isLoading = false;
    }
}

// Show notification
function showNotification(message, type) {
    // Check if notification container exists
    let notificationContainer = document.querySelector('.notification-container');
    
    if (!notificationContainer) {
        // Create notification container if it doesn't exist
        notificationContainer = document.createElement('div');
        notificationContainer.className = 'notification-container';
        document.body.appendChild(notificationContainer);
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .notification-container {
                position: fixed;
                top: 2vh;
                right: 2vh;
                z-index: 1000;
            }
            
            .notification {
                padding: 1.5vh 2vh;
                margin-bottom: 1vh;
                border-radius: 0.5vh;
                color: white;
                font-family: 'Arial', sans-serif;
                font-size: 2vh;
                display: flex;
                justify-content: space-between;
                align-items: center;
                min-width: 30vh;
                max-width: 50vh;
                box-shadow: 0 0.3vh 0.5vh rgba(0,0,0,0.2);
            }
            
            .notification.success {
                background-color: #4CAF50;
            }
            
            .notification.error {
                background-color: #F44336;
            }
            
            .notification.warning {
                background-color: #FF9800;
            }
            
            .notification.info {
                background-color: #2196F3;
            }
            
            .notification .close-btn {
                cursor: pointer;
                margin-left: 1vh;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <span class="close-btn">&times;</span>
    `;
    
    // Add to container
    notificationContainer.appendChild(notification);
    
    // Add close button functionality
    notification.querySelector('.close-btn').addEventListener('click', () => {
        notification.remove();
    });
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        notification.remove();
    }, 5000);
} 