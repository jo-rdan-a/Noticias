// Highlight active sidebar links
document.addEventListener('DOMContentLoaded', () => {
  const current = window.location.pathname;
  document.querySelectorAll('.sidebar-link').forEach(link => {
    if (link.getAttribute('href') === current) {
      link.style.background = 'rgba(255,255,255,.12)';
      link.style.color = '#fff';
    }
  });
});
