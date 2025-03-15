/**
 * Created by Emmanuel Paul Elom <scansioquielom@gmail.com>
 * on 14th March, 2025
 */

const axios = require("axios");
require("dotenv").config();

const owner = process.env.GITHUB_USERNAME;
const repo = process.env.GITHUB_REPO;
const token = process.env.GITHUB_TOKEN;
const projectName = process.env.GITHUB_PROJECT_NAME;

// GraphQL Client
const githubGraphQL = axios.create({
  baseURL: "https://api.github.com/graphql",
  headers: { Authorization: `Bearer ${token}` },
});

// REST API Client
const githubApi = axios.create({
  baseURL: `https://api.github.com/repos/${owner}/${repo}`,
  headers: { Authorization: `token ${token}` },
});

// Helper: Delay function (to avoid rate limits)
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Milestones and issues data
const milestones = [
  {
    title: "🛠️ MVP Release",
    description:
      "Core functionality of booking.ng - hotel, flights, and logistics.",
    due_on: "2025-03-31",
    issues: [
      {
        title: "Set up project structure (Backend & Frontend)",
        body: "Initialize ReblendJS frontend and Node.js backend with MongoDB.",
      },
      {
        title: "User authentication (JWT)",
        body: "Implement JWT-based user authentication for the app.",
      },
      {
        title: "Implement hotel booking (API + manual listing)",
        body: "Integrate third-party hotel APIs and allow manual hotel listings.",
      },
    ],
  },
  {
    title: "💳 Payment Integration",
    description:
      "Integrate Paystack and Binance Pay for wallet deposits and payments.",
    due_on: "2025-04-07",
    issues: [
      {
        title: "Integrate Paystack for NGN payments",
        body: "Implement Paystack for processing NGN payments securely.",
      },
      {
        title: "Implement Binance Pay for crypto payments",
        body: "Integrate Binance Pay for secure cryptocurrency transactions.",
      },
      {
        title: "Create wallet deposit and withdrawal system",
        body: "Allow users to deposit and withdraw from their in-app wallet.",
      },
    ],
  },
  {
    title: "📊 Admin & Hotel Dashboard",
    description:
      "Admin panel and hotel partner dashboard for managing services.",
    due_on: "2025-04-14",
    issues: [
      {
        title: "Hotel partner dashboard (CRUD for listings)",
        body: "Build a dashboard to allow hotel partners to manage listings.",
      },
      {
        title: "Admin panel for managing hotels and logistics",
        body: "Admin interface for managing hotels and logistics services.",
      },
      {
        title: "User wallet management interface",
        body: "Admin interface to manage and track user wallet activity.",
      },
    ],
  },
  {
    title: "🚀 Deployment",
    description: "Deploy the frontend and backend for public access.",
    due_on: "2025-04-21",
    issues: [
      {
        title: "Set up MongoDB Atlas for production",
        body: "Configure and migrate MongoDB to MongoDB Atlas for scalability.",
      },
      {
        title: "Deploy backend on Node.js (e.g., Vercel)",
        body: "Deploy the Node.js backend on a platform like Vercel.",
      },
      {
        title: "Deploy frontend (ReblendJS) on static hosting",
        body: "Deploy the frontend on a static hosting service.",
      },
    ],
  },
];

// Get repository node ID (for GraphQL API)
async function getRepoNodeId() {
  const query = `
    query {
      repository(owner: "${owner}", name: "${repo}") {
        id
      }
    }
  `;
  const { data } = await githubGraphQL.post("", { query });
  return data.data.repository.id;
}

// Get user or organization node ID (for GraphQL API)
async function getOwnerNodeId() {
  const query = `
    query {
      user(login: "${owner}") {
        id
      }
      organization(login: "${owner}") {
        id
      }
    }
  `;
  const { data } = await githubGraphQL.post("", { query });
  
  return data.data.user?.id || data.data.organization?.id;
}

// Updated getOrCreateProject function (with ownerId)
async function getOrCreateProject(repoId) {
  const query = `
    query {
      repository(owner: "${owner}", name: "${repo}") {
        projectsV2(first: 10) {
          nodes {
            id
            title
          }
        }
      }
    }
  `;
  const { data } = await githubGraphQL.post("", { query });
  
  const project = data.data.repository.projectsV2.nodes.find((p) => p.title === projectName);
  if (project) {
    console.log(`✅ Found existing project: ${projectName}`);
    return project.id;
  }

  const ownerId = await getOwnerNodeId(); // Fetch user/organization ID
  console.log(`✅ OWNER_ID: ${ownerId}`);

  const mutation = `
    mutation {
      createProjectV2(input: {title: "${projectName}", ownerId: "${ownerId}"}) {
        projectV2 {
          id
          title
        }
      }
    }
  `;
  const response = await githubGraphQL.post("", { query: mutation });
  
  const newProject = response.data.data.createProjectV2.projectV2;
  console.log(`🚀 Created new project: ${newProject.title}`);
  return newProject.id;
}

// Create milestone via REST API (fixed ISO 8601 format)
async function createMilestone(title, description, due_on) {
  try {
    const formattedDueDate = new Date(due_on).toISOString(); // Ensure correct format
    const { data } = await githubApi.post("/milestones", {
      title,
      description,
      due_on: formattedDueDate,
    });
    console.log(`✅ Created milestone: ${title}`);
    return data.number;
  } catch (error) {
    console.error(
      `❌ Error creating milestone (${title}):`,
      error.response?.data || error.message
    );
    return null;
  }
}


// Create issue and link it to milestone and project
async function createIssue(title, body, milestoneNumber) {
  try {
    const { data: issue } = await githubApi.post("/issues", {
      title,
      body,
      milestone: milestoneNumber,
    });
    console.log(`✅ Created issue: ${title}`);
    return issue.node_id; // Needed for GraphQL linking
  } catch (error) {
    console.error(
      `❌ Error creating issue (${title}):`,
      error.response?.data || error.message
    );
    return null;
  }
}

// Add issue to the new GitHub project (beta)
async function addIssueToProject(projectId, issueNodeId) {
  const mutation = `
    mutation {
      addProjectV2ItemById(input: {projectId: "${projectId}", contentId: "${issueNodeId}"}) {
        item {
          id
        }
      }
    }
  `;
  try {
    await delay(2000); // Avoid hitting rate limits
    await githubGraphQL.post("", { query: mutation });
    console.log(`📌 Linked issue to project.`);
  } catch (error) {
    console.error(
      "❌ Error linking issue to project:",
      error.response?.data || error.message
    );
  }
}

// Main function
async function createMilestonesAndIssues() {
  const repoNodeId = await getRepoNodeId();
  const projectId = await getOrCreateProject(repoNodeId);

  for (const milestone of milestones) {
    const milestoneNumber = await createMilestone(
      milestone.title,
      milestone.description,
      milestone.due_on
    );
    if (milestoneNumber) {
      for (const issue of milestone.issues) {
        const issueNodeId = await createIssue(
          issue.title,
          issue.body,
          milestoneNumber
        );
        if (issueNodeId) {
          await addIssueToProject(projectId, issueNodeId);
        }
      }
    }
  }

  console.log(
    "🎯 All milestones, issues, and project links created successfully!"
  );
}

// Run script
createMilestonesAndIssues().catch((error) => {
  console.error("❌ Unexpected error:", error);
});
