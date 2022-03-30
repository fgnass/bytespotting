const { Octokit } = require("@octokit/core");
const octokit = new Octokit({ auth: process.env.PAT });

async function run() {
  const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
  const res = await octokit.rest.actions.getRepoPublicKey({ owner, repo });
  console.log("Get public key", res);
}

run();
