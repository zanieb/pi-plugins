---
description: Use hyperfine for benchmarking commands. Use when comparing performance of commands or measuring execution time.
---

```
A command-line benchmarking tool.

Usage: hyperfine [OPTIONS] <command>...

Arguments:
  <command>...
          The command to benchmark. This can be the name of an executable, a
          command line like "grep -i todo" or a shell command like "sleep 0.5 &&
          echo test". If multiple commands are given, hyperfine will show a
          comparison of the respective runtimes.

Options:
  -w, --warmup <NUM>
          Perform NUM warmup runs before the actual benchmark.
  -m, --min-runs <NUM>
          Perform at least NUM runs for each command (default: 10).
  -M, --max-runs <NUM>
          Perform at most NUM runs for each command.
  -r, --runs <NUM>
          Perform exactly NUM runs for each command.
  -s, --setup <CMD>
          Execute CMD before each set of timing runs.
  -p, --prepare <CMD>
          Execute CMD before each timing run (e.g. clearing disk caches).
  -c, --cleanup <CMD>
          Execute CMD after all benchmarking runs for each command.
  -P, --parameter-scan <VAR> <MIN> <MAX>
          Benchmark for each value in the range MIN..MAX.
          Example: hyperfine -P threads 1 8 'make -j {threads}'
  -D, --parameter-step-size <DELTA>
          Traverse the range MIN..MAX in steps of DELTA.
  -L, --parameter-list <VAR> <VALUES>
          Benchmark for each value in a comma-separated list.
          Example: hyperfine -L compiler gcc,clang '{compiler} -O2 main.cpp'
  -S, --shell <SHELL>
          Set the shell to use for executing benchmarked commands.
  -N
          An alias for '--shell=none'.
  -i, --ignore-failure
          Ignore non-zero exit codes.
      --style <TYPE>
          Set output style: auto, basic, full, nocolor, color, none.
      --sort <METHOD>
          Sort order: auto, command, mean-time.
  -u, --time-unit <UNIT>
          Time unit: microsecond, millisecond, second.
      --export-asciidoc <FILE>
          Export as AsciiDoc table.
      --export-csv <FILE>
          Export as CSV.
      --export-json <FILE>
          Export as JSON (includes individual run timings).
      --export-markdown <FILE>
          Export as Markdown table.
      --export-orgmode <FILE>
          Export as Emacs org-mode table.
      --show-output
          Print stdout and stderr of the benchmark.
      --output <WHERE>
          Redirect output: null (default), pipe, inherit, <FILE>.
      --input <WHERE>
          Control input: null (default), <FILE>.
  -n, --command-name <NAME>
          Give a meaningful name to a command.
```
