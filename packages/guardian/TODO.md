# TODO - Technical Debt & Improvements

This file tracks technical debt, known issues, and improvements needed in the codebase.

## 🔴 Critical (Fix ASAP)

### Code Quality Issues
- [x] ~~**Reduce complexity in `HardcodeDetector.isInExportedConstant()`**~~ ✅ **FIXED**
  - ~~Current: Cyclomatic complexity 32~~
  - ~~Target: < 15~~
  - ~~Location: `src/infrastructure/analyzers/HardcodeDetector.ts:31`~~
  - ~~Solution: Split into smaller functions (isSingleLineExportConst, findExportConstStart, countUnclosedBraces)~~
  - Fixed on: 2025-11-24

### Type Safety
- [x] ~~**Fix template expression types**~~ ✅ **FIXED**
  - ~~Location: `src/domain/value-objects/HardcodedValue.ts:103`~~
  - ~~Issue: `Invalid type "string | number" of template literal expression`~~
  - ~~Solution: Convert to string before template using `String(value)`~~
  - Fixed on: 2025-11-24

- [x] ~~**Fix unknown type in template literals**~~ ✅ **FIXED**
  - ~~Location: `src/infrastructure/scanners/FileScanner.ts:52,66`~~
  - ~~Issue: `Invalid type "unknown" of template literal expression`~~
  - ~~Solution: Convert to string using `String(error)`~~
  - Fixed on: 2025-11-24

### Unused Variables
- [x] ~~**Remove or use constants in HardcodeDetector**~~ ✅ **FIXED**
  - ~~Removed unused imports: `CONTEXT_EXTRACT_SIZE`, `MIN_STRING_LENGTH`, `SINGLE_CHAR_LIMIT`, `SUGGESTION_KEYWORDS`~~
  - Fixed on: 2024-11-24

- [x] ~~**Fix unused function parameters**~~ ✅ **FIXED**
  - ~~Prefixed unused parameters with underscore: `_filePath`~~
  - Fixed on: 2024-11-24

---

## 🟡 Medium Priority

### ESLint Warnings
- [x] ~~**Fix unnecessary conditionals**~~ ✅ **FIXED**
  - ~~`BaseEntity.ts:34` - unnecessary conditional check~~
  - ~~`ValueObject.ts:13` - unnecessary conditional check~~
  - Fixed on: 2025-11-24

- [x] ~~**Use nullish coalescing (??) instead of OR (||)**~~ ✅ **FIXED**
  - ~~`HardcodeDetector.ts:322-324` - replaced `||` with `??` (3 instances)~~
  - Fixed on: 2025-11-24

### TypeScript Configuration
- [ ] **Add test files to tsconfig**
  - Currently excluded from project service
  - Files: `examples/*.ts`, `tests/**/*.test.ts`, `vitest.config.ts`
  - Solution: Add to tsconfig include or create separate tsconfig for tests

### Repository Pattern
- [x] ~~**Implement actual repository methods**~~ ✅ **NOT APPLICABLE**
  - ~~All methods in `BaseRepository` just throw errors~~
  - BaseRepository was removed from guardian package
  - Completed on: 2025-11-24

- [x] ~~**Remove require-await warnings**~~ ✅ **NOT APPLICABLE**
  - ~~All async methods in `BaseRepository` have no await~~
  - BaseRepository was removed from guardian package
  - Completed on: 2025-11-24

---

## 🟢 Low Priority / Nice to Have

### Code Organization
- [ ] **Consolidate constants**
  - Multiple constant files: `shared/constants/index.ts`, `infrastructure/constants/defaults.ts`, `domain/constants/suggestions.ts`
  - Consider merging or better organization

- [ ] **Improve Guards class structure**
  - Current warning: "Unexpected class with only static properties"
  - Consider: namespace, functions, or actual class instances

### Documentation
- [x] ~~**Add JSDoc comments to public APIs**~~ ✅ **FIXED**
  - ~~`analyzeProject()` function~~
  - ~~All exported types and interfaces~~
  - ~~Use cases~~
  - Added comprehensive JSDoc with examples
  - Completed on: 2025-11-24

