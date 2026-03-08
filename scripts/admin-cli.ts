// scripts/admin-cli.ts
import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// ═══════════════════════════════════════════════
// 🎨 Terminal Colors & Styles
// ═══════════════════════════════════════════════
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  underline: '\x1b[4m',
  blink: '\x1b[5m',
  inverse: '\x1b[7m',
  strikethrough: '\x1b[9m',

  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',

  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m',
};

// ═══════════════════════════════════════════════
// 🧩 UI Helper Functions
// ═══════════════════════════════════════════════
const WIDTH = 60;

function box(
  title: string,
  content: string[],
  color: string = c.cyan
): string {
  const top = `${color}╔${'═'.repeat(WIDTH - 2)}╗${c.reset}`;
  const bot = `${color}╚${'═'.repeat(WIDTH - 2)}╝${c.reset}`;
  const empty = `${color}║${' '.repeat(WIDTH - 2)}║${c.reset}`;
  const divider = `${color}╟${'─'.repeat(WIDTH - 2)}╢${c.reset}`;

  const titleLine = centerInBox(title, color);

  const lines = [top, empty, titleLine, empty, divider, empty];
  for (const line of content) {
    lines.push(padInBox(line, color));
  }
  lines.push(empty, bot);
  return lines.join('\n');
}

function centerInBox(text: string, borderColor: string): string {
  const stripped = stripAnsi(text);
  const pad = Math.max(0, WIDTH - 2 - stripped.length);
  const left = Math.floor(pad / 2);
  const right = pad - left;
  return `${borderColor}║${c.reset}${' '.repeat(left)}${text}${' '.repeat(right)}${borderColor}║${c.reset}`;
}

function padInBox(text: string, borderColor: string): string {
  const stripped = stripAnsi(text);
  const pad = Math.max(0, WIDTH - 4 - stripped.length);
  return `${borderColor}║${c.reset}  ${text}${' '.repeat(pad)}${borderColor}║${c.reset}`;
}

function stripAnsi(str: string): string {
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

function separator(char: string = '─', color: string = c.dim): string {
  return `${color}  ${char.repeat(WIDTH - 4)}${c.reset}`;
}

function badge(
  text: string,
  bg: string = c.bgCyan,
  fg: string = c.white
): string {
  return `${bg}${fg}${c.bold} ${text} ${c.reset}`;
}

function statusDot(status: string): string {
  const map: Record<string, string> = {
    active: `${c.green}●${c.reset}`,
    blocked: `${c.red}●${c.reset}`,
    suspended: `${c.yellow}●${c.reset}`,
  };
  return map[status] || `${c.gray}●${c.reset}`;
}

function roleBadge(role: string): string {
  const map: Record<string, string> = {
    admin: badge('ADMIN', c.bgRed),
    editor: badge('EDITOR', c.bgYellow, '\x1b[30m'),
    viewer: badge('VIEWER', c.bgBlue),
  };
  return map[role] || role;
}

async function spinner(text: string, duration: number = 800): Promise<void> {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let i = 0;
  const start = Date.now();
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      process.stdout.write(
        `\r  ${c.cyan}${frames[i % frames.length]}${c.reset} ${text}`
      );
      i++;
      if (Date.now() - start >= duration) {
        clearInterval(interval);
        process.stdout.write(`\r  ${c.green}✓${c.reset} ${text}\n`);
        resolve();
      }
    }, 80);
  });
}

async function typewriter(text: string, delay: number = 15): Promise<void> {
  for (const char of text) {
    process.stdout.write(char);
    await new Promise((r) => setTimeout(r, delay));
  }
  process.stdout.write('\n');
}

// ═══════════════════════════════════════════════
// 📄 .env Parser
// ═══════════════════════════════════════════════
function loadEnvFile(): Record<string, string> {
  const envVars: Record<string, string> = {};
  const envFiles = ['.env', '.env.local', '.env.production'];

  for (const file of envFiles) {
    const filePath = path.resolve(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIndex = trimmed.indexOf('=');
        if (eqIndex === -1) continue;
        const key = trimmed.substring(0, eqIndex).trim();
        let value = trimmed.substring(eqIndex + 1).trim();
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        envVars[key] = value;
        process.env[key] = value;
      }
      return envVars;
    }
  }
  return envVars;
}

// ═══════════════════════════════════════════════
// 📟 Readline
// ═══════════════════════════════════════════════
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
}

function askHidden(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.pause();
    process.stdout.write(question);
    const stdin = process.stdin;
    const wasRaw = stdin.isRaw;

    stdin.setEncoding('utf8');
    if (stdin.isTTY) stdin.setRawMode(true);
    stdin.resume();

    let password = '';

    const onData = (key: string) => {
      if (key === '\n' || key === '\r' || key === '\u0004') {
        stdin.removeListener('data', onData);
        if (stdin.isTTY) stdin.setRawMode(wasRaw || false);
        stdin.pause();
        process.stdout.write('\n');
        rl.resume();
        resolve(password);
        return;
      }
      if (key === '\u0003') {
        process.stdout.write('\n');
        process.exit();
      }
      if (key === '\b' || key === '\x7f') {
        if (password.length > 0) {
          password = password.slice(0, -1);
          process.stdout.write('\b \b');
        }
        return;
      }
      if (
        key.length === 1 &&
        key.charCodeAt(0) >= 32 &&
        key.charCodeAt(0) <= 126
      ) {
        password += key;
        process.stdout.write('*');
      }
    };
    stdin.on('data', onData);
  });
}

