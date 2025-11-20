// Local Storage Service for Built-in Authentication
export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  role: 'admin' | 'readonly' | 'user';
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
}

export interface Session {
  userId: string;
  token: string;
  expiresAt: string;
  createdAt: string;
}

export interface ProxmoxServer {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  realm: string;
  isActive: boolean;
  createdAt: string;
}

class LocalStorageService {
  private readonly USERS_KEY = 'proxmox_users';
  private readonly SESSIONS_KEY = 'proxmox_sessions';
  private readonly SERVERS_KEY = 'proxmox_servers';
  private readonly CURRENT_USER_KEY = 'proxmox_current_user';

  // User Management
  getUsers(): User[] {
    try {
      const users = localStorage.getItem(this.USERS_KEY);
      return users ? JSON.parse(users) : [];
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  }

  saveUsers(users: User[]): void {
    try {
      localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
    } catch (error) {
      console.error('Error saving users:', error);
    }
  }

  getUserById(id: string): User | null {
    const users = this.getUsers();
    return users.find(user => user.id === id) || null;
  }

  getUserByEmail(email: string): User | null {
    const users = this.getUsers();
    return users.find(user => user.email.toLowerCase() === email.toLowerCase()) || null;
  }

  getUserByUsername(username: string): User | null {
    const users = this.getUsers();
    return users.find(user => user.username.toLowerCase() === username.toLowerCase()) || null;
  }

  addUser(user: Omit<User, 'id' | 'createdAt' | 'lastLogin' | 'isActive'>): User {
    const users = this.getUsers();
    const newUser: User = {
      ...user,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      isActive: true
    };
    
    users.push(newUser);
    this.saveUsers(users);
    return newUser;
  }

  updateUser(id: string, updates: Partial<User>): boolean {
    const users = this.getUsers();
    const userIndex = users.findIndex(user => user.id === id);
    
    if (userIndex === -1) return false;
    
    users[userIndex] = { ...users[userIndex], ...updates };
    this.saveUsers(users);
    return true;
  }

  deleteUser(id: string): boolean {
    const users = this.getUsers();
    const filteredUsers = users.filter(user => user.id !== id);
    
    if (filteredUsers.length === users.length) return false;
    
    this.saveUsers(filteredUsers);
    return true;
  }

  // Session Management
  getSessions(): Session[] {
    try {
      const sessions = localStorage.getItem(this.SESSIONS_KEY);
      return sessions ? JSON.parse(sessions) : [];
    } catch (error) {
      console.error('Error getting sessions:', error);
      return [];
    }
  }

  saveSessions(sessions: Session[]): void {
    try {
      localStorage.setItem(this.SESSIONS_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.error('Error saving sessions:', error);
    }
  }

  createSession(userId: string): Session {
    const sessions = this.getSessions();
    const newSession: Session = {
      userId,
      token: this.generateToken(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      createdAt: new Date().toISOString()
    };
    
    sessions.push(newSession);
    this.saveSessions(sessions);
    return newSession;
  }

  getValidSession(token: string): Session | null {
    const sessions = this.getSessions();
    const session = sessions.find(s => s.token === token);
    
    if (!session) return null;
    
    // Check if session is expired
    if (new Date(session.expiresAt) < new Date()) {
      this.invalidateSession(token);
      return null;
    }
    
    return session;
  }

  invalidateSession(token: string): void {
    const sessions = this.getSessions();
    const filteredSessions = sessions.filter(s => s.token !== token);
    this.saveSessions(filteredSessions);
  }

  invalidateAllUserSessions(userId: string): void {
    const sessions = this.getSessions();
    const filteredSessions = sessions.filter(s => s.userId !== userId);
    this.saveSessions(filteredSessions);
  }

  // Current User Management
  setCurrentUser(user: User | null): void {
    if (user) {
      localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(this.CURRENT_USER_KEY);
    }
  }

  getCurrentUser(): User | null {
    try {
      const user = localStorage.getItem(this.CURRENT_USER_KEY);
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Proxmox Servers Management
  getServers(): ProxmoxServer[] {
    try {
      const servers = localStorage.getItem(this.SERVERS_KEY);
      return servers ? JSON.parse(servers) : [];
    } catch (error) {
      console.error('Error getting servers:', error);
      return [];
    }
  }

  saveServers(servers: ProxmoxServer[]): void {
    try {
      localStorage.setItem(this.SERVERS_KEY, JSON.stringify(servers));
    } catch (error) {
      console.error('Error saving servers:', error);
    }
  }

  addServer(server: Omit<ProxmoxServer, 'id' | 'createdAt'>): ProxmoxServer {
    const servers = this.getServers();
    const newServer: ProxmoxServer = {
      ...server,
      id: this.generateId(),
      createdAt: new Date().toISOString()
    };
    
    servers.push(newServer);
    this.saveServers(servers);
    return newServer;
  }

  updateServer(id: string, updates: Partial<ProxmoxServer>): boolean {
    const servers = this.getServers();
    const serverIndex = servers.findIndex(server => server.id === id);
    
    if (serverIndex === -1) return false;
    
    servers[serverIndex] = { ...servers[serverIndex], ...updates };
    this.saveServers(servers);
    return true;
  }

  deleteServer(id: string): boolean {
    const servers = this.getServers();
    const filteredServers = servers.filter(server => server.id !== id);
    
    if (filteredServers.length === servers.length) return false;
    
    this.saveServers(filteredServers);
    return true;
  }

  // Utility Methods
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private generateToken(): string {
    return btoa(Date.now().toString() + Math.random().toString()).replace(/[^a-zA-Z0-9]/g, '');
  }

  // Check if system needs initial setup
  needsSetup(): boolean {
    const users = this.getUsers();
    return users.length === 0;
  }

  // Initialize with admin user (called from setup wizard only)
  async initializeWithAdmin(email: string, password: string, name: string): Promise<User> {
    const users = this.getUsers();

    // Only create admin if no users exist (safety check)
    if (users.length > 0) {
      throw new Error('System already initialized');
    }

    // Validate password strength
    if (!this.validatePasswordStrength(password)) {
      throw new Error('Password does not meet security requirements');
    }

    const adminUser = this.addUser({
      username: email.split('@')[0],
      email,
      name,
      role: 'admin'
    });

    // Set the password hash for admin user
    const passwordHash = await this.hashPassword(password);
    localStorage.setItem(`user_password_${adminUser.id}`, passwordHash);

    return adminUser;
  }

  // Validate password strength
  validatePasswordStrength(password: string): boolean {
    // Minimum 12 characters, must include:
    // - At least one uppercase letter
    // - At least one lowercase letter
    // - At least one number
    // - At least one special character
    const minLength = 12;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    return password.length >= minLength &&
           hasUpperCase &&
           hasLowerCase &&
           hasNumber &&
           hasSpecialChar;
  }

  // Get password strength requirements message
  getPasswordRequirements(): string {
    return 'Password must be at least 12 characters and include uppercase, lowercase, number, and special character';
  }

  // Helper method to hash passwords
  private async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'proxmox-salt-2024');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Clear all data (for testing/reset)
  clearAllData(): void {
    localStorage.removeItem(this.USERS_KEY);
    localStorage.removeItem(this.SESSIONS_KEY);
    localStorage.removeItem(this.SERVERS_KEY);
    localStorage.removeItem(this.CURRENT_USER_KEY);
  }
}

export const storageService = new LocalStorageService();
