document.addEventListener('DOMContentLoaded', () => {
  fetch('nav.html')
    .then(response => response.text())
    .then(html => {
      document.body.insertAdjacentHTML('afterbegin', html);
      const navButton = document.getElementById('navButton');
      const navPopup = document.getElementById('navPopup');
      if (!navButton || !navPopup) return;
      navButton.addEventListener('click', () => {
        navPopup.classList.toggle('active');
      });
      document.addEventListener('click', (e) => {
        if (!navButton.contains(e.target) && !navPopup.contains(e.target)) {
          navPopup.classList.remove('active');
        }
      });
    })
    .catch(err => console.error('Failed to load navigation:', err));
});