// ═══════════════════════════════════════════════
// ✅ Validators
// ═══════════════════════════════════════════════
function validateName(name: string): string | null {
  if (!name || !name.trim()) return 'Name is required';
  const t = name.trim();
  if (t.length < 2) return 'Minimum 2 characters';
  if (t.length > 50) return 'Maximum 50 characters';
  if (!/^[a-zA-Z\s.'-]+$/.test(t)) return 'Contains invalid characters';
  return null;
}

function validateEmail(email: string): string | null {
  if (!email || !email.trim()) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
    return 'Invalid email format';
  return null;
}

function validatePassword(password: string): string[] {
  const errors: string[] = [];
  if (password.length < 6) errors.push('Minimum 6 characters');
  if (password.length > 128) errors.push('Maximum 128 characters');
  if (!/[A-Z]/.test(password)) errors.push('At least 1 uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('At least 1 lowercase letter');
  if (!/[0-9]/.test(password)) errors.push('At least 1 number');
  return errors;
}

function validatePhone(phone: string): string | null {
  if (!phone) return null;
  const cleaned = phone.replace(/[\s\-()]/g, '');
  if (cleaned.length < 10 || cleaned.length > 15) return 'Invalid phone';
  if (!/^\+?[0-9]+$/.test(cleaned)) return 'Invalid characters in phone';
  return null;
}

function generateAdminId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ADM-${timestamp}-${random}`;
}

// ═══════════════════════════════════════════════
// 🎭 Permission Presets
// ═══════════════════════════════════════════════
const permissionPresets: Record<string, Record<string, string>> = {
  admin: {
    dashboard: 'full',
    booking: 'full',
    transactions: 'full',
    customers: 'full',
    destinations: 'full',
    packages: 'full',
    offers: 'full',
    support: 'full',
    settings: 'full',
  },
  editor: {
    dashboard: 'full',
    booking: 'edit',
    transactions: 'none',
    customers: 'full',
    destinations: 'edit',
    packages: 'edit',
    offers: 'edit',
    support: 'full',
    settings: 'none',
  },
  viewer: {
    dashboard: 'full',
    booking: 'view',
    transactions: 'none',
    customers: 'none',
    destinations: 'view',
    packages: 'view',
    offers: 'view',
    support: 'none',
    settings: 'none',
  },
};

// ═══════════════════════════════════════════════
// 🗄️ Admin Schema
// ═══════════════════════════════════════════════
function getAdminModel() {
  if (mongoose.models.Admin) return mongoose.models.Admin;

  const AdminSchema = new mongoose.Schema(
    {
      name: { type: String, required: true, trim: true },
      email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
      },
      password: { type: String, required: true, select: false },
      phone: { type: String, default: null },
      avatar: { type: String, default: null },
      adminId: { type: String, unique: true },
      role: {
        type: String,
        enum: ['admin', 'viewer', 'editor'],
        default: 'editor',
      },
      status: {
        type: String,
        enum: ['active', 'blocked', 'suspended'],
        default: 'active',
      },
      isVerified: { type: Boolean, default: true },
      permissions: {
        dashboard: { type: String, enum: ['full', 'none'], default: 'full' },
        booking: {
          type: String,
          enum: ['full', 'edit', 'view', 'none'],
          default: 'view',
        },
        transactions: {
          type: String,
          enum: ['full', 'none'],
          default: 'full',
        },
        customers: { type: String, enum: ['full', 'none'], default: 'full' },
        destinations: {
          type: String,
          enum: ['full', 'edit', 'view', 'none'],
          default: 'view',
        },
        packages: {
          type: String,
          enum: ['full', 'edit', 'view', 'none'],
          default: 'view',
        },
        offers: {
          type: String,
          enum: ['full', 'edit', 'view', 'none'],
          default: 'view',
        },
        support: { type: String, enum: ['full', 'none'], default: 'full' },
        settings: { type: String, enum: ['full', 'none'], default: 'none' },
      },
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        default: null,
      },
      failedLoginAttempts: { type: Number, default: 0 },
      lockUntil: { type: Date, default: null },
      resetPasswordToken: { type: String, default: null },
      resetPasswordExpire: { type: Date, default: null },
      lastLogin: { type: Date, default: Date.now },
      lastActive: { type: Date, default: Date.now },
      isOnline: { type: Boolean, default: false },
      loginHistory: [
        {
          device: String,
          browser: String,
          ip: String,
          location: String,
          time: { type: Date, default: Date.now },
          status: {
            type: String,
            enum: ['current', 'completed'],
            default: 'current',
          },
        },
      ],
      activeSessions: [
        {
          sessionId: { type: String, required: true },
          device: String,
          browser: String,
          ip: String,
          location: String,
          loginTime: { type: Date, default: Date.now },
          lastActive: { type: Date, default: Date.now },
        },
      ],
      twoFactorSecret: { type: String, default: null },
      isTwoFactorEnabled: { type: Boolean, default: false },
      blockedAt: { type: Date, default: null },
      blockedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        default: null,
      },
      blockReason: { type: String, default: null },
    },
    { timestamps: true }
  );

  return mongoose.model('Admin', AdminSchema);
}

// ═══════════════════════════════════════════════
// 🎯 Banner
// ═══════════════════════════════════════════════
function showBanner() {
  console.clear();
  console.log(`
${c.cyan}${c.bold}
    ╔══════════════════════════════════════════════════╗
    ║                                                  ║
    ║   █████╗ ██████╗ ███╗   ███╗██╗███╗   ██╗       ║
    ║  ██╔══██╗██╔══██╗████╗ ████║██║████╗  ██║       ║
    ║  ███████║██║  ██║██╔████╔██║██║██╔██╗ ██║       ║
    ║  ██╔══██║██║  ██║██║╚██╔╝██║██║██║╚██╗██║       ║
    ║  ██║  ██║██████╔╝██║ ╚═╝ ██║██║██║ ╚████║       ║
    ║  ╚═╝  ╚═╝╚═════╝ ╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝       ║
    ║                                                  ║
    ║   ${c.white}🔐 Admin Management CLI — v2.0${c.cyan}                 ║
    ║   ${c.dim}${c.white}Direct DB • No server needed${c.cyan}                   ║
    ║                                                  ║
    ╚══════════════════════════════════════════════════╝
${c.reset}`);
}

// ═══════════════════════════════════════════════
// 📋 Main Menu
// ═══════════════════════════════════════════════
function showMenu() {
  console.log(`
  ${c.cyan}${c.bold}┌──────────────────────────────────────────┐${c.reset}
  ${c.cyan}${c.bold}│${c.reset}       ${c.white}${c.bold}📋 MAIN MENU${c.reset}                      ${c.cyan}${c.bold}│${c.reset}
  ${c.cyan}${c.bold}├──────────────────────────────────────────┤${c.reset}
  ${c.cyan}${c.bold}│${c.reset}                                          ${c.cyan}${c.bold}│${c.reset}
  ${c.cyan}${c.bold}│${c.reset}   ${c.green}[1]${c.reset} ${c.white}➕ Create New Admin${c.reset}               ${c.cyan}${c.bold}│${c.reset}
  ${c.cyan}${c.bold}│${c.reset}   ${c.blue}[2]${c.reset} ${c.white}📋 List All Admins${c.reset}                ${c.cyan}${c.bold}│${c.reset}
  ${c.cyan}${c.bold}│${c.reset}   ${c.yellow}[3]${c.reset} ${c.white}🔍 Search Admin${c.reset}                   ${c.cyan}${c.bold}│${c.reset}
  ${c.cyan}${c.bold}│${c.reset}   ${c.magenta}[4]${c.reset} ${c.white}✏️  Update Admin${c.reset}                   ${c.cyan}${c.bold}│${c.reset}
  ${c.cyan}${c.bold}│${c.reset}   ${c.red}[5]${c.reset} ${c.white}🗑️  Delete Admin${c.reset}                   ${c.cyan}${c.bold}│${c.reset}
  ${c.cyan}${c.bold}│${c.reset}   ${c.yellow}[6]${c.reset} ${c.white}🚫 Block/Unblock Admin${c.reset}             ${c.cyan}${c.bold}│${c.reset}
  ${c.cyan}${c.bold}│${c.reset}   ${c.cyan}[7]${c.reset} ${c.white}🔑 Reset Password${c.reset}                 ${c.cyan}${c.bold}│${c.reset}
  ${c.cyan}${c.bold}│${c.reset}   ${c.gray}[0]${c.reset} ${c.white}🚪 Exit${c.reset}                            ${c.cyan}${c.bold}│${c.reset}
  ${c.cyan}${c.bold}│${c.reset}                                          ${c.cyan}${c.bold}│${c.reset}
  ${c.cyan}${c.bold}└──────────────────────────────────────────┘${c.reset}
`);
}

// ═══════════════════════════════════════════════
// 📋 Time Formatting
// ═══════════════════════════════════════════════
function timeAgo(date: Date): string {
  const seconds = Math.floor(
    (new Date().getTime() - new Date(date).getTime()) / 1000
  );
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(date).toLocaleDateString();
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ═══════════════════════════════════════════════
// ➕ CREATE ADMIN
// ═══════════════════════════════════════════════
async function handleCreate(AdminModel: any) {
  console.log(
    `\n${c.cyan}${c.bold}  ┌─────────────────────────────────────┐${c.reset}`
  );
  console.log(
    `${c.cyan}${c.bold}  │     ➕ CREATE NEW ADMIN ACCOUNT      │${c.reset}`
  );
  console.log(
    `${c.cyan}${c.bold}  └─────────────────────────────────────┘${c.reset}\n`
  );

  // Check existing count
  const existingCount = await AdminModel.countDocuments();
  if (existingCount >= 10) {
    console.log(
      `  ${c.red}❌ Maximum 10 admin accounts reached!${c.reset}\n`
    );
    return;
  }

  if (existingCount > 0) {
    console.log(
      `  ${c.dim}Currently ${existingCount} admin(s) in database${c.reset}\n`
    );
  }

  // ── Name ──
  let name = '';
  while (true) {
    name = await ask(`  ${c.white}👤 Full Name: ${c.reset}`);
    const err = validateName(name);
    if (err) {
      console.log(`  ${c.red}   ✗ ${err}${c.reset}`);
      continue;
    }
    break;
  }

  // ── Email ──
  let email = '';
  while (true) {
    email = await ask(`  ${c.white}📧 Email: ${c.reset}`);
    const err = validateEmail(email);
    if (err) {
      console.log(`  ${c.red}   ✗ ${err}${c.reset}`);
      continue;
    }
    const exists = await AdminModel.findOne({
      email: email.trim().toLowerCase(),
    });
    if (exists) {
      console.log(
        `  ${c.red}   ✗ Email already registered (${exists.adminId})${c.reset}`
      );
      continue;
    }
    break;
  }

  // ── Phone ──
  let phone = '';
  while (true) {
    phone = await ask(
      `  ${c.white}📱 Phone ${c.dim}(optional, press Enter to skip)${c.reset}: `
    );
    if (!phone) break;
    const err = validatePhone(phone);
    if (err) {
      console.log(`  ${c.red}   ✗ ${err}${c.reset}`);
      continue;
    }
    break;
  }

  // ── Password ──
  let password = '';
  while (true) {
    password = await askHidden(`  ${c.white}🔑 Password: ${c.reset}`);
    const errors = validatePassword(password);
    if (errors.length > 0) {
      console.log(`  ${c.red}   ✗ Password requirements:${c.reset}`);
      errors.forEach((e) => console.log(`  ${c.red}     • ${e}${c.reset}`));
      continue;
    }
    const confirm = await askHidden(
      `  ${c.white}🔑 Confirm Password: ${c.reset}`
    );
    if (password !== confirm) {
      console.log(`  ${c.red}   ✗ Passwords don't match!${c.reset}`);
      continue;
    }
    console.log(`  ${c.green}   ✓ Password accepted${c.reset}`);
    break;
  }

  // ── Role ──
  console.log(`\n  ${c.white}${c.bold}🎭 Select Role:${c.reset}`);
  console.log(
    `  ${c.green}  [1]${c.reset} Admin  ${c.dim}— Full system access${c.reset}`
  );
  console.log(
    `  ${c.yellow}  [2]${c.reset} Editor ${c.dim}— Edit content & bookings${c.reset}`
  );
  console.log(
    `  ${c.blue}  [3]${c.reset} Viewer ${c.dim}— Read-only access${c.reset}`
  );

  let roleChoice = '';
  while (!['1', '2', '3'].includes(roleChoice)) {
    roleChoice = await ask(`\n  ${c.white}  Choice (1-3): ${c.reset}`);
  }

  const roleMap: Record<string, 'admin' | 'editor' | 'viewer'> = {
    '1': 'admin',
    '2': 'editor',
    '3': 'viewer',
  };
  const role = roleMap[roleChoice];
  const permissions = permissionPresets[role];

  // ── Generate Admin ID ──
  let adminId = generateAdminId();
  let idAttempts = 0;
  while (await AdminModel.findOne({ adminId })) {
    adminId = generateAdminId();
    if (++idAttempts >= 10) {
      console.log(
        `  ${c.red}❌ Failed to generate unique Admin ID${c.reset}`
      );
      return;
    }
  }

  // ── Review ──
  console.log(`\n${separator('═', c.cyan)}`);
  console.log(`  ${c.cyan}${c.bold}📋 REVIEW DETAILS${c.reset}`);
  console.log(separator('─', c.dim));
  console.log(
    `  ${c.dim}Name:${c.reset}      ${c.white}${c.bold}${name.trim()}${c.reset}`
  );
  console.log(
    `  ${c.dim}Email:${c.reset}     ${c.white}${email.trim().toLowerCase()}${c.reset}`
  );
  console.log(
    `  ${c.dim}Phone:${c.reset}     ${c.white}${phone || '(not set)'}${c.reset}`
  );
  console.log(`  ${c.dim}Role:${c.reset}      ${roleBadge(role)}`);
  console.log(`  ${c.dim}Admin ID:${c.reset}  ${c.cyan}${adminId}${c.reset}`);
  console.log(
    `  ${c.dim}Status:${c.reset}    ${c.green}● Active${c.reset}`
  );

  console.log(`\n  ${c.dim}Permissions:${c.reset}`);
  Object.entries(permissions).forEach(([key, value]) => {
    const icons: Record<string, string> = {
      full: `${c.green}✅ full${c.reset}`,
      edit: `${c.yellow}✏️  edit${c.reset}`,
      view: `${c.blue}👁  view${c.reset}`,
      none: `${c.red}❌ none${c.reset}`,
    };
    console.log(`    ${c.dim}${key.padEnd(16)}${c.reset}${icons[value]}`);
  });
  console.log(separator('═', c.cyan));

  const confirmCreate = await ask(
    `\n  ${c.yellow}${c.bold}⚡ Create this admin? ${c.reset}${c.dim}(yes/no)${c.reset}: `
  );

  if (!['yes', 'y'].includes(confirmCreate.toLowerCase())) {
    console.log(
      `\n  ${c.dim}Cancelled. No admin created.${c.reset}\n`
    );
    return;
  }

  // ── Create ──
  await spinner('Creating admin account...');

  try {
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newAdmin = await AdminModel.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      phone: phone?.trim() || null,
      adminId,
      role,
      status: 'active',
      isVerified: true,
      permissions,
      isOnline: false,
      isTwoFactorEnabled: false,
      failedLoginAttempts: 0,
      lockUntil: null,
      activeSessions: [],
      loginHistory: [],
      createdBy: null,
      blockReason: null,
      blockedAt: null,
      blockedBy: null,
    });

    console.log(`
  ${c.bgGreen}${c.white}${c.bold} ✅ ADMIN CREATED SUCCESSFULLY ${c.reset}

  ${c.dim}${'═'.repeat(50)}${c.reset}
  ${c.dim}MongoDB ID:${c.reset}   ${c.cyan}${newAdmin._id}${c.reset}
  ${c.dim}Admin ID:${c.reset}     ${c.cyan}${adminId}${c.reset}
  ${c.dim}Name:${c.reset}         ${c.white}${c.bold}${name.trim()}${c.reset}
  ${c.dim}Email:${c.reset}        ${c.white}${email.trim().toLowerCase()}${c.reset}
  ${c.dim}Role:${c.reset}         ${roleBadge(role)}
  ${c.dim}${'═'.repeat(50)}${c.reset}

  ${c.bgYellow}${'\x1b[30m'}${c.bold} ⚠️  IMPORTANT ${c.reset}
  ${c.yellow}• Save credentials — password won't show again${c.reset}
  ${c.yellow}• Login at: ${c.white}${c.bold}/access${c.reset}
`);
  } catch (error: any) {
    console.log(
      `\n  ${c.bgRed}${c.white}${c.bold} ❌ CREATION FAILED ${c.reset}\n`
    );
    if (error.code === 11000) {
      const dupField =
        Object.keys(error.keyPattern || {})[0] || 'unknown';
      console.log(
        `  ${c.red}Duplicate ${dupField}: ${JSON.stringify(error.keyValue)}${c.reset}\n`
      );
    } else if (error.name === 'ValidationError') {
      Object.values(error.errors).forEach((err: any) => {
        console.log(
          `  ${c.red}• ${err.path}: ${err.message}${c.reset}`
        );
      });
    } else {
      console.log(`  ${c.red}${error.message}${c.reset}\n`);
    }
  }
}

