# Publishing Guide

## Part A: Push to GitHub

### 1. Create a new repository on GitHub
- Go to https://github.com/new
- Create a new repository (e.g., `rn-rich-editor`)
- **DO NOT** initialize with README, .gitignore, or license (we already have these)

### 2. Add files and commit
```bash
git add .
git commit -m "Initial commit"
```

### 3. Add GitHub remote and push
```bash
# Replace YOUR_USERNAME with your GitHub username
git remote add origin https://github.com/YOUR_USERNAME/rn-rich-editor.git
git branch -M main
git push -u origin main
```

---

## Part B: Publish to npm

### Package Name

Your package name is `rn-rich-text-editor` (unscoped package).

- Check availability: https://www.npmjs.com/package/rn-rich-text-editor
- Users will install with: `npm install rn-rich-text-editor`

### Steps to Publish:

1. **Update package.json repository URL** (after you push to GitHub):
   ```json
   "repository": {
     "type": "git",
     "url": "https://github.com/YOUR_USERNAME/rn-rich-editor.git"
   }
   ```

2. **Login to npm** (if not already logged in):
   ```bash
   npm login
   ```

3. **Verify you're logged in**:
   ```bash
   npm whoami
   ```

4. **Build the project**:
   ```bash
   npm run build
   ```

5. **Publish to npm**:
   ```bash
   npm publish
   ```

6. **Verify publication**:
   - Check: https://www.npmjs.com/package/rn-rich-text-editor

### Updating the Package

When you make changes:

1. Update version in `package.json`:
   ```bash
   npm version patch  # 0.0.1 -> 0.0.2
   npm version minor  # 0.0.1 -> 0.1.0
   npm version major  # 0.0.1 -> 1.0.0
   ```

2. Build and publish:
   ```bash
   npm run build
   npm publish
   ```

3. Push to GitHub:
   ```bash
   git add .
   git commit -m "Bump version to X.X.X"
   git push
   git push --tags  # Push version tag
   ```

---

## Quick Checklist

- [ ] Update `package.json` repository URL with your GitHub URL
- [ ] Update `package.json` author field with your name/email
- [ ] (Optional) Change package name if needed
- [ ] Build project: `npm run build`
- [ ] Create GitHub repository
- [ ] Push to GitHub
- [ ] Login to npm: `npm login`
- [ ] Publish: `npm publish`
