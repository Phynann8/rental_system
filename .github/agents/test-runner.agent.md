---
name: run-test-suite-and-open-failures
description: "Custom agent to run the .NET test suite, detect failing tests, and open the failing test files in VS Code."
author: GitHub Copilot
version: "1.0"
---

# run-test-suite-and-open-failures

Use this custom agent when you want a quick loop for test debugging in this repo.

## Behavior

1. Run the test command:
   - `dotnet test RentalSystem.Web/RentalSystem.Web.csproj --logger "console;verbosity=normal"`
   - include `--no-build` when appropriate.
2. Capture and parse the test output for failing tests.
3. For each failure, resolve the test source path and line number.
   - If the framework already reports file + line, hit that.
   - Otherwise, inspect `InvoiceManagerTests`, etc., and infer from method name.
4. Open each failing test location in the editor via `code -g "path:line"`.

## Tool usage

- Primary: `run_in_terminal`
- Secondary: `grep_search` / `file_search` if needed to locate test files by name.

## Step-by-step implementation example

1. Execute terminal command:

```
cd "d:\\1-Computer Science\\1-Personal Project\\rental_system"
 dotnet test "RentalSystem.Web/RentalSystem.Web.csproj" --logger "console;verbosity=detailed"
```

2. Collect failures from output lines containing `Failed` or `Total failures:`.

3. For each failure entry like:
   `Failed MyProject.Tests.ModernTests.ShouldCreateInvoice [<duration>]`:
   - grep in repository for `ShouldCreateInvoice` in `*Tests*.cs`.
   - open with `code -g "<path>:<line>"`.

4. If no failures, report success and do not open editors.

## Notes

- If running in environments without VS Code CLI, print the paths and line numbers for manual inspection.
- This agent is meant for local development loops and can be invoked from chat input with `/run-test-suite-and-open-failures`.