// ═══════════════════════════════════════════════
// 📋 LIST ALL ADMINS
// ═══════════════════════════════════════════════
async function handleList(AdminModel: any) {
  console.log(
    `\n${c.cyan}${c.bold}  ┌─────────────────────────────────────┐${c.reset}`
  );
  console.log(
    `${c.cyan}${c.bold}  │        📋 ALL ADMIN ACCOUNTS         │${c.reset}`
  );
  console.log(
    `${c.cyan}${c.bold}  └─────────────────────────────────────┘${c.reset}\n`
  );

  await spinner('Fetching admins...');

  const admins = await AdminModel.find()
    .select(
      'name email adminId role status isVerified phone createdAt lastLogin isOnline'
    )
    .sort({ createdAt: -1 })
    .lean();

  if (admins.length === 0) {
    console.log(`  ${c.yellow}⚠️  No admin accounts found.${c.reset}\n`);
    return;
  }

  // Stats
  const stats = {
    total: admins.length,
    active: admins.filter((a: any) => a.status === 'active').length,
    blocked: admins.filter((a: any) => a.status === 'blocked').length,
    suspended: admins.filter((a: any) => a.status === 'suspended').length,
    online: admins.filter((a: any) => a.isOnline).length,
  };

  console.log(
    `  ${c.dim}Total:${c.reset} ${c.white}${c.bold}${stats.total}${c.reset}  ${c.dim}│${c.reset}  ${c.green}Active: ${stats.active}${c.reset}  ${c.dim}│${c.reset}  ${c.red}Blocked: ${stats.blocked}${c.reset}  ${c.dim}│${c.reset}  ${c.yellow}Suspended: ${stats.suspended}${c.reset}  ${c.dim}│${c.reset}  ${c.cyan}Online: ${stats.online}${c.reset}\n`
  );

  console.log(separator('─', c.dim));

  admins.forEach((admin: any, index: number) => {
    const onlineIcon = admin.isOnline
      ? `${c.green}🟢${c.reset}`
      : `${c.gray}⚫${c.reset}`;

    console.log(
      `  ${c.dim}${(index + 1).toString().padStart(2)}.${c.reset} ${onlineIcon} ${c.white}${c.bold}${admin.name}${c.reset}`
    );
    console.log(
      `      ${c.dim}Email:${c.reset}    ${admin.email}`
    );
    console.log(
      `      ${c.dim}ID:${c.reset}       ${c.cyan}${admin.adminId}${c.reset}`
    );
    console.log(
      `      ${c.dim}Role:${c.reset}     ${roleBadge(admin.role)}    ${c.dim}Status:${c.reset} ${statusDot(admin.status)} ${admin.status}`
    );
    console.log(
      `      ${c.dim}Phone:${c.reset}    ${admin.phone || 'N/A'}`
    );
    console.log(
      `      ${c.dim}Created:${c.reset}  ${formatDate(admin.createdAt)}  ${c.dim}(${timeAgo(admin.createdAt)})${c.reset}`
    );
    if (admin.lastLogin) {
      console.log(
        `      ${c.dim}Login:${c.reset}    ${formatDate(admin.lastLogin)}  ${c.dim}(${timeAgo(admin.lastLogin)})${c.reset}`
      );
    }
    console.log(separator('─', c.dim));
  });

  console.log('');
}

