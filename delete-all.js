/**
 * Created by Emmanuel Paul Elom <scansioquielom@gmail.com>
 * on 14th March, 2025
 */

const axios = require("axios");
const readline = require("readline"); // ✅ Import readline module
require("dotenv").config();

const owner = process.env.GITHUB_USERNAME;
const repo = process.env.GITHUB_REPO;
const token = process.env.GITHUB_TOKEN;

// GitHub API client
const githubApi = axios.create({
  baseURL: `https://api.github.com/repos/${owner}/${repo}`,
  headers: { Authorization: `token ${token}` },
});

// Helper: Create a user input interface
const prompt = (question) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => rl.question(question, (answer) => {
    rl.close();
    resolve(answer.trim());
  }));
};

// Fetch open issues
async function getOpenIssues() {
  try {
    const { data } = await githubApi.get("/issues?state=open&per_page=100");
    return data.filter((issue) => !issue.pull_request); // Exclude PRs
  } catch (error) {
    console.error("❌ Error fetching open issues:", error.response?.data || error.message);
    return [];
  }
}

// Delete an issue by ID
async function deleteIssue(issueNumber) {
  try {
    await githubApi.patch(`/issues/${issueNumber}`, { state: "closed" });
    console.log(`✅ Deleted issue #${issueNumber}`);
  } catch (error) {
    console.error(`❌ Error deleting issue #${issueNumber}:`, error.response?.data || error.message);
  }
}

// Fetch open milestones
async function getOpenMilestones() {
  try {
    const { data } = await githubApi.get("/milestones?state=open&per_page=100");
    return data;
  } catch (error) {
    console.error("❌ Error fetching milestones:", error.response?.data || error.message);
    return [];
  }
}

// Delete a milestone by ID
async function deleteMilestone(milestoneNumber) {
  try {
    await githubApi.delete(`/milestones/${milestoneNumber}`);
    console.log(`✅ Deleted milestone #${milestoneNumber}`);
  } catch (error) {
    console.error(`❌ Error deleting milestone #${milestoneNumber}:`, error.response?.data || error.message);
  }
}

// Delete all open issues and milestones
async function deleteAll() {
  console.log("⚠️ WARNING: This will delete ALL open issues and milestones in your repository!");

  // First confirmation
  const confirm1 = await prompt("Are you absolutely sure? (yes/no): ");
  if (confirm1.toLowerCase() !== "yes") {
    console.log("❌ Deletion aborted.");
    return;
  }

  // Second confirmation
  const confirm2 = await prompt('This action is irreversible. Type "DELETE" to confirm: ');
  if (confirm2 !== "DELETE") {
    console.log("❌ Deletion aborted.");
    return;
  }

  console.log("🗑️ Deleting all open issues and milestones...");

  // Delete issues
  const openIssues = await getOpenIssues();
  if (openIssues.length === 0) {
    console.log("✅ No open issues found.");
  } else {
    console.log(`🔍 Found ${openIssues.length} open issues. Deleting...`);
    for (const issue of openIssues) {
      await deleteIssue(issue.number);
    }
  }

  // Delete milestones
  const openMilestones = await getOpenMilestones();
  if (openMilestones.length === 0) {
    console.log("✅ No open milestones found.");
  } else {
    console.log(`🔍 Found ${openMilestones.length} open milestones. Deleting...`);
    for (const milestone of openMilestones) {
      await deleteMilestone(milestone.number);
    }
  }

  console.log("🚀 All open issues and milestones have been deleted.");
}

// Run the script
deleteAll().catch((error) => {
  console.error("❌ Unexpected error:", error);
});
