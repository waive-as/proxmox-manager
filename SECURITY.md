# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |
| < 0.1   | :x:                |

## Reporting a Vulnerability

We take the security of Proxmox Manager Portal seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### Please DO NOT

- Open a public GitHub issue for security vulnerabilities
- Discuss the vulnerability in public forums, chat rooms, or social media
- Exploit the vulnerability beyond what is necessary to demonstrate it

### Please DO

**Report security vulnerabilities privately** by:

1. **Email**: Send details to peter.skaugvold@waive.no with the subject line "Security Vulnerability Report"
2. **GitHub Security Advisory**: Use the [GitHub Security Advisory](https://github.com/waive-as/proxmox-manager/security/advisories/new) feature

### What to Include in Your Report

Please provide as much information as possible to help us understand and resolve the issue quickly:

- **Type of vulnerability** (e.g., SQL injection, XSS, authentication bypass)
- **Full paths of affected source files**
- **Location of the affected code** (tag/branch/commit or direct URL)
- **Step-by-step instructions** to reproduce the issue
- **Proof-of-concept or exploit code** (if possible)
- **Impact of the vulnerability** (what an attacker could achieve)
- **Any suggested fixes** (if you have them)
- **Your contact information** (so we can follow up)

### What to Expect

- **Acknowledgment**: We will acknowledge your report within 48 hours
- **Updates**: We will send you regular updates about our progress
- **Fix Timeline**: We aim to resolve critical vulnerabilities within 7 days
- **Disclosure**: We will coordinate the public disclosure timing with you
- **Credit**: We will give you credit for the discovery (unless you prefer to remain anonymous)

## Security Best Practices

### For Users

When deploying Proxmox Manager Portal:

1. **Use HTTPS**: Always deploy behind HTTPS in production
2. **Change Default Credentials**: Never use default passwords (the app enforces setup wizard)
3. **Keep Updated**: Regularly update to the latest version
4. **Secure Your Server**: Follow Proxmox VE security best practices
5. **Network Security**: Deploy behind a firewall, restrict access appropriately
6. **Review Permissions**: Regularly audit user roles and permissions
7. **Backup**: Maintain regular backups of your configuration and data

### For Developers

When contributing:

1. **Input Validation**: Always validate and sanitize user inputs
2. **Authentication**: Never bypass authentication checks
3. **Authorization**: Verify permissions before allowing actions
4. **SQL Injection**: Use parameterized queries (we use Prisma ORM)
5. **XSS Prevention**: Sanitize output, especially user-generated content
6. **CSRF Protection**: Ensure CSRF tokens are used for state-changing operations
7. **Secrets**: Never commit secrets, API keys, or passwords
8. **Dependencies**: Keep dependencies updated and audit for vulnerabilities
9. **Error Messages**: Don't expose sensitive information in error messages
10. **Logging**: Log security events but never log sensitive data

## Known Security Considerations

### Current Implementation

- **Authentication**: JWT-based with localStorage (for standalone mode)
- **Password Storage**: SHA-256 with salt (basic hashing)
- **CORS**: Proxy server handles cross-origin requests
- **Session Management**: Token-based with expiration

### Future Improvements

We are aware of the following areas for security enhancement:

1. **Password Hashing**: Migrate from SHA-256 to bcrypt/argon2
2. **Rate Limiting**: Implement rate limiting on authentication endpoints
3. **2FA Support**: Add two-factor authentication option
4. **Audit Logging**: Enhanced security event logging
5. **CSP Headers**: Implement Content Security Policy
6. **Session Management**: Add refresh token rotation

See [ROADMAP.md](docs/ROADMAP.md) for planned security enhancements.

## Security Updates

Security updates are released as soon as possible after a vulnerability is confirmed and fixed. We will:

1. Release a patch version (e.g., 0.1.1 → 0.1.2)
2. Publish a security advisory on GitHub
3. Update the CHANGELOG.md with security fix details
4. Notify users through GitHub releases

## Bug Bounty Program

We currently do not have a bug bounty program, but we greatly appreciate responsible disclosure and will acknowledge security researchers in our release notes.

## Compliance

This project aims to follow security best practices including:

- OWASP Top 10 guidelines
- CWE/SANS Top 25 Most Dangerous Software Errors
- Secure coding practices

## Additional Resources

- [OWASP Proxmox Security](https://www.owasp.org/)
- [Proxmox VE Security Documentation](https://pve.proxmox.com/wiki/Security)
- [Web Application Security Best Practices](https://cheatsheetseries.owasp.org/)

## Questions?

If you have questions about security that don't involve a specific vulnerability, please:

- Open a [GitHub Discussion](https://github.com/waive-as/proxmox-manager/discussions) (for general security questions)
- Review our [documentation](docs/)
- Check existing security-related issues

---

**Last Updated**: November 20, 2025

Thank you for helping keep Proxmox Manager Portal and its users safe!
