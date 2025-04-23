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
                    <img src="../assets/images/ratchet.png" class="settings-icon" alt="Settings">
                    <img src="../assets/images/user.png" class="user-icon" alt="User">
                </div>
            </div>
        `;

        // Add event listeners if needed
        this.querySelector('.settings-icon').addEventListener('click', () => {
            // Handle settings icon click
            console.log('Settings clicked');
        });

        this.querySelector('.user-icon').addEventListener('click', () => {
            // Handle user icon click
            console.log('User clicked');
        });
    }
}


// Define the custom element
customElements.define('header-component', Header); 