// ═══════════════════════════════════════════════
// 🔍 SEARCH ADMIN
// ═══════════════════════════════════════════════
async function handleSearch(AdminModel: any) {
  console.log(
    `\n${c.cyan}${c.bold}  ┌─────────────────────────────────────┐${c.reset}`
  );
  console.log(
    `${c.cyan}${c.bold}  │         🔍 SEARCH ADMIN              │${c.reset}`
  );
  console.log(
    `${c.cyan}${c.bold}  └─────────────────────────────────────┘${c.reset}\n`
  );

  const query = await ask(
    `  ${c.white}Search ${c.dim}(name / email / adminId)${c.reset}: `
  );

  if (!query) {
    console.log(`  ${c.red}✗ Search term required${c.reset}\n`);
    return;
  }

  await spinner('Searching...');

  const admins = await AdminModel.find({
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { email: { $regex: query, $options: 'i' } },
      { adminId: { $regex: query, $options: 'i' } },
    ],
  })
    .select(
      'name email adminId role status phone isVerified createdAt lastLogin isOnline'
    )
    .lean();

  if (admins.length === 0) {
    console.log(
      `  ${c.yellow}⚠️  No results for "${query}"${c.reset}\n`
    );
    return;
  }

  console.log(
    `  ${c.green}Found ${admins.length} result(s):${c.reset}\n`
  );
  console.log(separator('─', c.dim));

  admins.forEach((admin: any, index: number) => {
    const onlineIcon = admin.isOnline
      ? `${c.green}🟢${c.reset}`
      : `${c.gray}⚫${c.reset}`;

    console.log(
      `  ${c.dim}${(index + 1).toString().padStart(2)}.${c.reset} ${onlineIcon} ${c.white}${c.bold}${admin.name}${c.reset}`
    );
    console.log(
      `      ${c.dim}Email:${c.reset}    ${admin.email}`
    );
    console.log(
      `      ${c.dim}ID:${c.reset}       ${c.cyan}${admin.adminId}${c.reset}`
    );
    console.log(
      `      ${c.dim}Role:${c.reset}     ${roleBadge(admin.role)}    ${c.dim}Status:${c.reset} ${statusDot(admin.status)} ${admin.status}`
    );
    console.log(
      `      ${c.dim}Phone:${c.reset}    ${admin.phone || 'N/A'}`
    );
    console.log(
      `      ${c.dim}Created:${c.reset}  ${formatDate(admin.createdAt)}`
    );
    console.log(separator('─', c.dim));
  });
  console.log('');
}

