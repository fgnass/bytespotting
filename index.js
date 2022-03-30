const { Octokit } = require("@octokit/rest");
const octokit = new Octokit({ auth: process.env.PAT });

async function run() {
  const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
  const {
    data: { key },
  } = await octokit.rest.actions.getRepoPublicKey({ owner, repo });
  console.log("Get public key", key);
}

run();
