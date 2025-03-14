// create-issues.js
const axios = require("axios");
require("dotenv").config();

const owner = process.env.GITHUB_USERNAME;
const repo = process.env.GITHUB_REPO;
const token = process.env.GITHUB_TOKEN;

// Milestones and Issues
const milestones = [
  {
    title: "🛠️ MVP Release",
    description: "Complete core hotel, flight, and logistics",
    due_on: "2025-03-31",
  },
  {
    title: "💳 Payment Integration",
    description: "Implement Paystack and Binance Pay",
    due_on: "2025-03-14",
  },
  {
    title: "📊 Admin & Hotel Dashboard",
    description: "Complete admin and hotel listing dashboard",
    due_on: "2025-03-21",
  },
  {
    title: "🚀 Deployment",
    description: "Finalize and deploy project on production",
    due_on: "2025-03-28",
  },
];

const issues = [
  // MVP Release
  { title: "Set up project structure (Backend & Frontend)", milestone: 1 },
  { title: "User authentication (JWT)", milestone: 1 },
  { title: "Implement hotel booking (API + manual listing)", milestone: 1 },
  { title: "Flight search via third-party API", milestone: 1 },
  { title: "Logistics booking and tracking", milestone: 1 },

  // Payment Integration
  { title: "Integrate Paystack for NGN payments", milestone: 2 },
  { title: "Implement Binance Pay for crypto payments", milestone: 2 },
  { title: "Create wallet deposit and withdrawal system", milestone: 2 },

  // Dashboard
  { title: "Hotel partner dashboard (CRUD for listings)", milestone: 3 },
  { title: "Admin panel for managing hotels and logistics", milestone: 3 },
  { title: "User wallet management interface", milestone: 3 },

  // Deployment
  { title: "Set up MongoDB Atlas for production", milestone: 4 },
  { title: "Deploy backend on Node.js (e.g., Vercel)", milestone: 4 },
  { title: "Deploy frontend (ReblendJS) on static hosting", milestone: 4 },
];

// GitHub API Helpers
const githubApi = axios.create({
  baseURL: `https://api.github.com/repos/${owner}/${repo}`,
  headers: { Authorization: `token ${token}` },
});

async function createMilestones() {
  for (const milestone of milestones) {
    try {
      const { data } = await githubApi.post("/milestones", milestone);
      console.log(`✅ Created milestone: ${milestone.title}`);
      milestone.number = data.number; // Save milestone number
    } catch (error) {
      console.error(
        `❌ Error creating milestone: ${milestone.title}`,
        error.response?.data || error.message
      );
    }
  }
}

async function createIssues() {
  for (const issue of issues) {
    try {
      const milestone = milestones.find((m) =>
        m.title.includes(issue.milestone === 1 ? "MVP" : m.title)
      );
      if (!milestone)
        throw new Error(`Milestone not found for: ${issue.title}`);
      await githubApi.post("/issues", {
        ...issue,
        milestone: milestone.number,
      });
      console.log(`✅ Created issue: ${issue.title}`);
    } catch (error) {
      console.error(
        `❌ Error creating issue: ${issue.title}`,
        error.response?.data || error.message
      );
    }
  }
}

createMilestones().then(() => createIssues());
