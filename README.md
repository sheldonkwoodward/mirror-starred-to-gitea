# Automatically Mirror Github Starred Repo To Your Gitea Server
Based on [jaedle's mirror-to-gitea script](https://github.com/jaedle/mirror-to-gitea) 

## Description
This script automatically mirrors the starred repositories from a github-user to your gitea server.
Once started, it will create a mirrored repository under a given token for a gitea organization, completely automatically.

Example:
A github user `github-user` has starred repositories `dotfiles` and `zsh-config`.
Starting the script with a gitea token for the account `gitea-user` will create the following mirrored repositories:

- github.com/github-user-1/dotfiles &rarr; your-gitea.url/gitea-organization/github-user-1.dotfiles
- github.com/github-user-2/zsh-config &rarr; your-gitea.url/gitea-organization/github-user-2.zsh-config

The mirror settings are default by your gitea instance.

## Prerequisites
- A github user or organization with repositories
- Configured Gitea instance up and running
- User and organization for Gitea with generated token (Settings -> Applications -> Generate New Token)
- Docker Compose

### Docker Compose
See `docker-compose.yml.sample` for an example configuration

## Parameters
### Required
- `GITHUB_USERNAME`: The name of your user or organization which public repos should be mirrored
- `GITHUB_TOKEN`: [GitHub personal access token](https://docs.github.com/en/free-pro-team@latest/github/authenticating-to-github/creating-a-personal-access-token). **Attention: if this is set, the token will be transmitted to your specified Gitea instance!**
- `GITEA_URL`: The url of your gitea server
- `GITEA_ORGANIZATION_NAME`: The name of an organization your user can access that all the repositories will be mirrored to
- `GITEA_TOKEN`: The token for your gitea user (Settings -> Applications -> Generate New Token)

### Optional
- `DELAY`: How often to check for new repositories in seconds. Default is 3600 (1 hour).
