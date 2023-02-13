const { Octokit } = require('@octokit/action')

const octokit = new Octokit()
const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/')

console.log(process.env)
// See https://developer.github.com/v3/issues/#create-an-issue
octokit
	.request('POST /repos/{owner}/{repo}/issues', {
		owner,
		repo,
		issue_number: 1,
		title: 'My test issue',
		body: process.env.DATA,
	})
	.then((res) => console.log(res))
