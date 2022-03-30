const { Octokit } = require("@octokit/action");
const octokit = new Octokit();

async function run() {
  const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
  const res = await octokit.actions.getRepoPublicKey({ owner, repo });
  console.log("Get public key", res);
}

run();