// ═══════════════════════════════════════════════
// ✏️  UPDATE ADMIN
// ═══════════════════════════════════════════════
async function handleUpdate(AdminModel: any) {
  console.log(
    `\n${c.cyan}${c.bold}  ┌─────────────────────────────────────┐${c.reset}`
  );
  console.log(
    `${c.cyan}${c.bold}  │         ✏️  UPDATE ADMIN               │${c.reset}`
  );
  console.log(
    `${c.cyan}${c.bold}  └─────────────────────────────────────┘${c.reset}\n`
  );

  const identifier = await ask(
    `  ${c.white}Enter Admin ID or Email: ${c.reset}`
  );

  if (!identifier) {
    console.log(`  ${c.red}✗ Required${c.reset}\n`);
    return;
  }

  const admin = await AdminModel.findOne({
    $or: [
      { adminId: identifier.trim() },
      { email: identifier.trim().toLowerCase() },
    ],
  }).lean();

  if (!admin) {
    console.log(`  ${c.red}✗ Admin not found${c.reset}\n`);
    return;
  }

  console.log(
    `\n  ${c.dim}Found:${c.reset} ${c.white}${c.bold}${admin.name}${c.reset} ${c.dim}(${admin.adminId})${c.reset}\n`
  );

  console.log(`  ${c.white}${c.bold}What to update?${c.reset}`);
  console.log(
    `  ${c.cyan}[1]${c.reset} Name  ${c.dim}(current: ${admin.name})${c.reset}`
  );
  console.log(
    `  ${c.cyan}[2]${c.reset} Phone ${c.dim}(current: ${admin.phone || 'N/A'})${c.reset}`
  );
  console.log(
    `  ${c.cyan}[3]${c.reset} Role  ${c.dim}(current: ${admin.role})${c.reset}`
  );
  console.log(
    `  ${c.cyan}[4]${c.reset} Email ${c.dim}(current: ${admin.email})${c.reset}`
  );
  console.log(`  ${c.gray}[0]${c.reset} Cancel`);

  const choice = await ask(`\n  ${c.white}Choice: ${c.reset}`);

  const updates: Record<string, any> = {};

  switch (choice) {
    case '1': {
      let newName = '';
      while (true) {
        newName = await ask(
          `  ${c.white}New Name: ${c.reset}`
        );
        const err = validateName(newName);
        if (err) {
          console.log(`  ${c.red}   ✗ ${err}${c.reset}`);
          continue;
        }
        break;
      }
      updates.name = newName.trim();
      break;
    }
    case '2': {
      let newPhone = '';
      while (true) {
        newPhone = await ask(
          `  ${c.white}New Phone ${c.dim}(empty to clear)${c.reset}: `
        );
        if (!newPhone) {
          updates.phone = null;
          break;
        }
        const err = validatePhone(newPhone);
        if (err) {
          console.log(`  ${c.red}   ✗ ${err}${c.reset}`);
          continue;
        }
        updates.phone = newPhone.trim();
        break;
      }
      break;
    }
    case '3': {
      console.log(
        `\n  ${c.green}[1]${c.reset} Admin  ${c.cyan}[2]${c.reset} Editor  ${c.blue}[3]${c.reset} Viewer`
      );
      let rc = '';
      while (!['1', '2', '3'].includes(rc)) {
        rc = await ask(`  ${c.white}New Role (1-3): ${c.reset}`);
      }
      const rMap: Record<string, string> = {
        '1': 'admin',
        '2': 'editor',
        '3': 'viewer',
      };
      updates.role = rMap[rc];
      updates.permissions = permissionPresets[rMap[rc]];
      break;
    }
    case '4': {
      let newEmail = '';
      while (true) {
        newEmail = await ask(
          `  ${c.white}New Email: ${c.reset}`
        );
        const err = validateEmail(newEmail);
        if (err) {
          console.log(`  ${c.red}   ✗ ${err}${c.reset}`);
          continue;
        }
        const exists = await AdminModel.findOne({
          email: newEmail.trim().toLowerCase(),
          _id: { $ne: admin._id },
        });
        if (exists) {
          console.log(
            `  ${c.red}   ✗ Email already in use${c.reset}`
          );
          continue;
        }
        updates.email = newEmail.trim().toLowerCase();
        break;
      }
      break;
    }
    default:
      console.log(`  ${c.dim}Cancelled.${c.reset}\n`);
      return;
  }

  if (Object.keys(updates).length === 0) {
    console.log(`  ${c.dim}Nothing to update.${c.reset}\n`);
    return;
  }

  const confirmUpdate = await ask(
    `\n  ${c.yellow}Confirm update? ${c.reset}${c.dim}(yes/no)${c.reset}: `
  );
  if (!['yes', 'y'].includes(confirmUpdate.toLowerCase())) {
    console.log(`  ${c.dim}Cancelled.${c.reset}\n`);
    return;
  }

  await spinner('Updating admin...');

  try {
    await AdminModel.updateOne({ _id: admin._id }, { $set: updates });
    console.log(
      `\n  ${c.bgGreen}${c.white}${c.bold} ✅ UPDATED SUCCESSFULLY ${c.reset}\n`
    );
    Object.entries(updates).forEach(([key, value]) => {
      if (key === 'permissions') return;
      console.log(
        `  ${c.dim}${key}:${c.reset} ${c.white}${typeof value === 'string' ? value : JSON.stringify(value)}${c.reset}`
      );
    });
    console.log('');
  } catch (error: any) {
    console.log(
      `\n  ${c.red}❌ Update failed: ${error.message}${c.reset}\n`
    );
  }
}

