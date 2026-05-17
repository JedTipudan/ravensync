import { register } from '../services/auth.js';
import { showToast } from '../utils/toast.js';

const COLLEGES = {
  'College of Engineering and Technology': [
    'BS Information Technology',
    'BS Computer Engineering',
    'BS Electronics Engineering',
    'BS Civil Engineering',
    'BS Electrical Engineering',
    'BS Mechanical Engineering',
    'BS Industrial Engineering',
    'BS Chemical Engineering',
    'BS Environmental Engineering',
  ],
  'College of Arts and Sciences': [
    'BS Biology',
    'BS Mathematics',
    'BS Statistics',
    'BS Physics',
    'BS Chemistry',
    'BS Environmental Science',
    'AB English Language Studies',
    'AB Communication',
    'AB Political Science',
    'AB Sociology',
    'AB Philosophy',
  ],
  'College of Business and Management': [
    'BS Business Administration major in Marketing Management',
    'BS Business Administration major in Financial Management',
    'BS Business Administration major in Human Resource Management',
    'BS Business Administration major in Operations Management',
    'BS Accountancy',
    'BS Management Accounting',
    'BS Office Administration',
    'BS Entrepreneurship',
    'BS Cooperatives',
  ],
  'College of Education': [
    'Bachelor of Elementary Education',
    'Bachelor of Secondary Education major in English',
    'Bachelor of Secondary Education major in Mathematics',
    'Bachelor of Secondary Education major in Science',
    'Bachelor of Secondary Education major in Filipino',
    'Bachelor of Secondary Education major in Social Studies',
    'Bachelor of Secondary Education major in Values Education',
    'Bachelor of Physical Education',
    'Bachelor of Technical-Vocational Teacher Education',
    'Bachelor of Early Childhood Education',
    'Bachelor of Special Needs Education',
  ],
  'College of Nursing and Health Sciences': [
    'BS Nursing',
    'BS Midwifery',
    'BS Medical Technology',
    'BS Pharmacy',
    'BS Radiologic Technology',
    'BS Physical Therapy',
    'BS Nutrition and Dietetics',
    'BS Public Health',
  ],
  'College of Agriculture and Natural Resources': [
    'BS Agriculture major in Crop Science',
    'BS Agriculture major in Animal Science',
    'BS Agriculture major in Soil Science',
    'BS Agriculture major in Agricultural Economics',
    'BS Fisheries',
    'BS Forestry',
    'BS Agricultural Engineering',
    'BS Food Technology',
    'BS Horticulture',
  ],
  'College of Criminology': [
    'BS Criminology',
  ],
  'College of Law': [
    'Juris Doctor',
  ],
  'Graduate School': [
    'Master of Arts in Education',
    'Master of Arts in Teaching',
    'Master in Business Administration',
    'Master of Science in Information Technology',
    'Master of Science in Agriculture',
    'Master of Science in Nursing',
    'Master of Public Administration',
    'Doctor of Philosophy in Education',
    'Doctor of Philosophy in Agriculture',
  ],
};

const YEAR_LEVELS = [
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year',
  '5th Year',
  'Graduate Student',
  'Irregular',
];

