import { ensureSeeded, logout, resetDemoData, currentUser } from './core/auth.js';
import { defineRoutes, startRouter, navigate } from './core/router.js';
import { storageAvailable } from './core/storage.js';
import { confirmDialog, toast } from './ui/feedback.js';

ensureSeeded();

defineRoutes([
  { path: '/', layout: 'public', load: () => import('./pages/public/landing.js') },
  { path: '/tentang', layout: 'public', load: () => import('./pages/public/about.js') },
  { path: '/masuk', layout: 'bare', guestOnly: true, load: () => import('./pages/public/login.js') },
  { path: '/daftar', layout: 'bare', guestOnly: true, load: () => import('./pages/public/register.js') },
  { path: '/lupa-sandi', layout: 'bare', guestOnly: true, load: () => import('./pages/public/forgot.js') },

  { path: '/belajar', layout: 'app', auth: 'student', load: () => import('./pages/student/home.js') },
  { path: '/belajar/misi', layout: 'app', auth: 'student', load: () => import('./pages/student/missions.js') },
  { path: '/belajar/misi/:id', layout: 'app', auth: 'student', load: () => import('./pages/student/lab.js') },
  { path: '/belajar/progres', layout: 'app', auth: 'student', load: () => import('./pages/student/progress.js') },

  { path: '/guru', layout: 'app', auth: 'teacher', load: () => import('./pages/teacher/class.js') },
  { path: '/guru/siswa/:id', layout: 'app', auth: 'teacher', load: () => import('./pages/teacher/student.js') },
  { path: '/guru/miskonsepsi', layout: 'app', auth: 'teacher', load: () => import('./pages/teacher/library.js') },
  { path: '/guru/misi', layout: 'app', auth: 'teacher', load: () => import('./pages/teacher/bank.js') },

  { path: '/akun', layout: 'app', auth: 'any', load: () => import('./pages/shared/account.js') },
  { path: '*', layout: 'public', load: () => import('./pages/public/not-found.js') },
]);

// Global actions available from any layout.
document.addEventListener('click', async (event) => {
  const trigger = event.target.closest('[data-action]');
  if (!trigger) return;
  const action = trigger.dataset.action;

  if (action === 'logout') {
    event.preventDefault();
    const name = currentUser()?.name?.split(' ')[0];
    logout();
    toast(name ? `Sampai jumpa, ${name}. Kamu sudah keluar.` : 'Kamu sudah keluar.', { type: 'success' });
    navigate('/masuk', { replace: true });
  }

  if (action === 'reset-demo') {
    event.preventDefault();
    const ok = await confirmDialog({
      title: 'Reset semua data demo?',
      body: 'Akun yang kamu daftarkan, progres misi, dan riwayat latihan di browser ini akan dihapus. Akun demo dan data awalnya dipulihkan seperti semula. Kamu juga akan keluar.',
      confirmText: 'Reset data demo',
    });
    if (!ok) return;
    resetDemoData();
    toast('Data demo sudah dipulihkan. Masuk lagi untuk melanjutkan.', { type: 'success' });
    navigate('/masuk', { replace: true });
  }
});

if (!storageAvailable()) {
  setTimeout(() => toast('Penyimpanan browser tidak tersedia. Progres hanya bertahan sampai halaman ditutup.', { type: 'error', timeout: 0 }), 600);
}

startRouter(document.getElementById('app'));
