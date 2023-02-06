const { Octokit } = require('@octokit/action')

const octokit = new Octokit()
const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/')

// See https://developer.github.com/v3/issues/#create-an-issue
const { data } = await octokit.request('POST /repos/{owner}/{repo}/issues', {
	owner,
	repo,
	title: 'My test issue',
})
console.log('Issue created: %s', data.html_url)
