import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  pi.registerCommand("pr-comments", {
    description: "Fetch unresolved PR review comments from the current GitHub PR",
    handler: async (args, ctx) => {
      const additionalInput = args?.trim();

      const prompt = `You are an AI assistant integrated into a git-based version control system. Your task is to fetch and display ONLY UNRESOLVED comments from a GitHub pull request.

Follow these steps:

1. Use \`gh pr view --json number,headRefName,headRepository\` to get the PR number, branch, and repository info

2. Use the GitHub GraphQL API to fetch review threads with resolution status:
   \`\`\`bash
   gh api graphql -f query='
     query($owner: String!, $repo: String!, $number: Int!) {
       repository(owner: $owner, name: $repo) {
         pullRequest(number: $number) {
           reviewThreads(first: 100) {
             nodes {
               isResolved
               isOutdated
               path
               line
               startLine
               diffSide
               comments(first: 50) {
                 nodes {
                   author { login }
                   body
                   createdAt
                   diffHunk
                 }
               }
             }
           }
         }
       }
     }
   ' -f owner=OWNER -f repo=REPO -F number=NUMBER
   \`\`\`

3. Filter to show ONLY threads where \`isResolved\` is \`false\`

4. Parse and format all unresolved comments in a readable way

5. Return ONLY the formatted comments, with no additional text

Format the comments as:

## Unresolved Comments

[For each unresolved comment thread:]
- @author file.ts#line:
  \`\`\`diff
  [diffHunk from the API response]
  \`\`\`
  > quoted comment text

  [any replies indented]

If there are no unresolved comments, return "No unresolved comments found."

Remember:
1. Only show UNRESOLVED comments (isResolved: false)
2. Optionally note if a thread is outdated (isOutdated: true) with a marker like [outdated]
3. Preserve the threading/nesting of comment replies
4. Show the file and line number context for code review comments
5. Use jq to parse the JSON responses from the GitHub API

${additionalInput ? "Additional user input: " + additionalInput : ""}`;

      pi.sendUserMessage(prompt);
    },
  });
}
