class Header extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.innerHTML = `
            <link rel="stylesheet" href="../components/header/header.css">
            <div class="header-component">
                <div class="logo" onclick="openPage('home.html')">Rubik's Sensei</div>
                <div class="icons">
                    <div class="settings-container">
                        <img src="../assets/images/ratchet.png" class="settings-icon" alt="Settings">
                        <div class="settings-dropdown">
                            <div class="dropdown-item" onclick="openPage('settings.html')">Settings</div>
                            <div class="dropdown-item" onclick="openPage('admin-panel.html')">Admin Panel</div>
                        </div>
                    </div>
                    <img src="../assets/images/user.png" class="user-icon" alt="User">
                </div>
            </div>
        `;

        // Add event listeners if needed
        this.querySelector('.user-icon').addEventListener('click', () => {
            // Handle user icon click
            console.log('User clicked');
        });
    }
}


// Define the custom element
customElements.define('header-component', Header); 