// ═══════════════════════════════════════════════
// 🗑️  DELETE ADMIN
// ═══════════════════════════════════════════════
async function handleDelete(AdminModel: any) {
  console.log(
    `\n${c.red}${c.bold}  ┌─────────────────────────────────────┐${c.reset}`
  );
  console.log(
    `${c.red}${c.bold}  │      🗑️  DELETE ADMIN ACCOUNT         │${c.reset}`
  );
  console.log(
    `${c.red}${c.bold}  └─────────────────────────────────────┘${c.reset}\n`
  );

  // Show all admins first
  const admins = await AdminModel.find()
    .select('name email adminId role status createdAt')
    .sort({ createdAt: -1 })
    .lean();

  if (admins.length === 0) {
    console.log(`  ${c.yellow}⚠️  No admin accounts to delete.${c.reset}\n`);
    return;
  }

  console.log(`  ${c.dim}Available admins:${c.reset}\n`);
  admins.forEach((admin: any, index: number) => {
    console.log(
      `  ${c.white}${(index + 1).toString().padStart(2)}.${c.reset} ${statusDot(admin.status)} ${c.white}${admin.name}${c.reset} ${c.dim}— ${admin.email}${c.reset} ${c.cyan}[${admin.adminId}]${c.reset} ${roleBadge(admin.role)}`
    );
  });

  console.log(
    `\n  ${c.dim}Enter number, Admin ID, or email to delete${c.reset}`
  );
  const input = await ask(`  ${c.red}🗑️  Select: ${c.reset}`);

  if (!input) {
    console.log(`  ${c.dim}Cancelled.${c.reset}\n`);
    return;
  }

  // Find by number, adminId, or email
  let targetAdmin: any = null;
  const num = parseInt(input);

  if (!isNaN(num) && num >= 1 && num <= admins.length) {
    targetAdmin = admins[num - 1];
  } else {
    targetAdmin = admins.find(
      (a: any) =>
        a.adminId === input.trim() ||
        a.email === input.trim().toLowerCase()
    );
  }

  if (!targetAdmin) {
    console.log(`  ${c.red}✗ Admin not found${c.reset}\n`);
    return;
  }

  // Show what will be deleted
  console.log(`
  ${c.bgRed}${c.white}${c.bold} ⚠️  DANGER ZONE ${c.reset}

  ${c.red}You are about to ${c.bold}PERMANENTLY DELETE${c.reset}${c.red} this admin:${c.reset}

  ${c.dim}Name:${c.reset}     ${c.white}${c.bold}${targetAdmin.name}${c.reset}
  ${c.dim}Email:${c.reset}    ${targetAdmin.email}
  ${c.dim}ID:${c.reset}       ${c.cyan}${targetAdmin.adminId}${c.reset}
  ${c.dim}Role:${c.reset}     ${roleBadge(targetAdmin.role)}
  ${c.dim}Status:${c.reset}   ${statusDot(targetAdmin.status)} ${targetAdmin.status}
  ${c.dim}Created:${c.reset}  ${formatDate(targetAdmin.createdAt)}
  `);

  // Safety: require typing admin ID
  console.log(
    `  ${c.red}${c.bold}To confirm, type the Admin ID: ${c.cyan}${targetAdmin.adminId}${c.reset}`
  );
  const confirmation = await ask(`\n  ${c.red}Confirm ID: ${c.reset}`);

  if (confirmation.trim() !== targetAdmin.adminId) {
    console.log(
      `\n  ${c.yellow}✗ ID doesn't match. Deletion cancelled.${c.reset}\n`
    );
    return;
  }

  // Final confirmation
  const finalConfirm = await ask(
    `  ${c.red}${c.bold}Are you ABSOLUTELY sure? ${c.reset}${c.dim}(type "DELETE" to confirm)${c.reset}: `
  );

  if (finalConfirm !== 'DELETE') {
    console.log(
      `\n  ${c.yellow}Cancelled. No admin deleted.${c.reset}\n`
    );
    return;
  }

  // Check if this is the last admin
  const remainingAdmins = await AdminModel.countDocuments({
    role: 'admin',
    _id: { $ne: targetAdmin._id },
  });

  if (targetAdmin.role === 'admin' && remainingAdmins === 0) {
    console.log(`
  ${c.bgRed}${c.white}${c.bold} 🚫 CANNOT DELETE ${c.reset}
  ${c.red}This is the LAST admin account!${c.reset}
  ${c.red}At least one admin must exist.${c.reset}

  ${c.yellow}Tip: Create another admin first, then delete this one.${c.reset}
`);
    return;
  }

  await spinner('Deleting admin account...');

  try {
    await AdminModel.deleteOne({ _id: targetAdmin._id });

    console.log(`
  ${c.bgGreen}${c.white}${c.bold} ✅ ADMIN DELETED ${c.reset}

  ${c.dim}Deleted:${c.reset}  ${c.white}${targetAdmin.name}${c.reset} ${c.dim}(${targetAdmin.email})${c.reset}
  ${c.dim}ID:${c.reset}       ${c.cyan}${targetAdmin.adminId}${c.reset}
  ${c.dim}Time:${c.reset}     ${new Date().toLocaleString()}

  ${c.dim}Remaining admins: ${await AdminModel.countDocuments()}${c.reset}
`);
  } catch (error: any) {
    console.log(
      `\n  ${c.red}❌ Delete failed: ${error.message}${c.reset}\n`
    );
  }
}

