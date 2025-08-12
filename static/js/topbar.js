// topbar.js
import { exportVisibleMap } from './export.js';

// Setup topbar functionality
export function setupTopbar() {
  console.log('🔧 Setting up topbar...');
  
  setupTopbarExportButton();
  setupTopbarAccountIcon();
}

// Export button functionality
function setupTopbarExportButton() {
  const exportButton = document.getElementById('topbar-export-btn');
  if (!exportButton) {
    console.warn('Topbar export button not found');
    return;
  }

  exportButton.addEventListener('click', (e) => {
    if (!exportButton.disabled) {
      console.log('🖼️ Export button clicked from topbar');
      exportVisibleMap();
    }
  });
  
  // Initial state update
  updateTopbarExportButtonState();
  
  console.log('✅ Topbar export button setup complete');
}

// Update export button state based on active layers/boundaries
export function updateTopbarExportButtonState() {
  const exportButton = document.getElementById('topbar-export-btn');
  if (!exportButton) return;
  
  // Check if any layers are active
  const hasActiveLayers = Object.values(window.sidebarState?.layers || {}).some(isActive => isActive);
  const hasActiveBoundaries = Object.values(window.sidebarState?.boundaries || {}).some(isActive => isActive);
  const hasActiveContent = hasActiveLayers || hasActiveBoundaries;
  
  exportButton.disabled = !hasActiveContent;
  
  if (hasActiveContent) {
    exportButton.title = 'Export current map view as JPEG';
  } else {
    exportButton.title = 'Add layers or boundaries to enable export';
  }
  
  console.log('📊 Export button state updated:', {
    hasActiveLayers,
    hasActiveBoundaries,
    disabled: exportButton.disabled
  });
}

// Account icon functionality
function setupTopbarAccountIcon() {
  const accountIcon = document.getElementById('topbar-account');
  if (!accountIcon) {
    console.warn('Topbar account icon not found');
    return;
  }

  accountIcon.addEventListener('click', (e) => {
    console.log('🔍 Account icon clicked');
    e.stopPropagation();
    
    // Toggle selected state like sidebar icons
    const isCurrentlySelected = accountIcon.classList.contains('selected');
    
    if (isCurrentlySelected) {
      // If already selected, remove selection and close menu
      accountIcon.classList.remove('selected');
      document.querySelector('.account-dropdown')?.remove();
    } else {
      // Remove selected class from all sidebar icons
      document.querySelectorAll('.sidebar-icon').forEach(icon => {
        icon.classList.remove('selected');
      });
      
      // Add selected class to account icon
      accountIcon.classList.add('selected');
      
      // Show account menu
      showAccountMenu();
    }
  });
}

// Show account dropdown menu
function showAccountMenu() {
  // Remove existing dropdown
  document.querySelector('.account-dropdown')?.remove();
  
  // Create dropdown menu
  const dropdown = document.createElement('div');
  dropdown.className = 'account-dropdown';
  dropdown.innerHTML = `
    <div class="account-menu">
      <div class="account-menu-item" onclick="handleAccountAction('profile')">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="8" cy="4" r="3"/>
          <path d="M2 14c0-3 4-3 6-3s6 0 6 3"/>
        </svg>
        Profile
      </div>
      <div class="account-menu-item" onclick="handleAccountAction('settings')">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
        Settings
      </div>
      <hr class="account-menu-divider">
      <div class="account-menu-item" onclick="handleAccountAction('logout')">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16,17 21,12 16,7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
        Sign Out
      </div>
    </div>
  `;

  // Position dropdown from the right side
  dropdown.style.cssText = `
    position: fixed;
    top: 60px;
    right: 20px;
    z-index: 9999;
    animation: fadeIn 0.2s ease;
  `;

  document.body.appendChild(dropdown);

  // Close dropdown when clicking outside
  setTimeout(() => {
    document.addEventListener('click', function closeDropdown(e) {
      if (!dropdown.contains(e.target) && !e.target.closest('#topbar-account')) {
        dropdown.remove();
        document.getElementById('topbar-account')?.classList.remove('selected');
        document.removeEventListener('click', closeDropdown);
      }
    });
  }, 100);
}

// Account action handler
window.handleAccountAction = function(action) {
  console.log('🔧 Account action:', action);
  
  // Remove dropdown and selected state
  document.querySelector('.account-dropdown')?.remove();
  document.getElementById('topbar-account')?.classList.remove('selected');
  
  // Handle different actions
  switch(action) {
    case 'profile':
      alert('Profile functionality coming soon!');
      break;
    case 'settings':
      alert('Settings functionality coming soon!');
      break;
    case 'logout':
      if (confirm('Are you sure you want to sign out?')) {
        alert('Logout functionality coming soon!');
      }
      break;
  }
};