export function renderRegister(app) {
  app.innerHTML = `
    <div class="min-h-screen animated-bg flex items-center justify-center p-4">
      <div class="w-full max-w-2xl">
        <div class="text-center mb-8">
          <a href="/" onclick="event.preventDefault(); navigate('/')" class="inline-flex items-center gap-3 mb-6">
            <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl">
              <img src="/images/logo.png" alt="RavenSync" class="w-10 h-10 object-contain" onerror="this.outerHTML='🦅'"/>
            </div>
            <span class="text-2xl font-black gradient-text">RavenSync</span>
          </a>
          <h1 class="text-2xl font-bold mb-2">Student Registration</h1>
          <p class="text-slate-400 text-sm">Create your DOrSU emergency account</p>
        </div>

        <div class="glass rounded-2xl border border-white/10 p-8 shadow-2xl">

          <!-- DOrSU banner -->
          <div class="flex items-center gap-3 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 mb-6">
            <span class="text-2xl">🎓</span>
            <div>
              <div class="text-sm font-medium text-indigo-300">Davao Oriental State University</div>
              <div class="text-xs text-slate-400">DOrSU Student Emergency Network — Mati City, Davao Oriental</div>
            </div>
          </div>

          <form id="register-form" class="space-y-5">

            <!-- Personal Info -->
            <div>
              <div class="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Personal Information</div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-slate-300 mb-2">Full Name *</label>
                  <div class="relative">
                    <i class="fa-solid fa-user absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm"></i>
                    <input type="text" id="name" class="input pl-10" placeholder="Juan dela Cruz" required/>
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-300 mb-2">Username *</label>
                  <div class="relative">
                    <i class="fa-solid fa-at absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm"></i>
                    <input type="text" id="username" class="input pl-10" placeholder="juandelacruz" required/>
                  </div>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-2">Student ID Number *</label>
                <div class="relative">
                  <i class="fa-solid fa-id-card absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm"></i>
                  <input type="text" id="student-id" class="input pl-10" placeholder="e.g. 2021-00123" required/>
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-2">Phone Number</label>
                <div class="relative">
                  <i class="fa-solid fa-phone absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm"></i>
                  <input type="tel" id="phone" class="input pl-10" placeholder="e.g. 09XX-XXX-XXXX"/>
                </div>
              </div>
            </div>

            <!-- Academic Info -->
            <div>
              <div class="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Academic Information</div>
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-2">University</label>
                <div class="relative">
                  <i class="fa-solid fa-building-columns absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm"></i>
                  <input type="text" class="input pl-10 opacity-60 cursor-not-allowed" value="Davao Oriental State University" readonly/>
                </div>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">College / Department *</label>
              <div class="relative">
                <i class="fa-solid fa-sitemap absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm"></i>
                <select id="college" class="input pl-10" required>
                  <option value="">Select college...</option>
                  ${Object.keys(COLLEGES).map(c => `<option value="${c}">${c}</option>`).join('')}
                </select>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Course / Program *</label>
              <div class="relative">
                <i class="fa-solid fa-book absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm"></i>
                <select id="course" class="input pl-10" required>
                  <option value="">Select college first...</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Year Level *</label>
              <div class="relative">
                <i class="fa-solid fa-layer-group absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm"></i>
                <select id="year-level" class="input pl-10" required>
                  <option value="">Select year level...</option>
                  ${YEAR_LEVELS.map(y => `<option value="${y}">${y}</option>`).join('')}
                </select>
              </div>
            </div>

            <!-- Account Security -->
            <div>
              <div class="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Account Security</div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-slate-300 mb-2">Password *</label>
                  <div class="relative">
                    <i class="fa-solid fa-lock absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm"></i>
                    <input type="password" id="password" class="input pl-10" placeholder="Min. 6 characters" required minlength="6"/>
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-300 mb-2">Confirm Password *</label>
                  <div class="relative">
                    <i class="fa-solid fa-lock absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm"></i>
                    <input type="password" id="confirm-password" class="input pl-10" placeholder="Repeat password" required/>
                  </div>
                </div>
              </div>
              <div class="mt-2 space-y-1">
                <div class="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div id="pw-strength-bar" class="h-full rounded-full transition-all duration-300" style="width:0%"></div>
                </div>
                <div id="pw-strength-label" class="text-xs text-slate-600"></div>
              </div>
            </div>

            <label class="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" id="terms" class="mt-1 rounded border-white/20 bg-white/5" required/>
              <span class="text-sm text-slate-400">I agree to the <a href="#" class="text-indigo-400">Terms of Service</a> and <a href="#" class="text-indigo-400">Privacy Policy</a></span>
            </label>

            <button type="submit" id="register-btn" class="btn btn-primary w-full py-3 text-base">
              <span id="register-text">🎓 Create Student Account</span>
              <div id="register-spinner" class="spinner hidden"></div>
            </button>
          </form>

          <div class="divider"></div>

          <div class="text-center text-sm text-slate-400">
            Already have an account?
            <a href="/login" onclick="event.preventDefault(); navigate('/login')" class="text-indigo-400 hover:text-indigo-300 font-medium ml-1">Sign in</a>
          </div>

          <div class="mt-4 text-center">
            <p class="text-xs text-slate-600">Are you a faculty or admin?
              <span class="text-slate-500">Contact your Super Admin to get an account created for you.</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  `;

  // Update courses when college changes
  document.getElementById('college')?.addEventListener('change', (e) => {
    const courseSelect = document.getElementById('course');
    const courses = COLLEGES[e.target.value] || [];
    courseSelect.innerHTML = courses.length
      ? `<option value="">Select course...</option>` + courses.map(c => `<option value="${c}">${c}</option>`).join('')
      : `<option value="">Select college first...</option>`;
  });

  // Password strength meter
  document.getElementById('password')?.addEventListener('input', (e) => {
    const val = e.target.value;
    const bar = document.getElementById('pw-strength-bar');
    const label = document.getElementById('pw-strength-label');
    let strength = 0;
    if (val.length >= 6) strength++;
    if (val.length >= 10) strength++;
    if (/[A-Z]/.test(val)) strength++;
    if (/[0-9]/.test(val)) strength++;
    if (/[^A-Za-z0-9]/.test(val)) strength++;
    const levels = [
      { w: '0%', color: '', text: '' },
      { w: '25%', color: '#ef4444', text: 'Weak' },
      { w: '50%', color: '#f59e0b', text: 'Fair' },
      { w: '75%', color: '#6366f1', text: 'Good' },
      { w: '90%', color: '#10b981', text: 'Strong' },
      { w: '100%', color: '#10b981', text: 'Very Strong' },
    ];
    const lvl = levels[Math.min(strength, 5)];
    bar.style.width = lvl.w;
    bar.style.background = lvl.color;
    label.textContent = lvl.text;
    label.style.color = lvl.color;
  });

  document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const password = document.getElementById('password').value;
    const confirm = document.getElementById('confirm-password').value;
    if (password !== confirm) { showToast('Passwords do not match', 'error'); return; }

    const course = document.getElementById('course').value;
    if (!course) { showToast('Please select your course', 'error'); return; }

    const college = document.getElementById('college').value;
    const yearLevel = document.getElementById('year-level').value;
    const department = `${college} — ${yearLevel}`;

    const btn = document.getElementById('register-btn');
    const text = document.getElementById('register-text');
    const spinner = document.getElementById('register-spinner');
    btn.disabled = true;
    text.textContent = 'Creating account...';
    spinner.classList.remove('hidden');

    try {
      await register({
        name: document.getElementById('name').value.trim(),
        username: document.getElementById('username').value.trim(),
        password,
        role: 'user',
        organization: 'Davao Oriental State University',
        department,
        phone: document.getElementById('phone').value.trim() || undefined,
        studentId: document.getElementById('student-id').value.trim(),
        course,
        yearLevel,
        section: '',
      });
      showToast('Account created! Welcome to RavenSync.', 'success');
      navigate('/dashboard');
    } catch (error) {
      showToast(error.message || 'Registration failed', 'error');
    } finally {
      btn.disabled = false;
      text.innerHTML = '🎓 Create Student Account';
      spinner.classList.add('hidden');
    }
  });
}
