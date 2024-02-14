const {Octokit} = require('@octokit/rest');
const request = require('superagent');
const {default: PQueue} = require('p-queue');

async function getGithubStarredRepositories(username, token) {
  const octokit = new Octokit({
    auth: token || null,
  });
  
  // GitHub API by default only returns public repositories here
  const publicStarredRepositories = await octokit.paginate(octokit.rest.activity.listReposStarredByAuthenticatedUser, { username: username })
      .then(repositories => toRepositoryList(repositories));

  return publicStarredRepositories;
}

function toRepositoryList(repositories) {
  return repositories.map(repository => {
    return {
      name: repository.name,
      url: repository.clone_url,
      private: repository.private,
      owner: repository.owner.login,
      mirrorName: repository.owner.login + '.' + repository.name
    };
  });
}

async function getGiteaOrganization(gitea, organizationName) {
  return request.get(gitea.url + '/api/v1/orgs/' + organizationName)
    .set('Authorization', 'token ' + gitea.token)
    .then(response => {
      return { id: response.body.id, name: response.body.username }
    });
}

function isAlreadyMirroredOnGitea(repository, gitea, giteaOrganization) {
  const requestUrl = `${gitea.url}/api/v1/repos/${giteaOrganization.name}/${repository.mirrorName}`;
  return request.get(
    requestUrl)
    .set('Authorization', 'token ' + gitea.token)
    .then(() => true)
    .catch(() => false);
}

function mirrorOnGitea(repository, gitea, giteaOrganization, githubToken) {
  request.post(`${gitea.url}/api/v1/repos/migrate`)
    .set('Authorization', 'token ' + gitea.token)
    .send({
      auth_token: githubToken || null,
      clone_addr: repository.url,
      mirror: true,
      repo_name: repository.mirrorName,
      repo_owner: giteaOrganization.name,
      private: repository.private
    })
    .then(() => {
      console.log('Successfully mirrored to repo ' + giteaOrganization.name + '/' + repository.mirrorName);
    })
    .catch(err => {
      console.log('Failed to mirror repo ' + giteaOrganization.name + '/' + repository.mirrorName, err);
    });

}

async function mirror(repository, gitea, giteaOrganization, githubToken) {
  if (await isAlreadyMirroredOnGitea(repository, gitea, giteaOrganization)) {
    console.log('Repository is already mirrored; doing nothing: ', repository.name);
    return;
  }
  console.log('Mirroring repository to gitea: ', repository.name);
  await mirrorOnGitea(repository, gitea, giteaOrganization, githubToken);
}

async function main() {
  const githubUsername = process.env.GITHUB_USERNAME;
  if (!githubUsername) {
    console.error('No GITHUB_USERNAME specified, please specify! Exiting..');
    return;
  }
  const githubToken = process.env.GITHUB_TOKEN;
  const giteaUrl = process.env.GITEA_URL;

  if (!giteaUrl) {
    console.error('No GITEA_URL specified, please specify! Exiting..');
    return;
  }

  const giteaToken = process.env.GITEA_TOKEN;
  if (!giteaToken) {
    console.error('No GITEA_TOKEN specified, please specify! Exiting..');
    return;
  }

  const githubRepositories = await getGithubStarredRepositories(githubUsername, githubToken);
  console.log(`Found ${githubRepositories.length} repositories on github`);

  const gitea = {
    url: giteaUrl,
    token: giteaToken,
  };
  const giteaOrganizationName = process.env.GITEA_ORGANIZATION_NAME;
  const giteaOrganization = await getGiteaOrganization(gitea, giteaOrganizationName);

  const queue = new PQueue({ concurrency: 4 });
  await queue.addAll(githubRepositories.map(repository => {
    return async () => {
      await mirror(repository, gitea, giteaOrganization, githubToken);
    };
  }));
}

main();
