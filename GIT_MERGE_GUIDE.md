# Git Branch Merging and Conflict Resolution Guide

## Current Situation
- You're on the `main` branch
- You have uncommitted changes in 4 files
- There's a remote branch `ayo-work` that could be merged

## Step-by-Step Merge Process

### 1. Prepare Your Working Directory

**Option A: Commit your changes first (Recommended)**
```powershell
git add .
git commit -m "Your commit message describing the changes"
```

**Option B: Stash your changes temporarily**
```powershell
git stash
# After merge, restore with: git stash pop
```

### 2. Fetch Latest Changes from Remote
```powershell
git fetch origin
```

### 3. Merge a Branch

**Merge a remote branch into current branch:**
```powershell
git merge origin/ayo-work
```

**Or merge a local branch:**
```powershell
git checkout main
git merge branch-name
```

### 4. Handling Merge Conflicts

When conflicts occur, Git will mark them in the files. You'll see markers like:

```
<<<<<<< HEAD
Your current code (from main branch)
=======
Code from the branch being merged
>>>>>>> branch-name
```

**Steps to resolve:**

1. **Open the conflicted files** in your editor
2. **Look for conflict markers** (`<<<<<<<`, `=======`, `>>>>>>>`)
3. **Decide what to keep:**
   - Keep your version (HEAD)
   - Keep their version (incoming)
   - Combine both
   - Write something new
4. **Remove the conflict markers** after resolving
5. **Stage the resolved files:**
   ```powershell
   git add path/to/resolved-file.js
   ```
6. **Complete the merge:**
   ```powershell
   git commit
   ```

### 5. Abort a Merge (if needed)
```powershell
git merge --abort
```

## Common Merge Strategies

### Merge Commit (Default)
Creates a merge commit combining both branches:
```powershell
git merge branch-name
```

### Squash Merge
Combines all commits into one:
```powershell
git merge --squash branch-name
git commit -m "Merged branch-name into main"
```

### Rebase (Alternative to merge)
Replays your commits on top of the other branch:
```powershell
git rebase branch-name
```

## Best Practices

1. **Always commit or stash** before merging
2. **Pull latest changes** before merging: `git pull origin main`
3. **Test after merging** to ensure everything works
4. **Use descriptive commit messages** for merge commits
5. **Review conflicts carefully** - don't just accept one side blindly

## Visual Tools for Conflict Resolution

You can use:
- VS Code's built-in merge conflict editor
- `git mergetool` to use external tools
- GitHub Desktop or other GUI tools

## Example: Merging `ayo-work` into `main`

```powershell
# 1. Commit or stash current changes
git add .
git commit -m "Save current work"

# 2. Fetch latest
git fetch origin

# 3. Merge
git merge origin/ayo-work

# 4. If conflicts occur, resolve them, then:
git add .
git commit -m "Merge origin/ayo-work into main"

# 5. Push to remote
git push origin main
```