// ═══════════════════════════════════════════════
// 🚫 BLOCK / UNBLOCK ADMIN
// ═══════════════════════════════════════════════
async function handleBlockToggle(AdminModel: any) {
  console.log(
    `\n${c.yellow}${c.bold}  ┌─────────────────────────────────────┐${c.reset}`
  );
  console.log(
    `${c.yellow}${c.bold}  │     🚫 BLOCK / UNBLOCK ADMIN         │${c.reset}`
  );
  console.log(
    `${c.yellow}${c.bold}  └─────────────────────────────────────┘${c.reset}\n`
  );

  const admins = await AdminModel.find()
    .select('name email adminId role status blockReason blockedAt')
    .sort({ createdAt: -1 })
    .lean();

  if (admins.length === 0) {
    console.log(
      `  ${c.yellow}⚠️  No admin accounts found.${c.reset}\n`
    );
    return;
  }

  admins.forEach((admin: any, index: number) => {
    const blockInfo =
      admin.status === 'blocked'
        ? `${c.red} [BLOCKED${admin.blockReason ? ': ' + admin.blockReason : ''}]${c.reset}`
        : '';
    console.log(
      `  ${c.white}${(index + 1).toString().padStart(2)}.${c.reset} ${statusDot(admin.status)} ${c.white}${admin.name}${c.reset} ${c.dim}— ${admin.email}${c.reset} ${roleBadge(admin.role)}${blockInfo}`
    );
  });

  const input = await ask(
    `\n  ${c.white}Select admin (number/ID/email): ${c.reset}`
  );
  if (!input) return;

  let targetAdmin: any = null;
  const num = parseInt(input);
  if (!isNaN(num) && num >= 1 && num <= admins.length) {
    targetAdmin = admins[num - 1];
  } else {
    targetAdmin = admins.find(
      (a: any) =>
        a.adminId === input.trim() ||
        a.email === input.trim().toLowerCase()
    );
  }

  if (!targetAdmin) {
    console.log(`  ${c.red}✗ Admin not found${c.reset}\n`);
    return;
  }

  const isBlocked = targetAdmin.status === 'blocked';

  if (isBlocked) {
    // ── UNBLOCK ──
    console.log(
      `\n  ${c.white}${c.bold}${targetAdmin.name}${c.reset} ${c.dim}is currently${c.reset} ${c.red}${c.bold}BLOCKED${c.reset}`
    );
    if (targetAdmin.blockReason) {
      console.log(
        `  ${c.dim}Reason: ${targetAdmin.blockReason}${c.reset}`
      );
    }

    const confirm = await ask(
      `\n  ${c.green}Unblock this admin? ${c.reset}${c.dim}(yes/no)${c.reset}: `
    );
    if (!['yes', 'y'].includes(confirm.toLowerCase())) {
      console.log(`  ${c.dim}Cancelled.${c.reset}\n`);
      return;
    }

    await spinner('Unblocking admin...');

    await AdminModel.updateOne(
      { _id: targetAdmin._id },
      {
        $set: {
          status: 'active',
          blockReason: null,
          blockedAt: null,
          blockedBy: null,
          failedLoginAttempts: 0,
          lockUntil: null,
        },
      }
    );

    console.log(
      `\n  ${c.bgGreen}${c.white}${c.bold} ✅ ${targetAdmin.name} UNBLOCKED ${c.reset}\n`
    );
  } else {
    // ── BLOCK ──
    console.log(
      `\n  ${c.white}${c.bold}${targetAdmin.name}${c.reset} ${c.dim}is currently${c.reset} ${c.green}${c.bold}ACTIVE${c.reset}`
    );

    const reason = await ask(
      `  ${c.red}Block reason ${c.dim}(optional)${c.reset}: `
    );

    const confirm = await ask(
      `  ${c.red}${c.bold}Block this admin? ${c.reset}${c.dim}(yes/no)${c.reset}: `
    );
    if (!['yes', 'y'].includes(confirm.toLowerCase())) {
      console.log(`  ${c.dim}Cancelled.${c.reset}\n`);
      return;
    }

    await spinner('Blocking admin...');

    await AdminModel.updateOne(
      { _id: targetAdmin._id },
      {
        $set: {
          status: 'blocked',
          blockReason: reason || null,
          blockedAt: new Date(),
          isOnline: false,
          activeSessions: [],
        },
      }
    );

    console.log(
      `\n  ${c.bgRed}${c.white}${c.bold} 🚫 ${targetAdmin.name} BLOCKED ${c.reset}`
    );
    if (reason)
      console.log(
        `  ${c.dim}Reason: ${reason}${c.reset}`
      );
    console.log('');
  }
}

