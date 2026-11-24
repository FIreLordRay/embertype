/**
 * 500 tech words for the "tech" toggle: the vocabulary of code, the web, IT support, data
 * and how software teams work. Lowercase letters only, like ENGLISH_200, so punctuation
 * and numbers can still be mixed in.
 */
export const TECH_WORDS = Object.freeze([
  // code
  'code', 'variable', 'function', 'string', 'integer', 'boolean', 'array', 'object', 'class', 'method',
  'loop', 'syntax', 'compile', 'compiler', 'runtime', 'debug', 'debugger', 'exception', 'null', 'undefined',
  'return', 'import', 'export', 'module', 'library', 'framework', 'package', 'dependency', 'algorithm', 'recursion',
  'iterate', 'index', 'parameter', 'argument', 'callback', 'async', 'await', 'promise', 'thread', 'process',
  'stack', 'heap', 'queue', 'pointer', 'binary', 'byte', 'refactor', 'regex', 'parse', 'script',
  'python', 'javascript', 'typescript', 'java', 'json', 'yaml', 'markdown', 'lambda', 'constructor', 'interface',
  // web
  'html', 'css', 'react', 'component', 'props', 'state', 'hook', 'render', 'frontend', 'backend',
  'fullstack', 'server', 'client', 'browser', 'endpoint', 'request', 'response', 'api', 'rest', 'http',
  'https', 'url', 'domain', 'cookie', 'session', 'token', 'cache', 'webhook', 'payload', 'middleware',
  'responsive', 'viewport', 'layout', 'pixel', 'localhost', 'deploy', 'hosting', 'cloud', 'serverless', 'container',
  // data
  'data', 'database', 'query', 'schema', 'table', 'column', 'row', 'record', 'sql', 'join',
  'dataset', 'analytics', 'dashboard', 'spreadsheet', 'pivot', 'metric', 'pipeline', 'model', 'prompt', 'training',
  // git and teamwork
  'git', 'github', 'repository', 'commit', 'branch', 'merge', 'push', 'pull', 'clone', 'fork',
  'conflict', 'review', 'release', 'version', 'patch', 'bug', 'feature', 'ticket', 'issue', 'backlog',
  'agile', 'scrum', 'sprint', 'standup', 'kanban', 'retro', 'stakeholder', 'requirement', 'wireframe', 'prototype',
  'roadmap', 'milestone', 'deadline', 'workflow', 'automation', 'testing', 'unit', 'integration', 'devops', 'documentation',
  // IT and security
  'network', 'router', 'firewall', 'ethernet', 'wifi', 'bandwidth', 'latency', 'protocol', 'dns', 'vpn',
  'encryption', 'password', 'authentication', 'authorization', 'phishing', 'malware', 'backup', 'admin', 'permission', 'credential',
  'hardware', 'software', 'firmware', 'driver', 'kernel', 'linux', 'windows', 'terminal', 'shell', 'command',
  'cpu', 'gpu', 'memory', 'storage', 'virtual', 'install', 'update', 'config', 'troubleshoot', 'helpdesk',
  // languages and tools
  'kotlin', 'swift', 'rust', 'ruby', 'php', 'bash', 'powershell', 'node', 'npm', 'angular',
  'vue', 'bootstrap', 'django', 'flask', 'pandas', 'notebook', 'vscode', 'ide', 'editor', 'extension',
  'plugin', 'linter', 'formatter', 'bundle', 'snippet', 'boilerplate', 'scaffold', 'sandbox', 'emulator', 'simulator',
  'android', 'mysql', 'mongodb',
  // more code
  'constant', 'scope', 'closure', 'generator', 'iterator', 'decorator', 'inheritance', 'polymorphism', 'encapsulation', 'abstraction',
  'instance', 'attribute', 'property', 'enum', 'tuple', 'dictionary', 'vector', 'matrix', 'float', 'double',
  'static', 'public', 'private', 'protected', 'template', 'generic', 'type', 'cast', 'operator', 'expression',
  'statement', 'conditional', 'switch', 'break', 'continue', 'assert', 'mock', 'fixture', 'event', 'listener',
  'handler', 'store', 'context', 'route', 'stream', 'buffer', 'overflow', 'concurrency', 'parallel', 'leak',
  'flag', 'toggle', 'unicode', 'encoding', 'encode', 'decode',
  // web and design
  'dom', 'element', 'flexbox', 'grid', 'margin', 'padding', 'border', 'font', 'selector', 'animation',
  'transition', 'transform', 'opacity', 'shadow', 'gradient', 'canvas', 'accessibility', 'semantic', 'offline', 'mobile',
  'desktop', 'native', 'navigation', 'mockup', 'figma', 'usability', 'persona', 'theme',
  // cloud and ops
  'aws', 'azure', 'docker', 'kubernetes', 'cluster', 'artifact', 'build', 'staging', 'production', 'environment',
  'rollout', 'rollback', 'hotfix', 'uptime', 'downtime', 'outage', 'incident', 'monitor', 'logging', 'alert',
  'scalable', 'proxy', 'gateway', 'cdn', 'microservice', 'monolith', 'architecture', 'codebase', 'changelog', 'readme',
  'license', 'opensource', 'contributor', 'maintainer', 'tag', 'scheduler',
  // data and ai
  'crud', 'migration', 'seed', 'primary', 'foreign', 'constraint', 'normalize', 'transaction', 'document', 'collection',
  'aggregate', 'select', 'insert', 'delete', 'filter', 'map', 'reduce', 'average', 'median', 'regression',
  'classification', 'neural', 'inference', 'llm', 'chatbot', 'agent', 'bias', 'accuracy', 'precision', 'recall',
  'label', 'batch', 'visualization', 'chart', 'histogram', 'scatter', 'excel', 'powerbi', 'tableau', 'xml',
  'csv',
  // security and networks
  'secret', 'vault', 'certificate', 'ssl', 'hashing', 'oauth', 'sso', 'mfa', 'biometric', 'captcha',
  'spam', 'ransomware', 'trojan', 'worm', 'virus', 'antivirus', 'exploit', 'vulnerability', 'breach', 'forensics',
  'audit', 'compliance', 'policy', 'governance', 'risk', 'threat', 'ddos', 'botnet', 'spoofing', 'packet',
  'subnet', 'modem', 'cable', 'fiber', 'wireless', 'bluetooth', 'hotspot', 'ping', 'lan', 'wan',
  'isp', 'upload', 'download', 'sync', 'online',
  // IT support and hardware
  'printer', 'scanner', 'peripheral', 'usb', 'hdmi', 'charger', 'battery', 'motherboard', 'processor', 'ssd',
  'laptop', 'smartphone', 'sensor', 'arduino', 'reboot', 'reinstall', 'upgrade', 'activation', 'directory', 'folder',
  'filesystem', 'partition', 'bios', 'escalation', 'triage', 'knowledgebase', 'onboarding', 'remote',
  // git, testing and careers
  'diff', 'stash', 'rebase', 'checkout', 'origin', 'upstream', 'gitignore', 'lint', 'coverage', 'selenium',
  'playwright', 'pytest', 'tdd', 'beta', 'launch', 'mvp', 'startup', 'hackathon', 'internship', 'portfolio',
  'resume', 'linkedin', 'interview', 'mentor', 'cohort', 'bootcamp', 'epic', 'story', 'velocity', 'burndown',
  'blocker', 'assignee', 'estimate',
])