- [ ] **Document architectural decisions**
  - Why CommonJS instead of ESM?
  - Why tree-sitter over other parsers?
  - Create ADR (Architecture Decision Records) folder

### Testing
- [x] ~~**Increase test coverage**~~ ✅ **FIXED**
  - ~~Current: 85.71% (target: 80%+)~~
  - **New: 94.24%** (exceeds 80% target!)
  - ~~But only 2 test files (Guards, BaseEntity)~~
  - **Now: 4 test files** with 93 tests total
  - ~~Need tests for:~~
    - ~~HardcodeDetector (main logic!)~~ ✅ 49 tests added
    - ~~HardcodedValue~~ ✅ 28 tests added
    - AnalyzeProject use case (pending)
    - CLI commands (pending)
    - FileScanner (pending)
    - CodeParser (pending)
  - Completed on: 2025-11-24

- [ ] **Add integration tests**
  - Test full workflow: scan → parse → detect → report
  - Test CLI end-to-end
  - Test on real project examples

### Performance
- [ ] **Profile and optimize HardcodeDetector**
  - Complex regex operations on large files
  - Consider caching parsed results
  - Batch processing for multiple files

- [ ] **Optimize tree-sitter parsing**
  - Parse only when needed
  - Cache parsed trees
  - Parallel processing for large projects

---

## 🔵 Future Enhancements

### CLI Improvements
- [ ] **Add progress bar for large projects**
  - Show current file being analyzed
  - Percentage complete
  - Estimated time remaining

- [ ] **Add watch mode**
  - `guardian check ./src --watch`
  - Re-run on file changes
  - Useful during development

- [ ] **Add fix mode**
  - `guardian fix ./src --interactive`
  - Auto-generate constants files
  - Interactive prompts for naming

### Configuration
- [ ] **Support guardian.config.js**
  - Custom rules configuration
  - Exclude patterns
  - Severity levels
  - See ROADMAP.md v0.5.0

### Output Improvements
- [ ] **Colorize CLI output**
  - Use chalk or similar library
  - Green for success, red for errors, yellow for warnings
  - Better visual hierarchy

- [ ] **Group violations by file**
  - Current: flat list
  - Better: group by file with collapsible sections

---

## 📝 Notes

### Known Limitations
1. **Exported constants detection** - may have false positives/negatives with complex nested structures
2. **Layer detection** - simple string matching, may not work with custom paths
3. **No incremental analysis** - always analyzes entire project (could cache results)

### Breaking Changes to Plan
When implementing these, consider semantic versioning:
- Config file format → MAJOR (1.0.0)
- CLI output format changes → MINOR (0.x.0)
- Bug fixes → PATCH (0.0.x)

---

## 📝 Recent Updates (2025-11-24)

### Completed Tasks
1. ✅ **Added comprehensive tests for HardcodeDetector** (49 tests)
   - Magic numbers detection (setTimeout, retries, ports, limits)
   - Magic strings detection (URLs, connection strings)
   - Exported constants detection
   - Allowed values handling
   - Context and line numbers

2. ✅ **Added tests for HardcodedValue** (28 tests)
   - Constant name suggestions for numbers and strings
   - Location suggestions based on context
   - Type checking methods

3. ✅ **Added JSDoc documentation**
   - Full documentation for `analyzeProject()` with examples
   - Documentation for HardcodeDetector class and methods
   - Proper @param and @returns tags

4. ✅ **Fixed ESLint errors**
   - Changed `||` to `??` (nullish coalescing)
   - Fixed template literal expressions with String()
   - Fixed constant truthiness errors

5. ✅ **Improved test coverage**
   - From 85.71% to 94.24% (statements)
   - All metrics now exceed 80% threshold
   - Total tests: 16 → 93 tests

---

**How to use this file:**
1. Move completed items to CHANGELOG.md
2. Create GitHub issues for items you want to work on
3. Link issues here with `#123` syntax
4. Keep this file up-to-date with new findings