// ═══════════════════════════════════════════════
// 🔑 RESET PASSWORD
// ═══════════════════════════════════════════════
async function handleResetPassword(AdminModel: any) {
  console.log(
    `\n${c.cyan}${c.bold}  ┌─────────────────────────────────────┐${c.reset}`
  );
  console.log(
    `${c.cyan}${c.bold}  │       🔑 RESET ADMIN PASSWORD        │${c.reset}`
  );
  console.log(
    `${c.cyan}${c.bold}  └─────────────────────────────────────┘${c.reset}\n`
  );

  const identifier = await ask(
    `  ${c.white}Enter Admin ID or Email: ${c.reset}`
  );

  if (!identifier) {
    console.log(`  ${c.red}✗ Required${c.reset}\n`);
    return;
  }

  const admin = await AdminModel.findOne({
    $or: [
      { adminId: identifier.trim() },
      { email: identifier.trim().toLowerCase() },
    ],
  })
    .select('name email adminId role status')
    .lean();

  if (!admin) {
    console.log(`  ${c.red}✗ Admin not found${c.reset}\n`);
    return;
  }

  console.log(
    `\n  ${c.dim}Found:${c.reset} ${c.white}${c.bold}${admin.name}${c.reset} ${c.dim}(${admin.email})${c.reset} ${roleBadge(admin.role)}\n`
  );

  // New password
  let newPassword = '';
  while (true) {
    newPassword = await askHidden(
      `  ${c.white}New Password: ${c.reset}`
    );
    const errors = validatePassword(newPassword);
    if (errors.length > 0) {
      console.log(
        `  ${c.red}   ✗ Password requirements:${c.reset}`
      );
      errors.forEach((e) =>
        console.log(`  ${c.red}     • ${e}${c.reset}`)
      );
      continue;
    }
    const confirmPw = await askHidden(
      `  ${c.white}Confirm Password: ${c.reset}`
    );
    if (newPassword !== confirmPw) {
      console.log(
        `  ${c.red}   ✗ Passwords don't match!${c.reset}`
      );
      continue;
    }
    break;
  }

  const confirm = await ask(
    `\n  ${c.yellow}Reset password for ${c.white}${admin.name}${c.yellow}? ${c.reset}${c.dim}(yes/no)${c.reset}: `
  );

  if (!['yes', 'y'].includes(confirm.toLowerCase())) {
    console.log(`  ${c.dim}Cancelled.${c.reset}\n`);
    return;
  }

  await spinner('Resetting password...');

  try {
    const salt = await bcrypt.genSalt(12);
    const hashed = await bcrypt.hash(newPassword, salt);

    await AdminModel.updateOne(
      { _id: admin._id },
      {
        $set: {
          password: hashed,
          failedLoginAttempts: 0,
          lockUntil: null,
          resetPasswordToken: null,
          resetPasswordExpire: null,
          activeSessions: [],
        },
      }
    );

    console.log(`
  ${c.bgGreen}${c.white}${c.bold} ✅ PASSWORD RESET SUCCESSFUL ${c.reset}

  ${c.dim}Admin:${c.reset}  ${c.white}${admin.name}${c.reset}
  ${c.dim}Email:${c.reset}  ${admin.email}
  ${c.dim}Note:${c.reset}   ${c.yellow}All active sessions have been cleared${c.reset}
`);
  } catch (error: any) {
    console.log(
      `\n  ${c.red}❌ Failed: ${error.message}${c.reset}\n`
    );
  }
}

// ═══════════════════════════════════════════════
// 🏠 DB Connection
// ═══════════════════════════════════════════════
async function connectDB(): Promise<boolean> {
  const envVars = loadEnvFile();

  const MONGODB_URI =
    envVars.DATABASE_URL ||
    envVars.MONGODB_URI ||
    envVars.MONGO_URI ||
    envVars.DB_URL ||
    process.env.DATABASE_URL ||
    process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    console.log(`
  ${c.bgRed}${c.white}${c.bold} ERROR ${c.reset}
  ${c.red}MongoDB URI not found!${c.reset}
  ${c.dim}Checked: DATABASE_URL, MONGODB_URI, MONGO_URI, DB_URL${c.reset}

  ${c.yellow}Add one of these to your .env or .env.local:${c.reset}
`);
    return false;
  }

  const masked = MONGODB_URI.replace(
    /\/\/([^:]+):([^@]+)@/,
    '//***:***@'
  );

  try {
    await spinner('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      maxPoolSize: 5,
    });
    console.log(
      `  ${c.green}✓${c.reset} ${c.dim}Connected: ${masked}${c.reset}\n`
    );
    return true;
  } catch (error: any) {
    console.log(`
  ${c.bgRed}${c.white}${c.bold} CONNECTION FAILED ${c.reset}
  ${c.red}${error.message}${c.reset}

  ${c.yellow}Fixes:${c.reset}
  ${c.dim}1. Check DATABASE_URL in .env.local${c.reset}
  ${c.dim}2. Whitelist IP in MongoDB Atlas${c.reset}
  ${c.dim}3. Check internet connection${c.reset}
`);
    return false;
  }
}

// ═══════════════════════════════════════════════
// 🚀 Main Loop
// ═══════════════════════════════════════════════
async function main() {
  showBanner();

  const connected = await connectDB();
  if (!connected) {
    rl.close();
    process.exit(1);
  }

  const AdminModel = getAdminModel();

  // ── Menu Loop ──
  let running = true;

  while (running) {
    showMenu();
    const choice = await ask(
      `  ${c.cyan}${c.bold}❯${c.reset} ${c.white}Enter choice: ${c.reset}`
    );

    switch (choice) {
      case '1':
        await handleCreate(AdminModel);
        break;

      case '2':
        await handleList(AdminModel);
        break;

      case '3':
        await handleSearch(AdminModel);
        break;

      case '4':
        await handleUpdate(AdminModel);
        break;

      case '5':
        await handleDelete(AdminModel);
        break;

      case '6':
        await handleBlockToggle(AdminModel);
        break;

      case '7':
        await handleResetPassword(AdminModel);
        break;

      case '0':
      case 'exit':
      case 'quit':
      case 'q':
        running = false;
        break;

      default:
        console.log(
          `\n  ${c.red}✗ Invalid option. Enter 0-7${c.reset}\n`
        );
    }

    if (running) {
      await ask(
        `${c.dim}  Press Enter to continue...${c.reset}`
      );
      console.clear();
      // Show mini header on return
      console.log(
        `\n${c.cyan}${c.bold}  🔐 Admin CLI${c.reset} ${c.dim}— Connected to MongoDB${c.reset}`
      );
    }
  }

  // ── Cleanup ──
  console.log('');
  await spinner('Disconnecting from database...');
  await mongoose.disconnect();

  console.log(`
  ${c.cyan}${c.bold}╔══════════════════════════════════════╗${c.reset}
  ${c.cyan}${c.bold}║${c.reset}                                      ${c.cyan}${c.bold}║${c.reset}
  ${c.cyan}${c.bold}║${c.reset}   ${c.white}${c.bold}👋 Goodbye! Stay secure.${c.reset}            ${c.cyan}${c.bold}║${c.reset}
  ${c.cyan}${c.bold}║${c.reset}   ${c.dim}Database disconnected safely.${c.reset}      ${c.cyan}${c.bold}║${c.reset}
  ${c.cyan}${c.bold}║${c.reset}                                      ${c.cyan}${c.bold}║${c.reset}
  ${c.cyan}${c.bold}╚══════════════════════════════════════╝${c.reset}
`);

  rl.close();
  process.exit(0);
}

// ═══════════════════════════════════════════════
// 🏃 Run
// ═══════════════════════════════════════════════
main().catch((error) => {
  console.error(`\n${c.red}Fatal error:${c.reset}`, error.message);
  rl.close();
  process.exit(1);
});