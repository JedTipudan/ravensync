import { login } from '../services/auth.js';
import { showToast } from '../utils/toast.js';
import { initTheme } from '../services/theme.js';

export function renderLogin(app) {
  app.innerHTML = `
    <div class="min-h-screen animated-bg flex items-center justify-center p-4">
      <div class="w-full max-w-md">
        <div class="text-center mb-8">
          <a href="/" onclick="event.preventDefault(); navigate('/')" class="inline-flex items-center gap-3 mb-6">
            <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl">
              <img src="/images/logo.png" alt="RavenSync" class="w-10 h-10 object-contain" onerror="this.outerHTML='🦅'"/>
            </div>
            <span class="text-2xl font-black gradient-text">RavenSync</span>
          </a>
          <h1 class="text-2xl font-bold mb-2">Welcome back</h1>
          <p class="text-slate-400 text-sm">Sign in to your emergency command center</p>
        </div>

        <div class="glass rounded-2xl border border-white/10 p-8 shadow-2xl">
          <form id="login-form" class="space-y-5">
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Username</label>
              <div class="relative">
                <i class="fa-solid fa-user absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm"></i>
                <input type="text" id="username" class="input pl-10" placeholder="Enter your username" required/>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <div class="relative">
                <i class="fa-solid fa-lock absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm"></i>
                <input type="password" id="password" class="input pl-10 pr-10" placeholder="••••••••" required/>
                <button type="button" onclick="togglePassword()" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  <i class="fa-solid fa-eye" id="eye-icon"></i>
                </button>
              </div>
            </div>

            <button type="submit" id="login-btn" class="btn btn-primary w-full py-3 text-base">
              <span id="login-text">Sign In</span>
              <div id="login-spinner" class="spinner hidden"></div>
            </button>

            <div id="login-error" class="hidden flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <i class="fa-solid fa-circle-exclamation flex-shrink-0"></i>
              <span id="login-error-msg"></span>
            </div>
          </form>

          <div class="divider"></div>

          <div class="text-center text-sm text-slate-400">
            Don't have an account?
            <a href="/register" onclick="event.preventDefault(); navigate('/register')" class="text-indigo-400 hover:text-indigo-300 font-medium ml-1">Create account</a>
          </div>


        </div>

        <p class="text-center text-xs text-slate-600 mt-6">
          Protected by enterprise-grade security · JWT · bcrypt
        </p>
      </div>
    </div>
  `;

  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    // Hide any previous error
    document.getElementById('login-error')?.classList.add('hidden');
    const btn = document.getElementById('login-btn');
    const text = document.getElementById('login-text');
    const spinner = document.getElementById('login-spinner');

    btn.disabled = true;
    text.textContent = 'Signing in...';
    spinner.classList.remove('hidden');

    try {
      await login(
        document.getElementById('username').value,
        document.getElementById('password').value
      );
      showToast('Welcome back to RavenSync!', 'success');
      navigate('/dashboard');
    } catch (error) {
      const errEl = document.getElementById('login-error');
      const errMsg = document.getElementById('login-error-msg');
      const msg = error.message || 'Login failed';
      errMsg.textContent = msg.includes('Invalid') ? 'Incorrect username or password. Please try again.' : msg;
      errEl.classList.remove('hidden');
      document.getElementById('password').value = '';
      document.getElementById('password').focus();
    } finally {
      btn.disabled = false;
      text.textContent = 'Sign In';
      spinner.classList.add('hidden');
    }
  });

  window.togglePassword = () => {
    const input = document.getElementById('password');
    const icon = document.getElementById('eye-icon');
    if (input.type === 'password') {
      input.type = 'text';
      icon.className = 'fa-solid fa-eye-slash';
    } else {
      input.type = 'password';
      icon.className = 'fa-solid fa-eye';
    }
  };
}
