function getCurrentPage() {
  const file = location.pathname.split('/').pop();
  if (!file || file === 'index.html') return 'index';
  if (file === 'Simulateur.html') return 'simulateur';
  if (file === 'MondeAntique.html') return 'monde';
  return file;
}

function updateNavNotifications() {
  const notifications = JSON.parse(localStorage.getItem('imperiumNotifications') || '[]');
  const counts = {};
  notifications.forEach(n => { counts[n.page] = (counts[n.page] || 0) + 1; });
  document.querySelectorAll('#navPopup a').forEach(link => {
    const page = link.dataset.page;
    const badge = link.querySelector('.nav-notif');
    const count = counts[page] || 0;
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'inline-block' : 'none';
    }
  });
}

function markNotificationsAsRead(page) {
  const notifications = JSON.parse(localStorage.getItem('imperiumNotifications') || '[]');
  const filtered = notifications.filter(n => n.page !== page);
  localStorage.setItem('imperiumNotifications', JSON.stringify(filtered));
}

window.addNotification = function(page, message) {
  const notifications = JSON.parse(localStorage.getItem('imperiumNotifications') || '[]');
  notifications.push({ page, message, time: Date.now() });
  localStorage.setItem('imperiumNotifications', JSON.stringify(notifications));
  if (typeof updateNavNotifications === 'function') updateNavNotifications();
};

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
      markNotificationsAsRead(getCurrentPage());
      updateNavNotifications();
    })
    .catch(err => console.error('Failed to load navigation:', err));
});
