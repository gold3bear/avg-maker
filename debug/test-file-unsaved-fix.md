# File Manager Unsaved Indicator Fix Test

## Issue Description
Previously, when editing any file, ALL files in the file manager would show the red unsaved indicator (●), instead of only the edited file.

## Root Cause
In `FileNode.tsx:33`, the code was calling `hasUnsavedChanges()` without a file path parameter:
```typescript
const isUnsaved = !node.isDirectory && hasUnsavedChanges(); // Wrong - checks global state
```

## Fix Applied
Modified `FileNode.tsx:33` to pass the specific file path:
```typescript
const isUnsaved = !node.isDirectory && hasUnsavedChanges(node.path); // Fixed - checks specific file
```

And updated `SaveContext.tsx` to handle the optional `filePath` parameter in `hasUnsavedChanges()`:
- When `filePath` is provided: Check specific file's dirty state
- When `filePath` is undefined: Check global state (any file has unsaved changes)

## Test Steps
1. Open the application
2. Open a project with multiple .ink files
3. Edit one file (make changes without saving)
4. Check file manager - only the edited file should show red ● indicator
5. Edit another file - both files should show indicators
6. Save one file - only the unsaved file should still show indicator

## Expected Behavior
✅ Only files with actual unsaved changes show the red unsaved indicator
✅ Other files remain unmarked
✅ Global unsaved state still works for save-all functionality

## Status
✅ **FIXED** - File-specific unsaved state tracking now works correctly