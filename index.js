const { Octokit } = require("@octokit/rest");
const sodium = require("tweetsodium");

const octokit = new Octokit({ auth: process.env.PAT });

async function run() {
  const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
  const {
    data: { key },
  } = await octokit.rest.actions.getRepoPublicKey({ owner, repo });
  console.log("Get public key", key);

  const value = new Date().toISOString();

  const messageBytes = Buffer.from(value);
  const keyBytes = Buffer.from(key, "base64");

  const encryptedBytes = sodium.seal(messageBytes, keyBytes);
  const encrypted_value = Buffer.from(encryptedBytes).toString("base64");

  await octokit.rest.actions.createOrUpdateRepoSecret({
    owner,
    repo,
    secret_name: "FOO",
    encrypted_value,
  });
}

run();
