// feature-tour.js

export function initialiseFeatureTour() {
  // Check if it's first visit
  const hasVisited = localStorage.getItem('udp-tour-completed');
  
  if (!hasVisited) {
    // Show welcome modal for first-time users
    showWelcomeModal();
  }
  
  // Setup tour button in sidebar
  setupTourButton();
}

function showWelcomeModal() {
  // Create welcome modal
  const modalHTML = `
    <div class="modal fade" id="welcomeModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header border-0 pb-0">
            <h5 class="modal-title text-center w-100" style="color: #000F9F; font-family: 'NeueHaasGrotTextMedium', sans-serif;">
              Welcome to Urban Data Platform! 🌍
            </h5>
          </div>
          <div class="modal-body text-center">
            <p class="mb-4" style="font-size: 1.1rem; line-height: 1.6;">
              Explore climate and environmental data through interactive maps. 
              We'd love to show you around!
            </p>
            <p class="text-muted mb-4">
              The tour takes about 2 minutes and covers all the main features.
            </p>
            <div class="d-grid gap-2">
              <button type="button" class="btn btn-primary btn-lg" id="startTourBtn" style="background: #000F9F; border-color: #000F9F;">
                🚀 Start the Tour
              </button>
              <button type="button" class="btn btn-outline-secondary" id="skipTourBtn">
                Skip for now
              </button>
            </div>
          </div>
          <div class="modal-footer border-0 pt-0">
            <small class="text-muted mx-auto">
              You can always access the tour later from the sidebar
            </small>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Add modal to page
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  // Show modal
  const modal = new bootstrap.Modal(document.getElementById('welcomeModal'));
  modal.show();
  
  // Handle tour start
  document.getElementById('startTourBtn').addEventListener('click', () => {
    modal.hide();
    startTour();
    localStorage.setItem('udp-tour-completed', 'true');
  });
  
  // Handle skip
  document.getElementById('skipTourBtn').addEventListener('click', () => {
    modal.hide();
    localStorage.setItem('udp-tour-completed', 'true');
  });
  
  // Clean up modal after hide
  document.getElementById('welcomeModal').addEventListener('hidden.bs.modal', () => {
    document.getElementById('welcomeModal').remove();
  });
}

function setupTourButton() {
  const tourIcon = document.getElementById('icon-tour');
  if (tourIcon) {
    tourIcon.addEventListener('click', () => {
      console.log('🎯 Feature tour started manually');
      startTour();
    });
  }
}

function startTour() {
  console.log('🎯 startTour() called');
  
  // Check if introJs is available
  if (typeof introJs === 'undefined') {
    console.error('❌ introJs is not defined - library not loaded');
    alert('Tour library not loaded. Please refresh the page.');
    return;
  }
  
  console.log('✅ introJs library available');
  
  // Check for tour elements
  const tourElements = document.querySelectorAll('[data-intro]');
  console.log('📍 Found tour elements:', tourElements.length);
  
  // Configure Intro.js
  const intro = introJs();

  intro.setOptions({
    nextLabel: '→',
    prevLabel: '←',
    skipLabel: '×',
    doneLabel: 'Got it! 🎉',
    showProgress: true,
    showBullets: false,
    exitOnOverlayClick: false,
    disableInteraction: false,
    scrollToElement: true,
    scrollPadding: 30,
    tooltipClass: 'udp-tour-tooltip'
  });
  
  // Add custom styling
  intro.oncomplete(() => {
    console.log('✅ Feature tour completed');
    showCompletionMessage();
  });
  
  intro.onexit(() => {
    console.log('📤 Feature tour exited');
  });
  
  // Start the tour
  intro.start();
}

function showCompletionMessage() {
  // Simple completion toast
  const toast = document.createElement('div');
  toast.className = 'position-fixed top-0 start-50 translate-middle-x mt-3';
  toast.style.zIndex = '9999';
  toast.innerHTML = `
    <div class="alert alert-success alert-dismissible fade show" role="alert">
      <strong>🎉 Tour Complete!</strong> You're all set to explore the Urban Data Platform.
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
  `;
  
  document.body.appendChild(toast);
  
  // Auto-remove after 4 seconds
  setTimeout(() => {
    toast.remove();
  }, 4000);
}